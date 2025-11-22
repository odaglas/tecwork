-- Add commission tracking columns to pago table
ALTER TABLE public.pago 
ADD COLUMN IF NOT EXISTS comision_porcentaje INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS comision_monto INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS monto_neto INTEGER DEFAULT 0;

-- Update existing records to calculate commission
UPDATE public.pago 
SET 
  comision_monto = FLOOR(monto_total * 0.15),
  monto_neto = FLOOR(monto_total * 0.85)
WHERE comision_monto = 0;