import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const AcceptCotizacionSchema = z.object({
  cotizacion_id: z.string().uuid({ message: "cotizacion_id debe ser un UUID válido" })
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
    const validatedBody = AcceptCotizacionSchema.parse(rawBody);
    const { cotizacion_id } = validatedBody;

    // Get cotizacion with ticket info
    const { data: cotizacion, error: cotizacionError } = await supabase
      .from('cotizacion')
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
      .eq('id', cotizacion_id)
      .single();

    if (cotizacionError || !cotizacion) {
      console.error('Cotizacion error:', cotizacionError);
      return new Response(
        JSON.stringify({ error: 'Cotización no encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is the ticket owner
    if (cotizacion.ticket.cliente_profile.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'No tienes permiso para aceptar esta cotización' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update this cotizacion to 'aceptada'
    const { error: acceptError } = await supabase
      .from('cotizacion')
      .update({ estado: 'aceptada' })
      .eq('id', cotizacion_id);

    if (acceptError) {
      console.error('Accept error:', acceptError);
      return new Response(
        JSON.stringify({ error: 'Error al aceptar cotización' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Reject other cotizaciones for this ticket
    const { error: rejectError } = await supabase
      .from('cotizacion')
      .update({ estado: 'rechazada' })
      .eq('ticket_id', cotizacion.ticket_id)
      .neq('id', cotizacion_id);

    if (rejectError) {
      console.error('Reject error:', rejectError);
    }

    // Create pago entry
    const { data: pago, error: pagoError } = await supabase
      .from('pago')
      .insert({
        ticket_id: cotizacion.ticket_id,
        cotizacion_id: cotizacion.id,
        monto_total: cotizacion.valor_total,
        estado_pago: 'pendiente_cliente',
      })
      .select()
      .single();

    if (pagoError) {
      console.error('Pago creation error:', pagoError);
      return new Response(
        JSON.stringify({ error: 'Error al crear pago' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update ticket state to 'en_progreso'
    const { error: ticketError } = await supabase
      .from('ticket')
      .update({ estado: 'en_progreso' })
      .eq('id', cotizacion.ticket_id);

    if (ticketError) {
      console.error('Ticket update error:', ticketError);
    }

    console.log(`Cotizacion ${cotizacion_id} accepted, pago ${pago.id} created`);

    return new Response(
      JSON.stringify({ 
        pago_id: pago.id,
        monto_total: pago.monto_total,
        transbank_init_data: {
          // This would be replaced with actual Transbank integration
          redirect_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/confirm-payment`,
          token: pago.id,
        }
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
