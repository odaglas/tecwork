import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const ConfirmPaymentSchema = z.object({
  pago_id: z.string().uuid({ message: "pago_id debe ser un UUID válido" }),
  transbank_token: z.string().min(10, { message: "transbank_token debe tener al menos 10 caracteres" }).max(200, { message: "transbank_token no puede exceder 200 caracteres" }).trim()
});

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

    // Parse and validate input
    const rawBody = await req.json();
    const validatedBody = ConfirmPaymentSchema.parse(rawBody);
    const { pago_id, transbank_token } = validatedBody;

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
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: 'Datos inválidos', 
          details: error.errors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
