# Integracion Logistica - Repartidores

Administracion expone endpoints internos para que Logistica y Paqueteria consulten y actualicen el estado de asignacion de repartidores.

## Endpoints internos

```http
GET /api/internal/couriers?available=true&module=logistica
GET /api/internal/couriers?disponible=true&modulo=logistica
GET /api/internal/couriers/:courierId
PATCH /api/internal/couriers/:courierId/status
```

Tambien se aceptan los nombres en espanol del contrato de Logistica:

```http
GET /api/internal/couriers?disponible=true&modulo=logistica
```

## Estados soportados

```text
AVAILABLE
OCCUPIED
INACTIVE
```

`AVAILABLE` significa que el repartidor puede recibir una asignacion.
`OCCUPIED` significa que ya esta tomado por Logistica o Paqueteria.
`INACTIVE` significa que el repartidor no esta disponible por decision propia o administrativa.

## Modulos soportados

```text
logistica
paqueteria
```

## Asignar repartidor

```http
PATCH /api/internal/couriers/1/status
Content-Type: application/json
```

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

La asignacion es atomica: solo se actualiza si el repartidor tiene `account_status = ACTIVE`, `operational_status = AVAILABLE` y no tiene modulo/entrega activa.

Si otro modulo ya lo tomo, Administracion responde error `400` con:

```json
{
  "message": "El repartidor no esta disponible para asignacion."
}
```

## Liberar repartidor

```json
{
  "estado_operativo": "AVAILABLE"
}
```

Al volver a `AVAILABLE` o `INACTIVE`, Administracion limpia `modulo_activo` y `entrega_id`.

## Respuesta de repartidor

```json
{
  "id": 1,
  "courierId": 1,
  "userId": 5,
  "firstName": "Carlos",
  "lastName": "Mendez",
  "email": "carlos@example.com",
  "phone": "5555-1234",
  "cui": "1234567890101",
  "active": true,
  "accountStatus": "ACTIVE",
  "operationalStatus": "AVAILABLE",
  "estado_operativo": "AVAILABLE",
  "activeModule": null,
  "modulo_activo": null,
  "activeDeliveryId": null,
  "entrega_id": null,
  "vehicleType": "MOTORCYCLE",
  "licensePlate": "M-123ABC"
}
```

## Base de datos

La migracion `011_add_courier_assignment_state.sql` agrega:

```text
operational_status: AVAILABLE | INACTIVE | OCCUPIED
active_module: logistica | paqueteria | null
active_delivery_id: string | null
```
