# Avance 08may2026

## Resumen General

En esta sesion se inicio la implementacion del servicio de Administracion desde cero, tomando como base los documentos de contexto existentes. Se construyo la estructura principal del backend, migraciones, seeders, modulo de repartidores, autenticacion interna para broker y modulo de restaurantes.

## Base del Proyecto

Se creo la estructura Node.js / Express:

- `package.json`
- `.env.copy`
- `.gitignore`
- `server.js`
- `src/app.js`
- `src/config/index.js`
- `src/db/index.js`
- `src/routes/`
- `src/controllers/`
- `src/services/`
- `src/models/`
- `src/middlewares/`
- `src/helpers/`
- `src/utils/`
- `tests/`
- `postman-tests/`
- `postman/`

Scripts disponibles:

- `npm start`
- `npm run dev`
- `npm run db:migrate`
- `npm run db:seed`
- `npm run db:setup`

Dependencias instaladas:

- `express`
- `pg`
- `dotenv`
- `bcryptjs`
- `cors`
- `helmet`
- `morgan`
- `nodemon`

## Base de Datos

Se agrego runner de migraciones:

- `syncDatabase.js`

Se agrego runner de seeders:

- `populateDatabase.js`

Se dejo placeholder:

- `populateViaAPI.js`

## Migraciones Implementadas

Se crearon las migraciones SQL:

- `001_create_roles.sql`
- `002_create_usuarios.sql`
- `003_create_restaurantes.sql`
- `004_create_restaurante_usuarios.sql`
- `005_create_couriers.sql`
- `006_create_courier_vehicles.sql`
- `007_create_banks.sql`
- `008_create_bank_accounts.sql`
- `009_create_cards.sql`
- `010_create_unlock_requests.sql`

Tambien se crea automaticamente la tabla interna:

- `schema_migrations`

## Seeders Implementados

Se agregaron seeders iniciales:

- `001_seed_roles.sql`
- `002_seed_banks.sql`

Roles iniciales:

- `cliente`
- `restaurante`
- `repartidor`
- `admin`

Bancos iniciales:

- `BANCO_INDUSTRIAL_01`
- `BANRURAL_01`
- `G_T_CONTINENTAL_01`
- `BAC_01`
- `PROMERICA_01`

## Modulo de Repartidores

Se implementaron modelos, servicios, controladores y rutas para repartidores.

Archivos principales:

- `src/models/courier.model.js`
- `src/models/bankAccount.model.js`
- `src/controllers/courier.controller.js`
- `src/services/courier.service.js`
- `src/routes/courier.routes.js`

Rutas implementadas:

- `POST /api/couriers/register`
- `GET /api/couriers/me/account-status`
- `PATCH /api/couriers/me/account-status`
- `GET /api/couriers/me/availability`
- `PATCH /api/couriers/me/availability`
- `GET /api/couriers/me`
- `PUT /api/couriers/me`
- `POST /api/couriers/me/unlock-request`

### Registro de Repartidor

El registro crea en una transaccion:

1. `usuarios`
2. `couriers`
3. `courier_vehicles`
4. `bank_accounts`
5. `cards`

La cuenta de repartidor queda por ahora directamente en:

```text
account_status = ACTIVE
operational_status = INACTIVE
```

Se valida:

- campos requeridos
- correo valido
- password minimo de 8 caracteres
- correo unico
- CUI unico
- placa unica
- `vehicleType`
- `bankAccountType`
- banco activo

## Autenticacion Temporal en Desarrollo

Se agrego soporte temporal para probar rutas protegidas sin broker usando:

```text
x-user-id: <usuario_id>
```

Aplica para:

- repartidores
- restaurantes

Esto solo se permite cuando `NODE_ENV !== production`.

## Auth Interno para Broker

Se implemento endpoint interno para que el Broker valide login contra Administracion.

Archivos agregados:

- `src/services/internalAuth.service.js`
- `src/controllers/internalAuth.controller.js`
- `src/routes/internalAuth.routes.js`

Ruta:

```http
POST /api/internal/auth/verify-user
```

Este endpoint:

- recibe `email` y `password`
- busca usuario en `usuarios`
- compara password con `password_hash`
- valida que el usuario este activo
- devuelve datos base del usuario
- si es repartidor, devuelve datos de `courier`
- si es restaurante, devuelve lista de restaurantes asociados

## Modulo de Restaurantes

Se implementaron modelos, servicios, controladores y rutas para restaurantes.

Archivos agregados:

- `src/models/restaurant.model.js`
- `src/services/restaurant.service.js`
- `src/controllers/restaurant.controller.js`
- `src/routes/restaurant.routes.js`

Rutas UI implementadas:

- `POST /api/restaurants/register`
- `GET /api/restaurants/me`
- `GET /api/restaurants/:restaurantId`
- `PUT /api/restaurants/:restaurantId`
- `PATCH /api/restaurants/:restaurantId/status`
- `GET /api/restaurants/:restaurantId/users`
- `POST /api/restaurants/:restaurantId/users`
- `PATCH /api/restaurants/:restaurantId/users/:userId/access`

Rutas internas para Broker:

- `GET /api/internal/restaurants/:restaurantId/users/:userId/access`

### Registro de Restaurante

El registro inicial crea:

1. usuario owner con rol `restaurante`
2. restaurante
3. relacion en `restaurante_usuarios` con `tipo_acceso = owner`

### Colaboradores de Restaurante

El owner o admin del restaurante puede crear colaboradores.

Tipos de acceso soportados:

- `owner`
- `admin_restaurante`
- `operador`
- `solo_lectura`

Para colaboradores se permite crear:

- `admin_restaurante`
- `operador`
- `solo_lectura`

No se permite crear colaboradores como `owner` desde el endpoint de colaboradores.

### Validacion de Acceso Restaurante

Se agrego validacion para revisar si un usuario tiene acceso a un restaurante especifico.

Ruta interna:

```http
GET /api/internal/restaurants/:restaurantId/users/:userId/access
```

Respuesta esperada si tiene acceso:

```json
{
  "allowed": true,
  "restaurantId": 1,
  "userId": 1,
  "tipoAcceso": "owner"
}
```

Si no tiene acceso, responde `403`.

## Documentacion Agregada

Se creo el documento:

- `context/FLUJO_AUTH_USUARIOS_REPARTIDORES_RESTAURANTES.md`

Incluye:

- flujo de login general
- responsabilidad de Administracion
- responsabilidad del Broker
- responsabilidad de UI
- flujo de repartidores
- flujo de restaurantes
- registro de restaurantes
- colaboradores de restaurantes
- validacion contra intrusos
- relacion entre `usuarios`, `couriers`, `restaurantes` y `restaurante_usuarios`

## Colecciones Postman

Se crearon colecciones importables:

- `postman/repartidores.postman_collection.json`
- `postman/restaurantes.postman_collection.json`
- `postman/internal-auth.postman_collection.json`

La coleccion de repartidores incluye:

- registro
- consultar estado de cuenta
- actualizar estado de cuenta
- consultar disponibilidad
- actualizar disponibilidad
- consultar perfil
- actualizar perfil
- enviar solicitud de desbloqueo

La coleccion de restaurantes incluye:

- registro restaurante con owner
- mis restaurantes
- detalle restaurante
- actualizar restaurante
- activar/desactivar restaurante
- listar colaboradores
- crear colaborador
- actualizar acceso colaborador
- validar acceso interno broker

La coleccion de internal auth incluye:

- verificar usuario para login del broker

## Verificaciones Realizadas

Se ejecuto correctamente:

```bash
npm install
```

Resultado:

- dependencias instaladas
- 0 vulnerabilidades reportadas

Se verifico carga del app varias veces con:

```bash
node -e "require('./src/app'); console.log('app loaded')"
```

Resultado:

```text
app loaded
```

Tambien se probo el registro de repartidor contra la base de datos y respondio correctamente.

## Pendientes Recomendados

- Agregar seguridad real a rutas internas, por ejemplo API key interna entre Broker y Administracion.
- Decidir si `account_status` de repartidores queda siempre `ACTIVE` o vuelve a flujo de revision.
- Agregar endpoints administrativos globales para aprobar/bloquear usuarios desde un panel admin.
- Agregar tests automatizados.
- Ajustar payload final esperado por Broker cuando ya este implementado.
- Implementar manejo de invitaciones para colaboradores de restaurantes si se requiere no enviar password manual.
- Revisar si los restaurantes deben tener mas campos fiscales/comerciales.

## Preparacion para Railway

Se preparo el proyecto para desplegarlo en Railway usando Docker.

Archivos agregados:

- `Dockerfile`
- `.dockerignore`
- `src/db/migrations.js`
- `src/db/seeders.js`

Archivos modificados:

- `server.js`
- `src/config/index.js`
- `src/app.js`
- `syncDatabase.js`
- `populateDatabase.js`
- `.env.copy`

### Arranque del Servicio

El `server.js` ahora ejecuta automaticamente antes de levantar Express:

1. Prueba de conexion a base de datos con `SELECT 1`.
2. Migraciones pendientes.
3. Seeders.
4. Logs de estado.
5. Arranque del servidor HTTP.

Logs esperados al iniciar:

```text
Base de datos conectada.
Migracion ejecutada: <archivo>.sql
Seeder ejecutado: <archivo>.sql
Base de datos sincronizada.
Version del proyecto: V1
Administracion service listening on port <PORT>
```

Si las migraciones ya fueron ejecutadas, no se repiten porque se controlan con `schema_migrations`.

Los seeders actuales son idempotentes porque usan `ON CONFLICT`, por lo que pueden ejecutarse en cada restart/deploy sin duplicar roles ni bancos.

### Version del Proyecto

Se agrego soporte para:

```env
APP_VERSION=V1
```

La version por defecto es `V1` si la variable no existe.

El endpoint `/health` ahora responde tambien la version:

```json
{
  "status": "ok",
  "service": "administracion",
  "version": "V1"
}
```

### Variables para Railway

En Railway no se debe subir `.env`. El archivo `.env.copy` queda solo como plantilla de referencia.

Variables recomendadas para Railway:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
DB_SSL=true
NODE_ENV=production
APP_VERSION=V1
BROKER_URL=https://url-del-broker
PASSWORD_SALT_ROUNDS=10
```

Si se usa `DATABASE_URL`, no es necesario configurar:

```env
DB_HOST
DB_PORT
DB_NAME
DB_USER
DB_PASSWORD
```

Railway normalmente inyecta `PORT` automaticamente.

### Verificaciones Realizadas

Se verifico que la app carga correctamente con:

```bash
node -e "require('./src/app'); console.log('app loaded')"
```

Resultado:

```text
app loaded
```

Tambien se valido el build Docker con:

```bash
docker build -t pedidos-administracion:railway .
```

Resultado:

```text
Successfully built
Successfully tagged pedidos-administracion:railway
```
