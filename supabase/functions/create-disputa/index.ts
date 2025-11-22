import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CreateDisputaSchema = z.object({
  pago_id: z.string().uuid({ message: "pago_id debe ser un UUID válido" }),
  motivo: z.string().min(1, { message: "El motivo es requerido" }).max(100),
  descripcion: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres" }).max(1000)
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
    const validatedBody = CreateDisputaSchema.parse(rawBody);
    const { pago_id, motivo, descripcion } = validatedBody;

    // Get payment details with relationships
    const { data: pago, error: pagoError } = await supabase
      .from('pago')
      .select(`
        *,
        ticket:ticket_id!inner(
          id,
          cliente_id,
          cliente_profile!inner(user_id)
        ),
        cotizacion:cotizacion_id!inner(
          tecnico_id,
          tecnico_profile!inner(user_id)
        )
      `)
      .eq('id', pago_id)
      .single();

    if (pagoError || !pago) {
      console.error('Payment error:', pagoError);
      return new Response(
        JSON.stringify({ error: 'Pago no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine if user is cliente or tecnico
    const isCliente = pago.ticket.cliente_profile.user_id === user.id;
    const isTecnico = pago.cotizacion.tecnico_profile.user_id === user.id;

    if (!isCliente && !isTecnico) {
      return new Response(
        JSON.stringify({ error: 'No tienes permiso para crear una disputa sobre este pago' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if payment can be disputed (must be pagado_retenido or liberado_tecnico)
    if (!['pagado_retenido', 'liberado_tecnico'].includes(pago.estado_pago)) {
      return new Response(
        JSON.stringify({ error: 'Este pago no puede ser disputado en su estado actual' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if there's already an active dispute
    const { data: existingDispute } = await supabase
      .from('disputas')
      .select('id')
      .eq('pago_id', pago_id)
      .in('estado', ['pendiente', 'en_revision'])
      .maybeSingle();

    if (existingDispute) {
      return new Response(
        JSON.stringify({ error: 'Ya existe una disputa activa para este pago' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create dispute
    const { data: disputa, error: disputaError } = await supabase
      .from('disputas')
      .insert({
        pago_id,
        iniciado_por: user.id,
        tipo_iniciador: isCliente ? 'cliente' : 'tecnico',
        motivo,
        descripcion,
        estado: 'pendiente'
      })
      .select()
      .single();

    if (disputaError) {
      console.error('Dispute creation error:', disputaError);
      return new Response(
        JSON.stringify({ error: 'Error al crear la disputa' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update payment status to disputa
    const { error: pagoUpdateError } = await supabase
      .from('pago')
      .update({ estado_pago: 'disputa' })
      .eq('id', pago_id);

    if (pagoUpdateError) {
      console.error('Payment update error:', pagoUpdateError);
    }

    console.log(`Dispute created: ${disputa.id} by ${isCliente ? 'cliente' : 'tecnico'}`);

    return new Response(
      JSON.stringify({ 
        message: 'Disputa creada exitosamente',
        disputa
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    
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
