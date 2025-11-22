-- Create disputes table
CREATE TABLE IF NOT EXISTS public.disputas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pago_id UUID NOT NULL REFERENCES public.pago(id) ON DELETE CASCADE,
  iniciado_por UUID NOT NULL REFERENCES auth.users(id),
  tipo_iniciador TEXT NOT NULL CHECK (tipo_iniciador IN ('cliente', 'tecnico')),
  motivo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_revision', 'resuelta', 'rechazada')),
  resolucion_admin TEXT,
  resuelto_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.disputas ENABLE ROW LEVEL SECURITY;

-- Admins can view all disputes
CREATE POLICY "Admins can view all disputes"
ON public.disputas
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Admins can update disputes
CREATE POLICY "Admins can update disputes"
ON public.disputas
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Clients can view disputes they initiated
CREATE POLICY "Clients can view their disputes"
ON public.disputas
FOR SELECT
TO authenticated
USING (iniciado_por = auth.uid());

-- Technicians can view disputes they initiated
CREATE POLICY "Technicians can view their disputes"
ON public.disputas
FOR SELECT
TO authenticated
USING (iniciado_por = auth.uid());

-- Users can insert their own disputes
CREATE POLICY "Users can create disputes"
ON public.disputas
FOR INSERT
TO authenticated
WITH CHECK (iniciado_por = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_disputas_updated_at
BEFORE UPDATE ON public.disputas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_disputas_pago_id ON public.disputas(pago_id);
CREATE INDEX idx_disputas_estado ON public.disputas(estado);
CREATE INDEX idx_disputas_iniciado_por ON public.disputas(iniciado_por);