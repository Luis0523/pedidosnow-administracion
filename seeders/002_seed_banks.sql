INSERT INTO banks (bank_id, nombre)
VALUES
  ('BANCO_INDUSTRIAL_01', 'Banco Industrial'),
  ('BANRURAL_01', 'Banrural'),
  ('G_T_CONTINENTAL_01', 'G&T Continental'),
  ('BAC_01', 'BAC Credomatic'),
  ('PROMERICA_01', 'Banco Promerica')
ON CONFLICT (bank_id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  activo = true;
