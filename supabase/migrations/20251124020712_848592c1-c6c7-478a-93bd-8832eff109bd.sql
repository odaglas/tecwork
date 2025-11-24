-- Add schedule field to store multi-day visit plans
ALTER TABLE cotizacion ADD COLUMN visita_schedule jsonb DEFAULT NULL;

COMMENT ON COLUMN cotizacion.visita_schedule IS 'Array of {date, time, hours} for multi-day visits';