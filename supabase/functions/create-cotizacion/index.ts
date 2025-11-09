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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get request body
    const { ticket_id, valor_total, descripcion, tiempo_estimado_dias } = await req.json();

    if (!ticket_id || !valor_total || !descripcion || !tiempo_estimado_dias) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get technician profile and verify they're validated
    const { data: tecnicoProfile, error: profileError } = await supabase
      .from('tecnico_profile')
      .select('id, is_validated')
      .eq('user_id', user.id)
      .single();

    if (profileError || !tecnicoProfile) {
      console.error('Profile error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Perfil de técnico no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tecnicoProfile.is_validated) {
      return new Response(
        JSON.stringify({ error: 'Tu perfil debe estar validado para enviar cotizaciones' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify ticket exists and is in 'abierto' state
    const { data: ticket, error: ticketError } = await supabase
      .from('ticket')
      .select('estado')
      .eq('id', ticket_id)
      .single();

    if (ticketError || !ticket) {
      console.error('Ticket error:', ticketError);
      return new Response(
        JSON.stringify({ error: 'Ticket no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create cotizacion
    const { data: cotizacion, error: cotizacionError } = await supabase
      .from('cotizacion')
      .insert({
        ticket_id,
        tecnico_id: tecnicoProfile.id,
        valor_total,
        descripcion,
        tiempo_estimado_dias,
        estado: 'pendiente',
      })
      .select()
      .single();

    if (cotizacionError) {
      console.error('Cotizacion creation error:', cotizacionError);
      return new Response(
        JSON.stringify({ error: 'Error al crear cotización' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update ticket state to 'cotizando'
    const { error: updateError } = await supabase
      .from('ticket')
      .update({ estado: 'cotizando' })
      .eq('id', ticket_id);

    if (updateError) {
      console.error('Ticket update error:', updateError);
    }

    console.log(`Cotizacion ${cotizacion.id} created for ticket ${ticket_id}`);

    return new Response(
      JSON.stringify({ 
        cotizacion_id: cotizacion.id, 
        message: 'Cotización enviada' 
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
