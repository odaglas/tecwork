import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'No autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role
    const { data: hasAdminRole, error: roleError } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });

    if (roleError || !hasAdminRole) {
      console.error('Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'No tienes permisos de administrador' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get pending technician validations
    const { data: pendingTechnicians, error: techError } = await supabaseClient
      .from('tecnico_profile')
      .select(`
        id,
        user_id,
        especialidad_principal,
        comunas_cobertura,
        descripcion_perfil,
        is_validated,
        created_at,
        profiles!inner (
          nombre,
          rut,
          email,
          telefono
        ),
        documentacion_tecnico (
          id,
          nombre_documento,
          archivo_url,
          estado,
          created_at
        )
      `)
      .eq('is_validated', false);

    if (techError) {
      console.error('Error fetching pending technicians:', techError);
      return new Response(
        JSON.stringify({ error: 'Error al obtener validaciones pendientes' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter to only include technicians with pending documents
    const techniciansWithPendingDocs = pendingTechnicians?.filter(tech => 
      tech.documentacion_tecnico && 
      tech.documentacion_tecnico.some((doc: any) => doc.estado === 'pendiente')
    ) || [];

    console.log(`Found ${techniciansWithPendingDocs.length} technicians with pending validations`);

    return new Response(
      JSON.stringify(techniciansWithPendingDocs),
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
