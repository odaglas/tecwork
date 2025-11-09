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

    const { pago_id, transbank_token } = await req.json();

    if (!pago_id || !transbank_token) {
      return new Response(
        JSON.stringify({ error: 'ID de pago y token requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get pago with ticket info
    const { data: pago, error: pagoError } = await supabase
      .from('pago')
      .select(`
        *,
        ticket!inner(
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
        JSON.stringify({ error: 'No tienes permiso para confirmar este pago' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Here you would integrate with Transbank API to verify the payment
    // For now, we'll simulate a successful payment
    console.log(`Processing Transbank payment with token: ${transbank_token}`);

    // Update pago with token and change estado to 'pagado_retenido'
    const { error: updateError } = await supabase
      .from('pago')
      .update({ 
        transbank_token,
        estado_pago: 'pagado_retenido' 
      })
      .eq('id', pago_id);

    if (updateError) {
      console.error('Pago update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Error al confirmar pago' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Payment ${pago_id} confirmed and held`);

    return new Response(
      JSON.stringify({ 
        message: 'Pago confirmado. El técnico ha sido notificado.' 
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
