-- Create enums for the application
CREATE TYPE public.app_role AS ENUM ('cliente', 'tecnico', 'admin');
CREATE TYPE public.documento_estado AS ENUM ('pendiente', 'aprobado', 'rechazado');
CREATE TYPE public.ticket_estado AS ENUM ('abierto', 'cotizando', 'en_progreso', 'finalizado', 'cancelado');
CREATE TYPE public.adjunto_tipo AS ENUM ('imagen', 'video');
CREATE TYPE public.cotizacion_estado AS ENUM ('pendiente', 'aceptada', 'rechazada');
CREATE TYPE public.pago_estado AS ENUM ('pendiente_cliente', 'pagado_retenido', 'liberado_tecnico', 'disputa');

-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nombre TEXT NOT NULL,
  rut TEXT UNIQUE NOT NULL,
  telefono TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table (for role management)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create cliente_profile table
CREATE TABLE public.cliente_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  direccion TEXT,
  comuna TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cliente_profile ENABLE ROW LEVEL SECURITY;

-- Create tecnico_profile table
CREATE TABLE public.tecnico_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  especialidad_principal TEXT NOT NULL,
  comunas_cobertura TEXT[] DEFAULT '{}',
  descripcion_perfil TEXT,
  is_validated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tecnico_profile ENABLE ROW LEVEL SECURITY;

-- Create documentacion_tecnico table
CREATE TABLE public.documentacion_tecnico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tecnico_id UUID NOT NULL REFERENCES public.tecnico_profile(id) ON DELETE CASCADE,
  nombre_documento TEXT NOT NULL,
  archivo_url TEXT NOT NULL,
  estado public.documento_estado DEFAULT 'pendiente',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.documentacion_tecnico ENABLE ROW LEVEL SECURITY;

-- Create ticket table
CREATE TABLE public.ticket (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.cliente_profile(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  categoria TEXT NOT NULL,
  comuna TEXT NOT NULL,
  estado public.ticket_estado DEFAULT 'abierto',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ticket ENABLE ROW LEVEL SECURITY;

-- Create ticket_adjunto table
CREATE TABLE public.ticket_adjunto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.ticket(id) ON DELETE CASCADE,
  archivo_url TEXT NOT NULL,
  tipo public.adjunto_tipo NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ticket_adjunto ENABLE ROW LEVEL SECURITY;

-- Create cotizacion table
CREATE TABLE public.cotizacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.ticket(id) ON DELETE CASCADE,
  tecnico_id UUID NOT NULL REFERENCES public.tecnico_profile(id) ON DELETE CASCADE,
  valor_total INTEGER NOT NULL,
  descripcion TEXT NOT NULL,
  tiempo_estimado_dias INTEGER NOT NULL,
  estado public.cotizacion_estado DEFAULT 'pendiente',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cotizacion ENABLE ROW LEVEL SECURITY;

-- Create pago table
CREATE TABLE public.pago (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.ticket(id) ON DELETE CASCADE,
  cotizacion_id UUID NOT NULL REFERENCES public.cotizacion(id) ON DELETE CASCADE,
  monto_total INTEGER NOT NULL,
  estado_pago public.pago_estado DEFAULT 'pendiente_cliente',
  transbank_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pago ENABLE ROW LEVEL SECURITY;

-- Create calificacion table
CREATE TABLE public.calificacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.ticket(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.cliente_profile(id) ON DELETE CASCADE,
  tecnico_id UUID NOT NULL REFERENCES public.tecnico_profile(id) ON DELETE CASCADE,
  puntaje INTEGER NOT NULL CHECK (puntaje >= 1 AND puntaje <= 5),
  comentario TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.calificacion ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cliente_profile_updated_at
  BEFORE UPDATE ON public.cliente_profile
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tecnico_profile_updated_at
  BEFORE UPDATE ON public.tecnico_profile
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ticket_updated_at
  BEFORE UPDATE ON public.ticket
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cotizacion_updated_at
  BEFORE UPDATE ON public.cotizacion
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pago_updated_at
  BEFORE UPDATE ON public.pago
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documentacion_tecnico_updated_at
  BEFORE UPDATE ON public.documentacion_tecnico
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for profiles table
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for user_roles table
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for cliente_profile table
CREATE POLICY "Clientes can view their own profile"
  ON public.cliente_profile FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Clientes can update their own profile"
  ON public.cliente_profile FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Clientes can insert their own profile"
  ON public.cliente_profile FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for tecnico_profile table
CREATE POLICY "Everyone can view validated tecnicos"
  ON public.tecnico_profile FOR SELECT
  USING (is_validated = TRUE OR auth.uid() = user_id);

CREATE POLICY "Tecnicos can update their own profile"
  ON public.tecnico_profile FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Tecnicos can insert their own profile"
  ON public.tecnico_profile FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update any tecnico profile"
  ON public.tecnico_profile FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for documentacion_tecnico table
CREATE POLICY "Tecnicos can view their own documents"
  ON public.documentacion_tecnico FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tecnico_profile
    WHERE id = documentacion_tecnico.tecnico_id AND user_id = auth.uid()
  ));

CREATE POLICY "Tecnicos can insert their own documents"
  ON public.documentacion_tecnico FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.tecnico_profile
    WHERE id = documentacion_tecnico.tecnico_id AND user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all documents"
  ON public.documentacion_tecnico FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all documents"
  ON public.documentacion_tecnico FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for ticket table
CREATE POLICY "Clientes can view their own tickets"
  ON public.ticket FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.cliente_profile
    WHERE id = ticket.cliente_id AND user_id = auth.uid()
  ));

CREATE POLICY "Clientes can insert their own tickets"
  ON public.ticket FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.cliente_profile
    WHERE id = ticket.cliente_id AND user_id = auth.uid()
  ));

CREATE POLICY "Clientes can update their own tickets"
  ON public.ticket FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.cliente_profile
    WHERE id = ticket.cliente_id AND user_id = auth.uid()
  ));

CREATE POLICY "Tecnicos can view tickets with cotizaciones"
  ON public.ticket FOR SELECT
  USING (
    ticket.estado IN ('abierto', 'cotizando') OR
    EXISTS (
      SELECT 1 FROM public.cotizacion c
      INNER JOIN public.tecnico_profile tp ON c.tecnico_id = tp.id
      WHERE c.ticket_id = ticket.id AND tp.user_id = auth.uid()
    )
  );

-- RLS Policies for ticket_adjunto table
CREATE POLICY "Users can view adjuntos of their tickets"
  ON public.ticket_adjunto FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.ticket t
    INNER JOIN public.cliente_profile cp ON t.cliente_id = cp.id
    WHERE t.id = ticket_adjunto.ticket_id AND cp.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.ticket t
    INNER JOIN public.cotizacion c ON c.ticket_id = t.id
    INNER JOIN public.tecnico_profile tp ON c.tecnico_id = tp.id
    WHERE t.id = ticket_adjunto.ticket_id AND tp.user_id = auth.uid()
  ));

CREATE POLICY "Clientes can insert adjuntos to their tickets"
  ON public.ticket_adjunto FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.ticket t
    INNER JOIN public.cliente_profile cp ON t.cliente_id = cp.id
    WHERE t.id = ticket_adjunto.ticket_id AND cp.user_id = auth.uid()
  ));

-- RLS Policies for cotizacion table
CREATE POLICY "Clientes can view cotizaciones for their tickets"
  ON public.cotizacion FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.ticket t
    INNER JOIN public.cliente_profile cp ON t.cliente_id = cp.id
    WHERE t.id = cotizacion.ticket_id AND cp.user_id = auth.uid()
  ));

CREATE POLICY "Tecnicos can view their own cotizaciones"
  ON public.cotizacion FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tecnico_profile
    WHERE id = cotizacion.tecnico_id AND user_id = auth.uid()
  ));

CREATE POLICY "Tecnicos can insert cotizaciones"
  ON public.cotizacion FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.tecnico_profile
    WHERE id = cotizacion.tecnico_id AND user_id = auth.uid()
  ));

CREATE POLICY "Tecnicos can update their own cotizaciones"
  ON public.cotizacion FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.tecnico_profile
    WHERE id = cotizacion.tecnico_id AND user_id = auth.uid()
  ));

CREATE POLICY "Clientes can update cotizaciones for their tickets"
  ON public.cotizacion FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.ticket t
    INNER JOIN public.cliente_profile cp ON t.cliente_id = cp.id
    WHERE t.id = cotizacion.ticket_id AND cp.user_id = auth.uid()
  ));

-- RLS Policies for pago table
CREATE POLICY "Clientes can view pagos for their tickets"
  ON public.pago FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.ticket t
    INNER JOIN public.cliente_profile cp ON t.cliente_id = cp.id
    WHERE t.id = pago.ticket_id AND cp.user_id = auth.uid()
  ));

CREATE POLICY "Tecnicos can view pagos for their cotizaciones"
  ON public.pago FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.cotizacion c
    INNER JOIN public.tecnico_profile tp ON c.tecnico_id = tp.id
    WHERE c.id = pago.cotizacion_id AND tp.user_id = auth.uid()
  ));

CREATE POLICY "Clientes can insert pagos for their tickets"
  ON public.pago FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.ticket t
    INNER JOIN public.cliente_profile cp ON t.cliente_id = cp.id
    WHERE t.id = pago.ticket_id AND cp.user_id = auth.uid()
  ));

CREATE POLICY "System can update pagos"
  ON public.pago FOR UPDATE
  USING (TRUE);

-- RLS Policies for calificacion table
CREATE POLICY "Clientes can view their own calificaciones"
  ON public.calificacion FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.cliente_profile
    WHERE id = calificacion.cliente_id AND user_id = auth.uid()
  ));

CREATE POLICY "Tecnicos can view calificaciones about them"
  ON public.calificacion FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tecnico_profile
    WHERE id = calificacion.tecnico_id AND user_id = auth.uid()
  ));

CREATE POLICY "Clientes can insert calificaciones for their tickets"
  ON public.calificacion FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.cliente_profile
    WHERE id = calificacion.cliente_id AND user_id = auth.uid()
  ));