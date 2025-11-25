import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user making the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No autorizado');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('No autorizado');
    }

    const { ticketId } = await req.json();

    if (!ticketId) {
      throw new Error('ticketId es requerido');
    }

    console.log('Procesando solicitud de finalización para ticket:', ticketId);

    // Use service role client for privileged operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from('ticket')
      .select('*, cliente_id, titulo')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      throw new Error('Ticket no encontrado');
    }

    // Get cliente user_id
    const { data: clienteProfile, error: clienteError } = await supabase
      .from('cliente_profile')
      .select('user_id')
      .eq('id', ticket.cliente_id)
      .single();

    if (clienteError || !clienteProfile) {
      throw new Error('Cliente no encontrado');
    }

    // Get accepted cotizacion to get tecnico info
    const { data: cotizacion, error: cotizacionError } = await supabase
      .from('cotizacion')
      .select('tecnico_id')
      .eq('ticket_id', ticketId)
      .eq('estado', 'aceptada')
      .single();

    if (cotizacionError || !cotizacion) {
      throw new Error('Cotización aceptada no encontrada');
    }

    // Verify that the authenticated user is the tecnico assigned to this ticket
    const { data: tecnicoProfile, error: tecnicoVerifyError } = await supabase
      .from('tecnico_profile')
      .select('user_id')
      .eq('id', cotizacion.tecnico_id)
      .single();

    if (tecnicoVerifyError || !tecnicoProfile || tecnicoProfile.user_id !== user.id) {
      throw new Error('No autorizado para solicitar finalización de este ticket');
    }

    // Get tecnico name
    const { data: tecnicoUser, error: tecnicoUserError } = await supabase
      .from('profiles')
      .select('nombre')
      .eq('id', tecnicoProfile.user_id)
      .single();

    const tecnicoNombre = tecnicoUser?.nombre || 'Técnico';

    // Create notification for cliente
    const { error: clienteNotifError } = await supabase
      .from('notifications')
      .insert({
        user_id: clienteProfile.user_id,
        type: 'completion_request',
        title: 'Solicitud de Finalización',
        message: `${tecnicoNombre} solicita marcar como finalizado el ticket "${ticket.titulo}"`,
        link: `/cliente/ticket/${ticketId}`,
        metadata: { ticket_id: ticketId, tecnico_id: cotizacion.tecnico_id }
      });

    if (clienteNotifError) {
      console.error('Error creando notificación para cliente:', clienteNotifError);
    }

    // Get all admin users
    const { data: adminRoles, error: adminRolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (!adminRolesError && adminRoles) {
      // Create notification for each admin
      for (const adminRole of adminRoles) {
        const { error: adminNotifError } = await supabase
          .from('notifications')
          .insert({
            user_id: adminRole.user_id,
            type: 'completion_request',
            title: 'Solicitud de Finalización de Ticket',
            message: `${tecnicoNombre} solicita finalizar el ticket "${ticket.titulo}"`,
            link: `/admin/ticket/${ticketId}`,
            metadata: { ticket_id: ticketId, tecnico_id: cotizacion.tecnico_id }
          });

        if (adminNotifError) {
          console.error('Error creando notificación para admin:', adminNotifError);
        }
      }
    }

    console.log('Notificaciones de finalización enviadas exitosamente');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Solicitud de finalización enviada al cliente y administradores'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Error desconocido' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});