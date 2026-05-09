CREATE TABLE restaurante_usuarios (
  id SERIAL PRIMARY KEY,
  restaurante_id INTEGER NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo_acceso VARCHAR(30) NOT NULL CHECK (tipo_acceso IN ('owner', 'admin_restaurante', 'operador', 'solo_lectura')),
  activo BOOLEAN NOT NULL DEFAULT true,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (restaurante_id, usuario_id)
);

CREATE INDEX idx_restaurante_usuarios_restaurante_id ON restaurante_usuarios(restaurante_id);
CREATE INDEX idx_restaurante_usuarios_usuario_id ON restaurante_usuarios(usuario_id);
