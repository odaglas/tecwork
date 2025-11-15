--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: adjunto_tipo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.adjunto_tipo AS ENUM (
    'imagen',
    'video'
);


--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'cliente',
    'tecnico',
    'admin'
);


--
-- Name: cotizacion_estado; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.cotizacion_estado AS ENUM (
    'pendiente',
    'aceptada',
    'rechazada'
);


--
-- Name: documento_estado; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.documento_estado AS ENUM (
    'pendiente',
    'aprobado',
    'rechazado'
);


--
-- Name: pago_estado; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.pago_estado AS ENUM (
    'pendiente_cliente',
    'pagado_retenido',
    'liberado_tecnico',
    'disputa'
);


--
-- Name: ticket_estado; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ticket_estado AS ENUM (
    'abierto',
    'cotizando',
    'en_progreso',
    'finalizado',
    'cancelado'
);


--
-- Name: assign_default_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.assign_default_role() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Assign role based on user metadata set during signup
  -- Defaults to 'cliente' if no role specified
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'role', 'cliente')::app_role
  );
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: calificacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calificacion (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ticket_id uuid NOT NULL,
    cliente_id uuid NOT NULL,
    tecnico_id uuid NOT NULL,
    puntaje integer NOT NULL,
    comentario text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT calificacion_puntaje_check CHECK (((puntaje >= 1) AND (puntaje <= 5)))
);


--
-- Name: cliente_profile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cliente_profile (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    direccion text,
    comuna text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: cotizacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cotizacion (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ticket_id uuid NOT NULL,
    tecnico_id uuid NOT NULL,
    valor_total integer NOT NULL,
    descripcion text NOT NULL,
    tiempo_estimado_dias integer NOT NULL,
    estado public.cotizacion_estado DEFAULT 'pendiente'::public.cotizacion_estado,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: documentacion_tecnico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documentacion_tecnico (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tecnico_id uuid NOT NULL,
    nombre_documento text NOT NULL,
    archivo_url text NOT NULL,
    estado public.documento_estado DEFAULT 'pendiente'::public.documento_estado,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: pago; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pago (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ticket_id uuid NOT NULL,
    cotizacion_id uuid NOT NULL,
    monto_total integer NOT NULL,
    estado_pago public.pago_estado DEFAULT 'pendiente_cliente'::public.pago_estado,
    transbank_token text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    nombre text NOT NULL,
    rut text NOT NULL,
    telefono text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: tecnico_profile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tecnico_profile (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    especialidad_principal text NOT NULL,
    comunas_cobertura text[] DEFAULT '{}'::text[],
    descripcion_perfil text,
    is_validated boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: ticket; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cliente_id uuid NOT NULL,
    titulo text NOT NULL,
    descripcion text NOT NULL,
    categoria text NOT NULL,
    comuna text NOT NULL,
    estado public.ticket_estado DEFAULT 'abierto'::public.ticket_estado,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: ticket_adjunto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket_adjunto (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ticket_id uuid NOT NULL,
    archivo_url text NOT NULL,
    tipo public.adjunto_tipo NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: calificacion calificacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calificacion
    ADD CONSTRAINT calificacion_pkey PRIMARY KEY (id);


--
-- Name: cliente_profile cliente_profile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cliente_profile
    ADD CONSTRAINT cliente_profile_pkey PRIMARY KEY (id);


--
-- Name: cliente_profile cliente_profile_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cliente_profile
    ADD CONSTRAINT cliente_profile_user_id_key UNIQUE (user_id);


--
-- Name: cotizacion cotizacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cotizacion
    ADD CONSTRAINT cotizacion_pkey PRIMARY KEY (id);


--
-- Name: documentacion_tecnico documentacion_tecnico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentacion_tecnico
    ADD CONSTRAINT documentacion_tecnico_pkey PRIMARY KEY (id);


--
-- Name: pago pago_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pago
    ADD CONSTRAINT pago_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_rut_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_rut_key UNIQUE (rut);


--
-- Name: tecnico_profile tecnico_profile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tecnico_profile
    ADD CONSTRAINT tecnico_profile_pkey PRIMARY KEY (id);


--
-- Name: tecnico_profile tecnico_profile_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tecnico_profile
    ADD CONSTRAINT tecnico_profile_user_id_key UNIQUE (user_id);


--
-- Name: ticket_adjunto ticket_adjunto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_adjunto
    ADD CONSTRAINT ticket_adjunto_pkey PRIMARY KEY (id);


--
-- Name: ticket ticket_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket
    ADD CONSTRAINT ticket_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: cliente_profile update_cliente_profile_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cliente_profile_updated_at BEFORE UPDATE ON public.cliente_profile FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: cotizacion update_cotizacion_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cotizacion_updated_at BEFORE UPDATE ON public.cotizacion FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: documentacion_tecnico update_documentacion_tecnico_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_documentacion_tecnico_updated_at BEFORE UPDATE ON public.documentacion_tecnico FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: pago update_pago_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_pago_updated_at BEFORE UPDATE ON public.pago FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tecnico_profile update_tecnico_profile_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tecnico_profile_updated_at BEFORE UPDATE ON public.tecnico_profile FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ticket update_ticket_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ticket_updated_at BEFORE UPDATE ON public.ticket FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: calificacion calificacion_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calificacion
    ADD CONSTRAINT calificacion_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.cliente_profile(id) ON DELETE CASCADE;


--
-- Name: calificacion calificacion_tecnico_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calificacion
    ADD CONSTRAINT calificacion_tecnico_id_fkey FOREIGN KEY (tecnico_id) REFERENCES public.tecnico_profile(id) ON DELETE CASCADE;


--
-- Name: calificacion calificacion_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calificacion
    ADD CONSTRAINT calificacion_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.ticket(id) ON DELETE CASCADE;


--
-- Name: cliente_profile cliente_profile_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cliente_profile
    ADD CONSTRAINT cliente_profile_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: cotizacion cotizacion_tecnico_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cotizacion
    ADD CONSTRAINT cotizacion_tecnico_id_fkey FOREIGN KEY (tecnico_id) REFERENCES public.tecnico_profile(id) ON DELETE CASCADE;


--
-- Name: cotizacion cotizacion_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cotizacion
    ADD CONSTRAINT cotizacion_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.ticket(id) ON DELETE CASCADE;


--
-- Name: documentacion_tecnico documentacion_tecnico_tecnico_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentacion_tecnico
    ADD CONSTRAINT documentacion_tecnico_tecnico_id_fkey FOREIGN KEY (tecnico_id) REFERENCES public.tecnico_profile(id) ON DELETE CASCADE;


--
-- Name: pago pago_cotizacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pago
    ADD CONSTRAINT pago_cotizacion_id_fkey FOREIGN KEY (cotizacion_id) REFERENCES public.cotizacion(id) ON DELETE CASCADE;


--
-- Name: pago pago_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pago
    ADD CONSTRAINT pago_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.ticket(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: tecnico_profile tecnico_profile_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tecnico_profile
    ADD CONSTRAINT tecnico_profile_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ticket_adjunto ticket_adjunto_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_adjunto
    ADD CONSTRAINT ticket_adjunto_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.ticket(id) ON DELETE CASCADE;


--
-- Name: ticket ticket_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket
    ADD CONSTRAINT ticket_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.cliente_profile(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: calificacion Admins can delete calificaciones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete calificaciones" ON public.calificacion FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can manage all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: documentacion_tecnico Admins can update all documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all documents" ON public.documentacion_tecnico FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: tecnico_profile Admins can update any tecnico profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update any tecnico profile" ON public.tecnico_profile FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: calificacion Admins can update calificaciones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update calificaciones" ON public.calificacion FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: documentacion_tecnico Admins can view all documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all documents" ON public.documentacion_tecnico FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: ticket_adjunto Clientes can insert adjuntos to their tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clientes can insert adjuntos to their tickets" ON public.ticket_adjunto FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.ticket t
     JOIN public.cliente_profile cp ON ((t.cliente_id = cp.id)))
  WHERE ((t.id = ticket_adjunto.ticket_id) AND (cp.user_id = auth.uid())))));


--
-- Name: calificacion Clientes can insert calificaciones for their tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clientes can insert calificaciones for their tickets" ON public.calificacion FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.cliente_profile
  WHERE ((cliente_profile.id = calificacion.cliente_id) AND (cliente_profile.user_id = auth.uid())))));


--
-- Name: pago Clientes can insert pagos for their tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clientes can insert pagos for their tickets" ON public.pago FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.ticket t
     JOIN public.cliente_profile cp ON ((t.cliente_id = cp.id)))
  WHERE ((t.id = pago.ticket_id) AND (cp.user_id = auth.uid())))));


--
-- Name: cliente_profile Clientes can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clientes can insert their own profile" ON public.cliente_profile FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: ticket Clientes can insert their own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clientes can insert their own tickets" ON public.ticket FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.cliente_profile
  WHERE ((cliente_profile.id = ticket.cliente_id) AND (cliente_profile.user_id = auth.uid())))));


--
-- Name: cotizacion Clientes can update cotizaciones for their tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clientes can update cotizaciones for their tickets" ON public.cotizacion FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM (public.ticket t
     JOIN public.cliente_profile cp ON ((t.cliente_id = cp.id)))
  WHERE ((t.id = cotizacion.ticket_id) AND (cp.user_id = auth.uid())))));


--
-- Name: cliente_profile Clientes can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clientes can update their own profile" ON public.cliente_profile FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: ticket Clientes can update their own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clientes can update their own tickets" ON public.ticket FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.cliente_profile
  WHERE ((cliente_profile.id = ticket.cliente_id) AND (cliente_profile.user_id = auth.uid())))));


--
-- Name: pago Clientes can update their pending pagos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clientes can update their pending pagos" ON public.pago FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM (public.ticket t
     JOIN public.cliente_profile cp ON ((t.cliente_id = cp.id)))
  WHERE ((t.id = pago.ticket_id) AND (cp.user_id = auth.uid())))) AND (estado_pago = 'pendiente_cliente'::public.pago_estado))) WITH CHECK ((estado_pago = ANY (ARRAY['pendiente_cliente'::public.pago_estado, 'pagado_retenido'::public.pago_estado])));


--
-- Name: cotizacion Clientes can view cotizaciones for their tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clientes can view cotizaciones for their tickets" ON public.cotizacion FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.ticket t
     JOIN public.cliente_profile cp ON ((t.cliente_id = cp.id)))
  WHERE ((t.id = cotizacion.ticket_id) AND (cp.user_id = auth.uid())))));


--
-- Name: pago Clientes can view pagos for their tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clientes can view pagos for their tickets" ON public.pago FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.ticket t
     JOIN public.cliente_profile cp ON ((t.cliente_id = cp.id)))
  WHERE ((t.id = pago.ticket_id) AND (cp.user_id = auth.uid())))));


--
-- Name: calificacion Clientes can view their own calificaciones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clientes can view their own calificaciones" ON public.calificacion FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.cliente_profile
  WHERE ((cliente_profile.id = calificacion.cliente_id) AND (cliente_profile.user_id = auth.uid())))));


--
-- Name: cliente_profile Clientes can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clientes can view their own profile" ON public.cliente_profile FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: ticket Clientes can view their own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clientes can view their own tickets" ON public.ticket FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.cliente_profile
  WHERE ((cliente_profile.id = ticket.cliente_id) AND (cliente_profile.user_id = auth.uid())))));


--
-- Name: tecnico_profile Everyone can view validated tecnicos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view validated tecnicos" ON public.tecnico_profile FOR SELECT USING (((is_validated = true) OR (auth.uid() = user_id)));


--
-- Name: cotizacion Tecnicos can insert cotizaciones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tecnicos can insert cotizaciones" ON public.cotizacion FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.tecnico_profile
  WHERE ((tecnico_profile.id = cotizacion.tecnico_id) AND (tecnico_profile.user_id = auth.uid())))));


--
-- Name: documentacion_tecnico Tecnicos can insert their own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tecnicos can insert their own documents" ON public.documentacion_tecnico FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.tecnico_profile
  WHERE ((tecnico_profile.id = documentacion_tecnico.tecnico_id) AND (tecnico_profile.user_id = auth.uid())))));


--
-- Name: tecnico_profile Tecnicos can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tecnicos can insert their own profile" ON public.tecnico_profile FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: cotizacion Tecnicos can update their own cotizaciones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tecnicos can update their own cotizaciones" ON public.cotizacion FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.tecnico_profile
  WHERE ((tecnico_profile.id = cotizacion.tecnico_id) AND (tecnico_profile.user_id = auth.uid())))));


--
-- Name: tecnico_profile Tecnicos can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tecnicos can update their own profile" ON public.tecnico_profile FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: calificacion Tecnicos can view calificaciones about them; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tecnicos can view calificaciones about them" ON public.calificacion FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.tecnico_profile
  WHERE ((tecnico_profile.id = calificacion.tecnico_id) AND (tecnico_profile.user_id = auth.uid())))));


--
-- Name: pago Tecnicos can view pagos for their cotizaciones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tecnicos can view pagos for their cotizaciones" ON public.pago FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.cotizacion c
     JOIN public.tecnico_profile tp ON ((c.tecnico_id = tp.id)))
  WHERE ((c.id = pago.cotizacion_id) AND (tp.user_id = auth.uid())))));


--
-- Name: cotizacion Tecnicos can view their own cotizaciones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tecnicos can view their own cotizaciones" ON public.cotizacion FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.tecnico_profile
  WHERE ((tecnico_profile.id = cotizacion.tecnico_id) AND (tecnico_profile.user_id = auth.uid())))));


--
-- Name: documentacion_tecnico Tecnicos can view their own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tecnicos can view their own documents" ON public.documentacion_tecnico FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.tecnico_profile
  WHERE ((tecnico_profile.id = documentacion_tecnico.tecnico_id) AND (tecnico_profile.user_id = auth.uid())))));


--
-- Name: ticket Tecnicos can view tickets with cotizaciones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tecnicos can view tickets with cotizaciones" ON public.ticket FOR SELECT USING (((estado = ANY (ARRAY['abierto'::public.ticket_estado, 'cotizando'::public.ticket_estado])) OR (EXISTS ( SELECT 1
   FROM (public.cotizacion c
     JOIN public.tecnico_profile tp ON ((c.tecnico_id = tp.id)))
  WHERE ((c.ticket_id = ticket.id) AND (tp.user_id = auth.uid()))))));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: ticket_adjunto Users can view adjuntos of their tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view adjuntos of their tickets" ON public.ticket_adjunto FOR SELECT USING (((EXISTS ( SELECT 1
   FROM (public.ticket t
     JOIN public.cliente_profile cp ON ((t.cliente_id = cp.id)))
  WHERE ((t.id = ticket_adjunto.ticket_id) AND (cp.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM ((public.ticket t
     JOIN public.cotizacion c ON ((c.ticket_id = t.id)))
     JOIN public.tecnico_profile tp ON ((c.tecnico_id = tp.id)))
  WHERE ((t.id = ticket_adjunto.ticket_id) AND (tp.user_id = auth.uid()))))));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: calificacion; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.calificacion ENABLE ROW LEVEL SECURITY;

--
-- Name: cliente_profile; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cliente_profile ENABLE ROW LEVEL SECURITY;

--
-- Name: cotizacion; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cotizacion ENABLE ROW LEVEL SECURITY;

--
-- Name: documentacion_tecnico; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.documentacion_tecnico ENABLE ROW LEVEL SECURITY;

--
-- Name: pago; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pago ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: tecnico_profile; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tecnico_profile ENABLE ROW LEVEL SECURITY;

--
-- Name: ticket; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ticket ENABLE ROW LEVEL SECURITY;

--
-- Name: ticket_adjunto; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ticket_adjunto ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


