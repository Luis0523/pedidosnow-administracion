# Avance 12may2026 - Integracion Logistica Repartidores

## Resumen

Se preparo el modulo de Administracion para que Logistica y Paqueteria puedan consultar y actualizar el estado operativo de repartidores desde endpoints internos.

Antes, Administracion solo manejaba disponibilidad basica para la UI del repartidor con `AVAILABLE` e `INACTIVE`. Ahora tambien soporta asignacion operativa con estado `OCCUPIED`, modulo activo y entrega activa.

## Objetivo Cubierto

Logistica necesitaba poder:

- Obtener repartidores disponibles.
- Validar si un repartidor esta activo.
- Saber si esta disponible, ocupado o inactivo.
- Evitar que un repartidor este asignado al mismo tiempo en Logistica y Paqueteria.
- Actualizar el estado del repartidor cuando acepta una entrega.

## Migracion Agregada

Se agrego:

```text
migrations/011_add_courier_assignment_state.sql
```

La migracion:

- Actualiza el `CHECK` de `operational_status` para aceptar `OCCUPIED`.
- Agrega `active_module`.
- Agrega `active_delivery_id`.
- Agrega indices para `active_module` y `active_delivery_id`.

Campos finales relevantes en `couriers`:

```text
operational_status: AVAILABLE | INACTIVE | OCCUPIED
active_module: logistica | paqueteria | null
active_delivery_id: string | null
```

La migracion es incremental y no borra informacion existente.

## Endpoints Internos Agregados

Se agregaron endpoints bajo `/api/internal/couriers`:

```http
GET /api/internal/couriers?available=true&module=logistica
GET /api/internal/couriers?disponible=true&modulo=logistica
GET /api/internal/couriers/:courierId
PATCH /api/internal/couriers/:courierId/status
```

Tambien se dejo compatibilidad con el contrato en espanol que esperaba Logistica:

```http
GET /api/internal/couriers?disponible=true&modulo=logistica
```

## Payload Para Asignar Repartidor

Logistica puede marcar un repartidor como ocupado con:

```json
{
  "estado_operativo": "OCCUPIED",
  "modulo_activo": "logistica",
  "entrega_id": 789
}
```

Tambien se acepta el formato en ingles:

```json
{
  "operationalStatus": "OCCUPIED",
  "activeModule": "logistica",
  "activeDeliveryId": 789
}
```

## Control Contra Doble Asignacion

La asignacion a `OCCUPIED` es atomica.

Administracion solo permite ocupar un repartidor si cumple:

```text
account_status = ACTIVE
operational_status = AVAILABLE
active_module IS NULL
active_delivery_id IS NULL
```

Si otro modulo ya tomo al repartidor, responde `400`:

```json
{
  "message": "El repartidor no esta disponible para asignacion."
}
```

Esto evita que Logistica y Paqueteria asignen al mismo repartidor al mismo tiempo.

## Liberar Repartidor

Para liberar un repartidor:

```json
{
  "estado_operativo": "AVAILABLE"
}
```

Cuando el estado vuelve a `AVAILABLE` o `INACTIVE`, Administracion limpia automaticamente:

```text
active_module
active_delivery_id
```

## Archivos Modificados

```text
src/models/courier.model.js
src/services/courier.service.js
src/controllers/courier.controller.js
src/routes/internalAuth.routes.js
```

## Archivos Agregados

```text
migrations/011_add_courier_assignment_state.sql
context/INTEGRACION_LOGISTICA_REPARTIDORES.md
postman-tests/logistica-repartidores.postman_collection.json
context/avance_12may2026_logistica.md
```

## Coleccion Postman Para Logistica

Se agrego una coleccion pequena en:

```text
postman-tests/logistica-repartidores.postman_collection.json
```

Incluye ejemplos para:

- Listar repartidores disponibles.
- Consultar por ID.
- Ocupar repartidor desde Logistica.
- Ver respuesta cuando ya no esta disponible.
- Liberar repartidor.
- Marcar repartidor inactivo.

Variables incluidas:

```text
baseUrl = http://localhost:3005
courierId = 1
deliveryId = 789
module = logistica
```

## Verificacion Realizada

Se verifico que la app cargue correctamente:

```bash
node -e "require('./src/app'); console.log('app loaded')"
```

Resultado:

```text
app loaded
```

## Pendiente Para Despliegue

Al desplegar, el servicio debe ejecutar migraciones pendientes. En este proyecto el arranque ya contempla migraciones automaticas segun el flujo documentado.

Tambien se puede ejecutar manualmente:

```bash
npm run db:migrate
```

La nueva migracion no borra datos existentes; solo agrega soporte al nuevo estado operativo y campos de asignacion.
