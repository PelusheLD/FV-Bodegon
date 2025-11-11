-- Agregar campos de datos bancarios para pagos
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS payment_bank TEXT,
ADD COLUMN IF NOT EXISTS payment_ci TEXT,
ADD COLUMN IF NOT EXISTS payment_phone TEXT,
ADD COLUMN IF NOT EXISTS payment_instructions TEXT;

-- Insertar valores por defecto si no existen
UPDATE site_settings
SET 
  payment_bank = 'Banplus',
  payment_ci = 'J-503280280',
  payment_phone = '04245775917',
  payment_instructions = 'IMPORTANTE: Indicar número de teléfono, banco, cédula titular del pago móvil para confirmar.'
WHERE payment_bank IS NULL;

