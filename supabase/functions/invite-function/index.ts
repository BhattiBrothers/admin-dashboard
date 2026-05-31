// Supabase Edge Function: invite-member
// -----------------------------------------------------------------------------
// Server-side invitation logic that must NOT be trusted to the client. It:
//   1. validates the input (organization_id + email),
//   2. identifies the caller from their JWT,
//   3. verifies the caller is the organization's admin (created_by),
//   4. prevents duplicate invitations to the same email in the same org,
//   5. creates the invitation record (status = 'invited').
//
// The service-role key lives ONLY here (auto-injected as SUPABASE_SERVICE_ROLE_KEY)
// and never reaches the client bundle. The "send the email" step would plug in
// where noted below.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  // --- 1. Validate input ---------------------------------------------------
  let payload: { organization_id?: unknown; email?: unknown }
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const organizationId =
    typeof payload.organization_id === 'string'
      ? payload.organization_id.trim()
      : ''
  const email =
    typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : ''

  if (!organizationId) {
    return json({ error: 'organization_id is required' }, 400)
  }
  if (!EMAIL_RE.test(email)) {
    return json({ error: 'A valid email is required' }, 400)
  }

  // --- 2. Identify the caller from their JWT -------------------------------
  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) {
    return json({ error: 'Missing authorization token' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const {
    data: { user },
    error: userError,
  } = await admin.auth.getUser(token)

  if (userError || !user) {
    return json({ error: 'Invalid or expired session' }, 401)
  }

  // --- 3. Verify the caller owns (is admin of) the organization ------------
  const { data: org, error: orgError } = await admin
    .from('organizations')
    .select('id, created_by')
    .eq('id', organizationId)
    .maybeSingle()

  if (orgError) {
    return json({ error: orgError.message }, 500)
  }
  if (!org || org.created_by !== user.id) {
    // Don't leak existence — same response whether missing or not owned.
    return json({ error: 'You do not have access to this organization' }, 403)
  }

  // --- 4. Prevent duplicate invitations (case-insensitive) -----------------
  const { data: existing, error: existingError } = await admin
    .from('organization_members')
    .select('id')
    .eq('organization_id', organizationId)
    .ilike('email', email)
    .maybeSingle()

  if (existingError) {
    return json({ error: existingError.message }, 500)
  }
  if (existing) {
    return json({ error: 'This email has already been invited' }, 409)
  }

  // --- 5. Create the invitation record -------------------------------------
  const { data: member, error: insertError } = await admin
    .from('organization_members')
    .insert({
      organization_id: organizationId,
      email,
      status: 'invited',
      role: 'member',
    })
    .select()
    .single()

  if (insertError) {
    // Unique index is the final guard against a race on duplicates.
    if (insertError.code === '23505') {
      return json({ error: 'This email has already been invited' }, 409)
    }
    return json({ error: insertError.message }, 500)
  }

  // TODO: send the invitation email here (e.g. Resend / Supabase Auth invite).
  // The DB record above is enough for this assessment; this is the seam where
  // the real email-send step would plug in.

  return json({ member }, 201)
})
