import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ResolveDisputaSchema = z.object({
  disputa_id: z.string().uuid({ message: "disputa_id debe ser un UUID válido" }),
  resolucion: z.enum(['aprobar_cliente', 'aprobar_tecnico', 'rechazar'], {
    errorMap: () => ({ message: "Resolución debe ser 'aprobar_cliente', 'aprobar_tecnico', o 'rechazar'" })
  }),
  resolucion_admin: z.string().min(10, { message: "La explicación debe tener al menos 10 caracteres" }).max(1000)
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

    // Check if user is admin
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    
    const isAdmin = userRoles?.some(r => r.role === 'admin');
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Solo los administradores pueden resolver disputas' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate input
    const rawBody = await req.json();
    const validatedBody = ResolveDisputaSchema.parse(rawBody);
    const { disputa_id, resolucion, resolucion_admin } = validatedBody;

    // Get dispute details
    const { data: disputa, error: disputaError } = await supabase
      .from('disputas')
      .select('*, pago:pago_id(*)')
      .eq('id', disputa_id)
      .single();

    if (disputaError || !disputa) {
      console.error('Dispute error:', disputaError);
      return new Response(
        JSON.stringify({ error: 'Disputa no encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (disputa.estado === 'resuelta' || disputa.estado === 'rechazada') {
      return new Response(
        JSON.stringify({ error: 'Esta disputa ya ha sido resuelta' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let newPaymentStatus = disputa.pago.estado_pago;
    let disputaStatus = 'resuelta';

    if (resolucion === 'aprobar_cliente') {
      // Return to pagado_retenido (client keeps the money)
      newPaymentStatus = 'pagado_retenido';
      disputaStatus = 'resuelta';
    } else if (resolucion === 'aprobar_tecnico') {
      // Set to liberado_tecnico (release payment to technician)
      newPaymentStatus = 'liberado_tecnico';
      disputaStatus = 'resuelta';
      
      // Calculate commission if not already calculated
      if (!disputa.pago.comision_monto) {
        const comisionPorcentaje = 15;
        const comisionMonto = Math.floor(disputa.pago.monto_total * (comisionPorcentaje / 100));
        const montoNeto = disputa.pago.monto_total - comisionMonto;

        await supabase
          .from('pago')
          .update({ 
            comision_porcentaje: comisionPorcentaje,
            comision_monto: comisionMonto,
            monto_neto: montoNeto
          })
          .eq('id', disputa.pago_id);
      }
    } else if (resolucion === 'rechazar') {
      // Keep current payment status, just reject dispute
      disputaStatus = 'rechazada';
    }

    // Update dispute
    const { error: updateDisputaError } = await supabase
      .from('disputas')
      .update({
        estado: disputaStatus,
        resolucion_admin,
        resuelto_por: user.id
      })
      .eq('id', disputa_id);

    if (updateDisputaError) {
      console.error('Dispute update error:', updateDisputaError);
      return new Response(
        JSON.stringify({ error: 'Error al actualizar la disputa' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update payment status
    const { error: pagoUpdateError } = await supabase
      .from('pago')
      .update({ estado_pago: newPaymentStatus })
      .eq('id', disputa.pago_id);

    if (pagoUpdateError) {
      console.error('Payment update error:', pagoUpdateError);
      return new Response(
        JSON.stringify({ error: 'Error al actualizar el pago' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Dispute ${disputa_id} resolved with: ${resolucion}`);

    return new Response(
      JSON.stringify({ 
        message: 'Disputa resuelta exitosamente',
        resolucion
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
