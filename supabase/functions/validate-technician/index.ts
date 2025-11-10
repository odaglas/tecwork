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

    // Parse request body
    const { tecnico_id, aprobar } = await req.json();

    if (!tecnico_id || typeof aprobar !== 'boolean') {
      return new Response(
        JSON.stringify({ error: 'Parámetros inválidos. Se requiere tecnico_id y aprobar (boolean)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify technician exists
    const { data: techProfile, error: techError } = await supabaseClient
      .from('tecnico_profile')
      .select('id, is_validated')
      .eq('id', tecnico_id)
      .single();

    if (techError || !techProfile) {
      console.error('Error fetching technician:', techError);
      return new Response(
        JSON.stringify({ error: 'Técnico no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update technician validation status
    const { error: updateTechError } = await supabaseClient
      .from('tecnico_profile')
      .update({ is_validated: aprobar })
      .eq('id', tecnico_id);

    if (updateTechError) {
      console.error('Error updating technician:', updateTechError);
      return new Response(
        JSON.stringify({ error: 'Error al actualizar el técnico' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update all documents for this technician
    const newDocStatus = aprobar ? 'aprobado' : 'rechazado';
    const { error: updateDocsError } = await supabaseClient
      .from('documentacion_tecnico')
      .update({ estado: newDocStatus })
      .eq('tecnico_id', tecnico_id)
      .eq('estado', 'pendiente');

    if (updateDocsError) {
      console.error('Error updating documents:', updateDocsError);
      return new Response(
        JSON.stringify({ error: 'Error al actualizar los documentos' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const message = aprobar 
      ? 'Técnico validado con éxito.' 
      : 'Técnico rechazado con éxito.';

    console.log(`Technician ${tecnico_id} validation status updated: ${aprobar ? 'approved' : 'rejected'}`);

    return new Response(
      JSON.stringify({ message, tecnico_id, aprobar }),
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
