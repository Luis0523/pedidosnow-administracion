INSERT INTO roles (codigo, nombre, descripcion)
VALUES
  ('cliente', 'Cliente', 'Usuario cliente de la plataforma'),
  ('restaurante', 'Restaurante', 'Usuario asociado a restaurantes'),
  ('repartidor', 'Repartidor', 'Courier de la plataforma'),
  ('admin', 'Administrador', 'Administrador del sistema')
ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  activo = true;
