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

    const { pago_id } = await req.json();

    if (!pago_id) {
      return new Response(
        JSON.stringify({ error: 'ID de pago requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get pago with ticket info
    const { data: pago, error: pagoError } = await supabase
      .from('pago')
      .select(`
        *,
        ticket!inner(
          id,
          cliente_id,
          cliente_profile!inner(
            user_id
          )
        )
      `)
      .eq('id', pago_id)
      .single();

    if (pagoError || !pago) {
      console.error('Pago error:', pagoError);
      return new Response(
        JSON.stringify({ error: 'Pago no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is the pago owner
    if (pago.ticket.cliente_profile.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'No tienes permiso para liberar este pago' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify payment is in 'pagado_retenido' state
    if (pago.estado_pago !== 'pagado_retenido') {
      return new Response(
        JSON.stringify({ error: 'El pago debe estar en estado "pagado_retenido" para liberarse' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update pago estado to 'liberado_tecnico'
    const { error: pagoUpdateError } = await supabase
      .from('pago')
      .update({ estado_pago: 'liberado_tecnico' })
      .eq('id', pago_id);

    if (pagoUpdateError) {
      console.error('Pago update error:', pagoUpdateError);
      return new Response(
        JSON.stringify({ error: 'Error al liberar pago' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update ticket estado to 'finalizado'
    const { error: ticketUpdateError } = await supabase
      .from('ticket')
      .update({ estado: 'finalizado' })
      .eq('id', pago.ticket_id);

    if (ticketUpdateError) {
      console.error('Ticket update error:', ticketUpdateError);
      return new Response(
        JSON.stringify({ error: 'Error al finalizar ticket' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Payment ${pago_id} released to technician, ticket ${pago.ticket_id} finalized`);

    return new Response(
      JSON.stringify({ 
        message: 'Pago liberado al técnico. El servicio está completo.' 
      }),
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
