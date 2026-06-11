import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { username, otp, newPassword } = await req.json();

    if (!username || !otp || !newPassword) {
      throw new Error('Username, OTP, and new password are required.');
    }

    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    // Create a Supabase client with the service_role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Find the player and verify the OTP
    const { data: player, error: playerError } = await supabaseAdmin
      .from('players')
      .select('id, recovery_otp')
      .eq('username', username)
      .single();

    if (playerError) throw playerError;

    if (!player || player.recovery_otp !== otp) {
      throw new Error('Invalid username or OTP.');
    }

    // 2. Update the user's password in Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      player.id,
      { password: newPassword }
    );

    if (authError) throw authError;

    // 3. Clear the OTP from the players table
    await supabaseAdmin
      .from('players')
      .update({ recovery_otp: null })
      .eq('id', player.id);

    return new Response(JSON.stringify({ message: 'Password updated successfully.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    return new Response(String(err?.message ?? err), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});