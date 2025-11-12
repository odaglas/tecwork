import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const CreateCalificacionSchema = z.object({
  ticket_id: z.string().uuid({ message: "ticket_id debe ser un UUID válido" }),
  puntaje: z.number().int().min(1, { message: "puntaje debe ser al menos 1" }).max(5, { message: "puntaje no puede exceder 5" }),
  comentario: z.string().max(1000, { message: "comentario no puede exceder 1000 caracteres" }).trim().optional()
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
    const validatedBody = CreateCalificacionSchema.parse(rawBody);
    const { ticket_id, puntaje, comentario } = validatedBody;

    if (!ticket_id || !puntaje) {
      return new Response(
        JSON.stringify({ error: 'ID de ticket y puntaje requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (puntaje < 1 || puntaje > 5) {
      return new Response(
        JSON.stringify({ error: 'El puntaje debe estar entre 1 y 5' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get cliente profile first
    const { data: clienteProfile, error: clienteError } = await supabase
      .from('cliente_profile')
      .select('id, user_id')
      .eq('user_id', user.id)
      .single();

    if (clienteError || !clienteProfile) {
      console.error('Cliente profile error:', clienteError);
      return new Response(
        JSON.stringify({ error: 'Perfil de cliente no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get ticket with cotizacion info
    const { data: ticket, error: ticketError } = await supabase
      .from('ticket')
      .select(`
        id,
        estado,
        cliente_id,
        cotizacion!inner(
          tecnico_id,
          estado
        )
      `)
      .eq('id', ticket_id)
      .eq('cliente_id', clienteProfile.id)
      .eq('cotizacion.estado', 'aceptada')
      .single();

    if (ticketError || !ticket) {
      console.error('Ticket error:', ticketError);
      return new Response(
        JSON.stringify({ error: 'Ticket no encontrado o no tienes permiso para calificarlo' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is the ticket owner (already checked above but keeping for clarity)
    if (clienteProfile.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'No tienes permiso para calificar este ticket' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify ticket is in 'finalizado' state
    if (ticket.estado !== 'finalizado') {
      return new Response(
        JSON.stringify({ error: 'Solo puedes calificar tickets finalizados' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the accepted cotizacion to find the tecnico_id
    const acceptedCotizacion = Array.isArray(ticket.cotizacion) 
      ? ticket.cotizacion[0] 
      : ticket.cotizacion;

    // Create calificacion
    const { data: calificacion, error: calificacionError } = await supabase
      .from('calificacion')
      .insert({
        ticket_id,
        cliente_id: ticket.cliente_id,
        tecnico_id: acceptedCotizacion.tecnico_id,
        puntaje,
        comentario: comentario || null,
      })
      .select()
      .single();

    if (calificacionError) {
      console.error('Calificacion creation error:', calificacionError);
      return new Response(
        JSON.stringify({ error: 'Error al crear calificación' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Calificacion ${calificacion.id} created for ticket ${ticket_id}`);

    return new Response(
      JSON.stringify({ 
        message: 'Gracias por tu calificación.' 
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
