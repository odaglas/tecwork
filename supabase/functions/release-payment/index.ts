import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const ReleasePaymentSchema = z.object({
  pago_id: z.string().uuid({ message: "pago_id debe ser un UUID válido" })
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
    const validatedBody = ReleasePaymentSchema.parse(rawBody);
    const { pago_id } = validatedBody;

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

    // Check if user is admin
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    
    const isAdmin = userRoles?.some(r => r.role === 'admin');

    // Verify user is either the pago owner or an admin
    if (pago.ticket.cliente_profile.user_id !== user.id && !isAdmin) {
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

    // Calculate commission (15%)
    const comisionPorcentaje = 15;
    const comisionMonto = Math.floor(pago.monto_total * (comisionPorcentaje / 100));
    const montoNeto = pago.monto_total - comisionMonto;

    console.log(`Payment breakdown - Total: ${pago.monto_total}, Commission (${comisionPorcentaje}%): ${comisionMonto}, Net: ${montoNeto}`);

    // Update pago with commission and change estado to 'liberado_tecnico'
    const { error: pagoUpdateError } = await supabase
      .from('pago')
      .update({ 
        estado_pago: 'liberado_tecnico',
        comision_porcentaje: comisionPorcentaje,
        comision_monto: comisionMonto,
        monto_neto: montoNeto
      })
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
