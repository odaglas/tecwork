import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email y contraseña son requeridos.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role to bypass RLS for auth check
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create regular Supabase client for authentication
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    console.log('Admin login attempt for:', email);

    // Step 1: Authenticate the user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Credenciales de administrador incorrectas.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = authData.user.id;

    // Step 2: Check if user has admin role using the has_role function
    const { data: hasAdminRole, error: roleCheckError } = await supabaseAdmin.rpc('has_role', {
      _user_id: userId,
      _role: 'admin'
    });

    if (roleCheckError) {
      console.error('Role check error:', roleCheckError);
      return new Response(
        JSON.stringify({ error: 'Error verificando permisos de administrador.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: If user is not admin, reject
    if (!hasAdminRole) {
      console.log('User is not an admin:', userId);
      return new Response(
        JSON.stringify({ error: 'Acceso no autorizado. Solo administradores pueden usar este portal.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 4: Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('nombre, email, rut')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
    }

    console.log('Admin login successful for:', email);

    // Return success with token and user data
    return new Response(
      JSON.stringify({
        token: authData.session.access_token,
        user: {
          id: userId,
          email: authData.user.email,
          nombre: profile?.nombre || 'Admin',
          role: 'admin'
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in admin-login:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
