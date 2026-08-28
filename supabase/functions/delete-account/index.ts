// Recharj — Edge Function: delete-account
//
// Deletes the calling user's own auth account. This has to run server-side
// with the service_role key: the client only ever holds the anon key, and
// deleting an auth.users row (as opposed to a public-schema row governed by
// RLS) requires the Supabase Admin API, which the service_role key must
// never leave a server context.
//
// The user is identified from their own JWT (the Authorization header
// forwarded automatically by supabase-js's functions.invoke), never from an
// id passed in the request body — that's what stops one account from being
// able to delete another. profiles/events/course_progress all reference
// auth.users(id) on delete cascade, so deleting the auth user clears
// everything else in one step.
//
// Deploy with: supabase functions deploy delete-account

import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await callerClient.auth.getUser();
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401 });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userData.user.id);
  if (deleteError) {
    return new Response(JSON.stringify({ error: deleteError.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
