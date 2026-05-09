# Instrucciones del Sistema — Módulo de Administración (Simulación Provisional)

## Rol y Propósito

Eres el asistente de desarrollo del **módulo de administración** de una plataforma de delivery. Tu responsabilidad es ayudar a implementar, consultar y extender el backend de este módulo, que actúa como la fuente de verdad provisional para identidad, autenticación y gestión de actores del sistema mientras el servicio real de administración/autenticación no existe.

Este módulo es consumido por tres servicios externos:
- **Broker** — valida tokens y consulta usuarios
- **Restaurantes** — verifica si un usuario tiene acceso a un restaurante
- **Repartidores (UI)** — gestiona el ciclo de vida completo de un courier

---

## Arquitectura General

El sistema sigue una arquitectura de **microservicios con broker central**. Este módulo (`administracion`) actúa como simulación provisional hasta que exista un servicio real de autenticación.

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                      │
│         (UI Repartidores / UI Restaurantes)     │
└────────────────────┬────────────────────────────┘
                     │ Bearer Token
                     ▼
┌─────────────────────────────────────────────────┐
│                   BROKER                        │
│  - Valida tokens                                │
│  - Consulta tabla `usuarios` de este módulo     │
│  - Devuelve payload con user_id, role, accesos  │
└──────┬──────────────────────┬───────────────────┘
       │                      │
       ▼                      ▼
┌─────────────┐      ┌────────────────────┐
│ RESTAURANTES│      │  ADMINISTRACION    │
│ Valida      │      │  (este módulo)     │
│ acceso por  │      │  - Registro        │
│ restaurante │      │  - Perfil courier  │
│             │      │  - Estado de cuenta│
└─────────────┘      │  - Cuentas banco   │
                     └────────────────────┘
```

### Reglas de Responsabilidad

- Este módulo **no valida contraseñas de otros servicios** — solo expone endpoints para que el broker lo consulte.
- Este módulo **no emite tokens** — eso es responsabilidad del broker.
- El servicio de restaurantes **no implementa login propio** — recibe un usuario ya validado por el broker.
- Los estados de courier son gestionados exclusivamente desde este módulo por un administrador.

---

## Estructura de la Base de Datos

### Visión General

La base de datos tiene cuatro grupos lógicos de tablas:

```
IDENTIDAD COMPARTIDA     RESTAURANTES          REPARTIDORES          CONTABILIDAD
──────────────────────   ─────────────────     ───────────────────   ──────────────────
roles                    restaurantes          couriers              banks
usuarios                 restaurante_usuarios  courier_vehicles      bank_accounts
                                               unlock_requests       cards
```

---

### Grupo 1 — Identidad Compartida

#### `roles`
Catálogo de tipos de usuario. Define el acceso general al sistema.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | SERIAL PK | Identificador |
| `codigo` | VARCHAR(30) UNIQUE | Clave del rol: `cliente`, `restaurante`, `repartidor`, `admin` |
| `nombre` | VARCHAR(80) | Nombre legible |
| `descripcion` | TEXT | Descripción opcional |
| `activo` | BOOLEAN | Permite desactivar roles |
| `fecha_creacion` | TIMESTAMP | Registro automático |

```sql
INSERT INTO roles (codigo, nombre) VALUES
('cliente',      'Cliente'),
('restaurante',  'Restaurante'),
('repartidor',   'Repartidor'),
('admin',        'Administrador');
```

#### `usuarios`
Tabla central de identidad. Todos los actores del sistema tienen un registro aquí.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | SERIAL PK | Usado como `cliente_id` en pedidos y como referencia para couriers |
| `rol_id` | FK → roles | Define el tipo de usuario |
| `nombre` | VARCHAR(120) | Nombre del usuario |
| `apellido` | VARCHAR(120) | Apellido (opcional) |
| `correo` | VARCHAR(150) UNIQUE | Correo único, usado por el broker para login |
| `telefono` | VARCHAR(30) | Teléfono de contacto |
| `password_hash` | VARCHAR(255) | Hash provisional para simulación |
| `proveedor_auth` | VARCHAR(50) | `mock` para simulación, `google`/`firebase` para futuro |
| `external_auth_id` | VARCHAR(120) | ID futuro en el servicio real |
| `activo` | BOOLEAN | Bloqueo sin eliminación |
| `verificado` | BOOLEAN | Aprobación manual por admin |
| `fecha_creacion` | TIMESTAMP | — |
| `fecha_actualizacion` | TIMESTAMP | — |

---

### Grupo 2 — Restaurantes

#### `restaurantes`
Entidad del negocio restaurante. No contiene credenciales de login.

#### `restaurante_usuarios`
Tabla pivote que relaciona usuarios con restaurantes.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | SERIAL PK | — |
| `restaurante_id` | FK → restaurantes | — |
| `usuario_id` | FK → usuarios | El usuario debe tener `rol_id = restaurante` |
| `tipo_acceso` | VARCHAR(30) | `owner`, `admin_restaurante`, `operador`, `solo_lectura` |
| `activo` | BOOLEAN | — |

> Un usuario puede administrar varios restaurantes. Un restaurante puede tener varios usuarios.

---

### Grupo 3 — Repartidores

#### `couriers`
Extiende a `usuarios` con datos específicos del negocio courier. Relación 1:1 con `usuarios`.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | SERIAL PK | — |
| `usuario_id` | FK → usuarios UNIQUE | El usuario debe tener `rol_id = repartidor` |
| `cui` | VARCHAR(20) UNIQUE | Código Único de Identificación (DPI Guatemala) |
| `nit` | VARCHAR(20) | NIT fiscal |
| `nationality` | VARCHAR(60) | Nacionalidad |
| `department` | VARCHAR(80) | Departamento de residencia |
| `address` | TEXT | Dirección de domicilio |
| `birth_date` | DATE | Fecha de nacimiento |
| `dpi_photo_base64` | TEXT | Fotografía del DPI en base64 |
| `profile_photo_base64` | TEXT | Fotografía de perfil en base64 |
| `account_status` | VARCHAR(30) | `PENDING_REVIEW` \| `ACTIVE` \| `BLOCKED` \| `SUSPENDED_DEBT` |
| `operational_status` | VARCHAR(20) | `AVAILABLE` \| `INACTIVE` |
| `fecha_creacion` | TIMESTAMP | — |
| `fecha_actualizacion` | TIMESTAMP | — |

**Estados de cuenta (`account_status`):**

| Valor | Significado |
|---|---|
| `PENDING_REVIEW` | Solicitud recibida, pendiente de aprobación admin |
| `ACTIVE` | Cuenta aprobada, puede operar |
| `BLOCKED` | Bloqueada por el administrador |
| `SUSPENDED_DEBT` | Suspendida por deuda pendiente |

**Estado operativo (`operational_status`):**

| Valor | Significado |
|---|---|
| `AVAILABLE` | El repartidor está disponible para recibir pedidos |
| `INACTIVE` | No disponible, excluido del feed de pedidos |

#### `courier_vehicles`
Vehículos asociados a un courier. Un courier puede tener varios vehículos.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | SERIAL PK | — |
| `courier_id` | FK → couriers | — |
| `vehicle_type` | VARCHAR(20) | `MOTORCYCLE` \| `BICYCLE` \| `CAR` |
| `license_plate` | VARCHAR(20) UNIQUE | Placa del vehículo |
| `activo` | BOOLEAN | — |
| `fecha_creacion` | TIMESTAMP | — |

#### `unlock_requests`
Historial de solicitudes de desbloqueo enviadas por couriers con cuenta `BLOCKED` o `SUSPENDED_DEBT`.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | SERIAL PK | — |
| `courier_id` | FK → couriers | — |
| `reason` | TEXT | Justificación del courier |
| `status` | VARCHAR(20) | `PENDING` \| `APPROVED` \| `REJECTED` |
| `fecha_creacion` | TIMESTAMP | Cuándo se envió |
| `fecha_resolucion` | TIMESTAMP | Cuándo el admin resolvió |

---

### Grupo 4 — Contabilidad / Bancario

#### `banks`
Catálogo de bancos disponibles en la plataforma.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | SERIAL PK | — |
| `bank_id` | VARCHAR(50) UNIQUE | Ejemplo: `BANCO_INDUSTRIAL_01` |
| `nombre` | VARCHAR(120) | Nombre del banco |
| `activo` | BOOLEAN | — |

#### `bank_accounts`
Cuentas bancarias de couriers. Al crear una cuenta, se genera automáticamente una tarjeta.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | SERIAL PK | — |
| `courier_id` | FK → couriers | — |
| `bank_id` | FK → banks | — |
| `account_type` | VARCHAR(20) | `MONETARY` \| `SAVINGS` |
| `account_number` | VARCHAR(60) | Número de cuenta (enmascarado en respuestas) |
| `activo` | BOOLEAN | — |
| `fecha_creacion` | TIMESTAMP | — |

#### `cards`
Tarjetas asociadas automáticamente al crear una cuenta bancaria.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | SERIAL PK | — |
| `bank_account_id` | FK → bank_accounts | — |
| `card_type` | VARCHAR(20) | `CREDIT` \| `DEBIT` |
| `masked_number` | VARCHAR(20) | Últimos 4 dígitos: `**** **** **** 1234` |
| `activo` | BOOLEAN | — |
| `fecha_creacion` | TIMESTAMP | — |

---

### Relaciones Completas

```
roles.id                  ──→  usuarios.rol_id
usuarios.id               ──→  restaurante_usuarios.usuario_id
restaurantes.id           ──→  restaurante_usuarios.restaurante_id
usuarios.id               ──→  couriers.usuario_id           (1:1)
couriers.id               ──→  courier_vehicles.courier_id
couriers.id               ──→  bank_accounts.courier_id
banks.id                  ──→  bank_accounts.bank_id
bank_accounts.id          ──→  cards.bank_account_id
couriers.id               ──→  unlock_requests.courier_id
usuarios.id               ──→  pedidos.cliente_id            (servicio externo)
```

---

## Endpoints del Módulo (UI Repartidores)

Todos los endpoints de courier requieren `Authorization: Bearer <token>` salvo el de registro.

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/couriers/register` | Registro de nuevo repartidor (wizard multipaso) |
| `GET` | `/api/couriers/me/account-status` | Estado administrativo de la cuenta |
| `PATCH` | `/api/couriers/me/availability` | Actualiza estado operativo (toggle disponible/inactivo) |
| `GET` | `/api/couriers/me` | Perfil completo del repartidor autenticado |
| `PUT` | `/api/couriers/me` | Actualiza datos personales y vehículo |
| `POST` | `/api/couriers/me/unlock-request` | Solicitud de desbloqueo de cuenta |

### Flujo de Registro (`POST /api/couriers/register`)

1. El frontend envía el payload completo del wizard.
2. Se crea un registro en `usuarios` con `rol_id = repartidor`.
3. Se crea el registro en `couriers` con `account_status = PENDING_REVIEW`.
4. Se crea el vehículo en `courier_vehicles`.
5. Se crea la cuenta en `bank_accounts` y automáticamente una tarjeta en `cards`.
6. Se devuelve `201 Created` con mensaje de confirmación.

### Flujo de Validación de Token (todos los demás endpoints)

```
1. Request llega con Bearer token
2. Este servicio consulta al broker si el token es válido
3. Broker responde con { user_id, role, ... }
4. Se verifica que el usuario tenga role = 'repartidor'
5. Se procesa la operación sobre couriers WHERE usuario_id = user_id
```

---

## Estructura de Carpetas del Proyecto

Basada en el proyecto `restaurantes` existente (Node.js / Express):

```
administracion/
├── context/                    # Contexto compartido (ej. tipos TypeScript, interfaces)
├── db/                         # Configuración de conexión a base de datos
├── migrations/                 # Archivos de migración SQL (en orden numérico)
│   ├── 001_create_roles.sql
│   ├── 002_create_usuarios.sql
│   ├── 003_create_restaurantes.sql
│   ├── 004_create_restaurante_usuarios.sql
│   ├── 005_create_couriers.sql
│   ├── 006_create_courier_vehicles.sql
│   ├── 007_create_banks.sql
│   ├── 008_create_bank_accounts.sql
│   ├── 009_create_cards.sql
│   └── 010_create_unlock_requests.sql
├── seeders/                    # Datos iniciales (roles, bancos de ejemplo)
├── src/
│   ├── config/                 # Variables de entorno, configuración de DB
│   ├── controllers/            # Lógica de cada endpoint (thin controllers)
│   │   ├── courier.controller.js
│   │   └── auth.controller.js
│   ├── helpers/                # Utilidades: hash de contraseña, enmascarar tarjeta, etc.
│   ├── middlewares/            # Auth middleware (validación de token con broker)
│   │   └── auth.middleware.js
│   ├── models/                 # Modelos / queries a la base de datos
│   │   ├── courier.model.js
│   │   ├── usuario.model.js
│   │   └── bankAccount.model.js
│   ├── routes/                 # Definición de rutas Express
│   │   └── courier.routes.js
│   ├── services/               # Lógica de negocio (llamadas a broker, creación automática de tarjeta)
│   │   ├── courier.service.js
│   │   └── broker.service.js
│   └── app.js                  # Instancia Express, middlewares globales
├── tests/                      # Tests de integración y unitarios
├── postman-tests/              # Colecciones Postman para pruebas manuales
├── .env                        # Variables de entorno (no commitear)
├── .env.copy                   # Plantilla de variables de entorno
├── Dockerfile                  # Imagen Docker del servicio
├── package.json
├── server.js                   # Entry point — levanta el servidor
├── populateDatabase.js         # Script para poblar DB directamente con SQL
├── populateViaAPI.js           # Script para poblar DB via endpoints
└── syncDatabase.js             # Sincroniza migraciones pendientes
```

### Convenciones de Nomenclatura

| Capa | Convención | Ejemplo |
|---|---|---|
| Archivos | `kebab-case` o `camelCase.tipo.js` | `courier.controller.js` |
| Tablas DB | `snake_case` plural | `courier_vehicles` |
| Columnas DB | `snake_case` | `account_status`, `fecha_creacion` |
| Variables JS | `camelCase` | `accountStatus`, `courierId` |
| Endpoints | `kebab-case` | `/api/couriers/me/unlock-request` |
| Enums | `UPPER_SNAKE_CASE` | `PENDING_REVIEW`, `AVAILABLE` |

---

## Flujo del Broker (Simulación Provisional)

Mientras no exista el servicio real de autenticación, el broker consulta directamente las tablas de este módulo.

### Payload que devuelve el broker al validar un token de restaurante

```json
{
  "user_id": 10,
  "role": "restaurante",
  "restaurantes": [
    { "id": 3, "tipo_acceso": "owner" },
    { "id": 8, "tipo_acceso": "operador" }
  ],
  "correo": "dueno@demo.com"
}
```

### Payload que devuelve el broker al validar un token de courier

```json
{
  "user_id": 15,
  "role": "repartidor",
  "correo": "carlos.m@ejemplo.com"
}
```

### Validación que hace el módulo de restaurantes

```
1. Recibe request con Bearer token
2. Pregunta a broker si el token es válido
3. Broker responde datos del usuario
4. Restaurantes verifica que usuario tiene acceso al restaurante_id de la ruta
5. Si tiene acceso → procesa la operación
6. Si no tiene acceso → responde 403
```

---

## Variables de Entorno Requeridas

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=administracion_db
DB_USER=postgres
DB_PASSWORD=secret

# Servidor
PORT=3001
NODE_ENV=development

# Broker (URL del servicio broker para validar tokens)
BROKER_URL=http://localhost:3000

# Seguridad
JWT_SECRET=cambiar_en_produccion
PASSWORD_SALT_ROUNDS=10
```

---

## Decisiones de Diseño Importantes

### Por qué `couriers` es tabla separada y no campos en `usuarios`

Un repartidor tiene datos de negocio muy específicos (CUI, DPI, placa, estado de cuenta) que no tienen sentido para otros tipos de usuario. Separarlo permite:
- Mantener `usuarios` limpio como tabla de identidad pura.
- Migrar fácilmente al servicio real de autenticación en el futuro.
- Escalar cada entidad de forma independiente.

### Por qué no guardar login en `restaurantes`

Un restaurante puede tener varios usuarios y un usuario puede administrar más de un restaurante. Mezclar identidad con datos del negocio dificulta la migración al servicio real después.

### Por qué `account_status` y `operational_status` son varchar y no tablas catálogo

Son enums fijos del dominio definidos por el contrato del frontend (TypeScript interfaces). No se espera que cambien en tiempo de ejecución, por lo que una restricción `CHECK` en la columna es suficiente y más simple que una tabla adicional.

### Creación automática de tarjeta

Al llamar `POST /api/couriers/register`, el servicio debe crear en la misma transacción:
1. `usuarios` → `couriers` → `courier_vehicles`
2. `bank_accounts` → `cards` (automáticamente)

Si alguna inserción falla, se hace rollback completo.

---

## Estado Actual y Próximos Pasos

| Estado | Módulo |
|---|---|
| ✅ Diseñado | Esquema de base de datos completo |
| ✅ Diseñado | Endpoints de UI Repartidores |
| ✅ Diseñado | Flujo broker provisional |
| ⏳ Pendiente | Implementación de migraciones SQL |
| ⏳ Pendiente | Implementación de endpoints |
| ⏳ Pendiente | Middleware de autenticación con broker |
| ⏳ Pendiente | Seeders de datos iniciales |
| 🔮 Futuro | Reemplazar simulación por servicio real de autenticación |
| 🔮 Futuro | Endpoints admin (aprobar/rechazar couriers) |
| 🔮 Futuro | Endpoints para gestión de restaurantes desde admin |
