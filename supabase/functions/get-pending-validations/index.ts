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

    // Get pending technician profiles
    const { data: tecnicoProfiles, error: techError } = await supabaseClient
      .from('tecnico_profile')
      .select('*')
      .eq('is_validated', false);

    if (techError) {
      console.error('Error fetching pending technicians:', techError);
      return new Response(
        JSON.stringify({ error: 'Error al obtener validaciones pendientes' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tecnicoProfiles || tecnicoProfiles.length === 0) {
      return new Response(
        JSON.stringify([]),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user IDs
    const userIds = tecnicoProfiles.map(tp => tp.user_id);

    // Get profiles for these users
    const { data: profiles, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, nombre, rut, email, telefono')
      .in('id', userIds);

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      return new Response(
        JSON.stringify({ error: 'Error al obtener perfiles' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get documents for these technicians
    const tecnicoIds = tecnicoProfiles.map(tp => tp.id);
    const { data: documents, error: docError } = await supabaseClient
      .from('documentacion_tecnico')
      .select('*')
      .in('tecnico_id', tecnicoIds);

    if (docError) {
      console.error('Error fetching documents:', docError);
      return new Response(
        JSON.stringify({ error: 'Error al obtener documentos' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Combine the data
    const pendingTechnicians = tecnicoProfiles.map(tech => {
      const profile = profiles?.find(p => p.id === tech.user_id);
      const techDocuments = documents?.filter(d => d.tecnico_id === tech.id) || [];
      
      return {
        id: tech.id,
        user_id: tech.user_id,
        especialidad_principal: tech.especialidad_principal,
        comunas_cobertura: tech.comunas_cobertura,
        descripcion_perfil: tech.descripcion_perfil,
        is_validated: tech.is_validated,
        created_at: tech.created_at,
        profile: profile ? {
          nombre: profile.nombre,
          rut: profile.rut,
          email: profile.email,
          telefono: profile.telefono
        } : null,
        documents: techDocuments
      };
    });

    // Filter to only include technicians with pending documents
    const techniciansWithPendingDocs = pendingTechnicians.filter(tech => 
      tech.documents && 
      tech.documents.some((doc: any) => doc.estado === 'pendiente')
    );

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
