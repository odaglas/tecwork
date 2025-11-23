-- Create withdrawals table to track technician withdrawals
CREATE TABLE IF NOT EXISTS public.retiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tecnico_id UUID NOT NULL REFERENCES public.tecnico_profile(id) ON DELETE CASCADE,
  monto INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  estado TEXT NOT NULL DEFAULT 'completado'
);

-- Enable RLS
ALTER TABLE public.retiros ENABLE ROW LEVEL SECURITY;

-- Technicians can view their own withdrawals
CREATE POLICY "Tecnicos can view their own retiros"
ON public.retiros
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tecnico_profile
    WHERE tecnico_profile.id = retiros.tecnico_id
    AND tecnico_profile.user_id = auth.uid()
  )
);

-- Technicians can insert their own withdrawals
CREATE POLICY "Tecnicos can insert their own retiros"
ON public.retiros
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tecnico_profile
    WHERE tecnico_profile.id = retiros.tecnico_id
    AND tecnico_profile.user_id = auth.uid()
  )
);

-- Admins can view all withdrawals
CREATE POLICY "Admins can view all retiros"
ON public.retiros
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Create index for faster queries
CREATE INDEX idx_retiros_tecnico_id ON public.retiros(tecnico_id);
CREATE INDEX idx_retiros_created_at ON public.retiros(created_at DESC);