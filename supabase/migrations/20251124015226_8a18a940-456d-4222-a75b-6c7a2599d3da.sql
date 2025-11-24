-- Add visit scheduling fields to cotizacion table
ALTER TABLE cotizacion 
ADD COLUMN visita_fecha_propuesta date,
ADD COLUMN visita_hora_propuesta time,
ADD COLUMN visita_duracion_horas integer DEFAULT 2,
ADD COLUMN visita_estado text DEFAULT 'pendiente' CHECK (visita_estado IN ('pendiente', 'confirmada', 'cancelada')),
ADD COLUMN visita_propuesta_por uuid REFERENCES profiles(id);

-- Create index for faster availability queries
CREATE INDEX idx_cotizacion_visita_fecha ON cotizacion(visita_fecha_propuesta, visita_hora_propuesta) 
WHERE visita_estado = 'confirmada';

-- Add comment for clarity
COMMENT ON COLUMN cotizacion.visita_duracion_horas IS 'Duration of the visit in hours, used to calculate technician availability with 2-hour buffer';