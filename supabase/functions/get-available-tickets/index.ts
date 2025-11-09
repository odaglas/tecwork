import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization')!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is a technician
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'tecnico');

    if (rolesError || !roles || roles.length === 0) {
      console.error('Role check error:', rolesError);
      return new Response(
        JSON.stringify({ error: 'Acceso denegado. Solo técnicos pueden ver tickets.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get technician profile
    const { data: tecnicoProfile, error: profileError } = await supabase
      .from('tecnico_profile')
      .select('especialidad_principal, comunas_cobertura, is_validated')
      .eq('user_id', user.id)
      .single();

    if (profileError || !tecnicoProfile) {
      console.error('Profile error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Perfil de técnico no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get available tickets matching technician's specialty and coverage areas
    const { data: tickets, error: ticketsError } = await supabase
      .from('ticket')
      .select(`
        *,
        cliente_profile!inner(
          comuna
        )
      `)
      .eq('estado', 'abierto')
      .eq('categoria', tecnicoProfile.especialidad_principal)
      .in('cliente_profile.comuna', tecnicoProfile.comunas_cobertura || []);

    if (ticketsError) {
      console.error('Tickets query error:', ticketsError);
      return new Response(
        JSON.stringify({ error: 'Error al obtener tickets' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${tickets?.length || 0} available tickets for technician ${user.id}`);

    return new Response(
      JSON.stringify({ tickets: tickets || [] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
