# Flujo de Autenticacion y Usuarios

Este documento define como debe funcionar el login, registro y validacion de acceso para repartidores y restaurantes usando el modulo de Administracion como fuente de verdad provisional de usuarios.

## Responsabilidades

### Administracion

- Guarda la tabla central `usuarios`.
- Guarda `password_hash`, nunca `passwordRaw`.
- Guarda perfiles especificos como `couriers`.
- Guarda restaurantes y relaciones usuario-restaurante.
- Expone endpoints internos para que el Broker valide credenciales.
- No genera JWT.

### Broker

- Recibe el login desde las UIs.
- Consulta Administracion para validar email/password.
- Genera y firma el JWT.
- Valida JWT cuando otros servicios se lo solicitan.
- Devuelve payload de usuario con rol y accesos.

### UI

- Hace login contra el Broker.
- Guarda y envia el JWT en requests protegidos.
- Muestra pantallas segun rol y permisos.
- No es fuente de seguridad; solo presenta opciones.

### Microservicios

- Reciben requests con `Authorization: Bearer <token>`.
- Validan el token contra el Broker.
- Validan permisos sobre recursos concretos.
- Nunca confian solo en lo que muestra la UI.

## Tabla Central de Usuarios

Todos los actores usan `usuarios` como identidad base.

```text
usuarios
- id
- rol_id
- nombre
- apellido
- correo
- telefono
- password_hash
- activo
- verificado
```

El campo `passwordRaw` solo viaja en requests de registro o login. Administracion lo convierte a hash con bcrypt y guarda solamente `password_hash`.

## Login General

El login siempre inicia en el Broker.

```http
POST /api/auth/login
```

Body:

```json
{
  "email": "usuario@demo.com",
  "password": "PasswordSeguro123"
}
```

El Broker consulta Administracion:

```http
POST /api/internal/auth/verify-user
```

Body:

```json
{
  "email": "usuario@demo.com",
  "password": "PasswordSeguro123"
}
```

Administracion:

1. Busca usuario por correo.
2. Compara password contra `password_hash`.
3. Verifica que `activo = true`.
4. Devuelve datos del usuario, rol y accesos relacionados.

El Broker genera el JWT si la respuesta es valida.

## Repartidores

### Registro de Repartidor

La UI de repartidores registra directamente al repartidor en Administracion.

```http
POST /api/couriers/register
```

Administracion crea en una transaccion:

1. `usuarios` con rol `repartidor`.
2. `couriers` con datos especificos del repartidor.
3. `courier_vehicles`.
4. `bank_accounts`.
5. `cards` automaticamente.

Relacion:

```text
usuarios.id = couriers.usuario_id
```

Ejemplo:

```text
usuarios
id: 15
correo: carlos@demo.com
rol: repartidor

couriers
id: 3
usuario_id: 15
account_status: ACTIVE
operational_status: INACTIVE
```

### Respuesta de Administracion al Broker para Repartidor

Cuando el Broker valida login de un repartidor, Administracion debe devolver:

```json
{
  "userId": 15,
  "email": "carlos@demo.com",
  "firstName": "Carlos",
  "lastName": "Mendez",
  "phone": "5555-1234",
  "role": "repartidor",
  "activo": true,
  "verificado": false,
  "courier": {
    "id": 3,
    "accountStatus": "ACTIVE",
    "operationalStatus": "INACTIVE"
  }
}
```

### Payload del Broker para Servicios

El Broker puede devolver algo asi al validar token:

```json
{
  "user_id": 15,
  "role": "repartidor",
  "correo": "carlos@demo.com"
}
```

Los endpoints de repartidores usan `user_id` para consultar:

```sql
SELECT * FROM couriers WHERE usuario_id = $1;
```

## Restaurantes

### Modelo de Acceso

No se debe asumir `1 usuario = 1 restaurante`.

La relacion correcta es:

```text
usuarios
restaurante_usuarios
restaurantes
```

Relacion:

```text
usuarios.id = restaurante_usuarios.usuario_id
restaurantes.id = restaurante_usuarios.restaurante_id
```

Esto permite:

- Un usuario puede administrar varios restaurantes.
- Un restaurante puede tener varios usuarios.
- Cada usuario puede tener distinto permiso por restaurante.

Permisos esperados:

- `owner`
- `admin_restaurante`
- `operador`
- `solo_lectura`

### Registro de Restaurante

El registro inicial de restaurante debe crear:

1. Usuario owner con rol `restaurante`.
2. Restaurante.
3. Relacion en `restaurante_usuarios` con `tipo_acceso = owner`.

Ejemplo de endpoint futuro:

```http
POST /api/restaurants/register
```

Body esperado:

```json
{
  "restaurant": {
    "nombre": "Pizza Central",
    "descripcion": "Pizzeria artesanal",
    "telefono": "5555-1111",
    "direccion": "Zona 1"
  },
  "owner": {
    "firstName": "Luis",
    "lastName": "Perez",
    "email": "dueno@pizza.com",
    "phone": "5555-2222",
    "passwordRaw": "PasswordSeguro123"
  }
}
```

Resultado en base de datos:

```text
usuarios
id: 20
correo: dueno@pizza.com
rol: restaurante

restaurantes
id: 5
nombre: Pizza Central

restaurante_usuarios
usuario_id: 20
restaurante_id: 5
tipo_acceso: owner
```

### Colaboradores de Restaurante

Los colaboradores no se registran solos.

El owner o un admin del restaurante los crea desde el panel.

Endpoint futuro:

```http
POST /api/restaurants/:restaurantId/users
```

Body ejemplo:

```json
{
  "firstName": "Ana",
  "lastName": "Lopez",
  "email": "operador@pizza.com",
  "phone": "5555-3333",
  "passwordRaw": "PasswordSeguro123",
  "tipoAcceso": "operador"
}
```

Esto crea un usuario con rol `restaurante` y lo vincula al restaurante indicado.

### Respuesta de Administracion al Broker para Restaurante

Cuando el Broker valida login de un usuario restaurante, Administracion debe devolver:

```json
{
  "userId": 20,
  "email": "dueno@pizza.com",
  "firstName": "Luis",
  "lastName": "Perez",
  "phone": "5555-2222",
  "role": "restaurante",
  "activo": true,
  "verificado": false,
  "restaurantes": [
    {
      "id": 5,
      "nombre": "Pizza Central",
      "tipoAcceso": "owner"
    }
  ]
}
```

Si tiene varios restaurantes:

```json
{
  "userId": 20,
  "role": "restaurante",
  "restaurantes": [
    {
      "id": 5,
      "nombre": "Pizza Central",
      "tipoAcceso": "owner"
    },
    {
      "id": 8,
      "nombre": "Tacos Norte",
      "tipoAcceso": "operador"
    }
  ]
}
```

### Como Decide la UI de Restaurantes

Si el usuario tiene un restaurante:

- La UI puede entrar directamente.

Si el usuario tiene varios restaurantes:

- La UI muestra selector de restaurante.
- El usuario elige con cual trabajar.
- La UI guarda el `restaurantId` activo para sus requests.

### Validacion Contra Intrusos

La UI no protege realmente el acceso. Solo muestra opciones.

La validacion real ocurre en backend.

Ejemplo de request al microservicio de restaurantes:

```http
GET /api/restaurants/5/orders
Authorization: Bearer <token>
```

El microservicio de restaurantes:

1. Recibe `restaurantId = 5` desde la ruta.
2. Valida token contra Broker.
3. Broker responde la lista de restaurantes permitidos.
4. El microservicio revisa si `5` esta dentro de esa lista.
5. Si no esta, responde `403 Forbidden`.

Ejemplo de payload del Broker:

```json
{
  "user_id": 20,
  "role": "restaurante",
  "restaurantes": [
    {
      "id": 5,
      "tipo_acceso": "owner"
    },
    {
      "id": 8,
      "tipo_acceso": "operador"
    }
  ]
}
```

Validacion conceptual:

```js
const tieneAcceso = user.restaurantes.some(
  (restaurante) => restaurante.id === Number(req.params.restaurantId)
);
```

Si un usuario cambia manualmente la URL a un restaurante no autorizado, el microservicio debe responder `403`.

## Resumen

- Administracion guarda identidad y relaciones.
- Broker hace login y genera JWT.
- Repartidores se registran desde la UI de repartidores.
- Restaurantes crean owner en el registro inicial.
- Colaboradores de restaurantes son creados por el owner/admin, no se auto-registran.
- La UI de restaurantes muestra selector si el usuario tiene varios restaurantes.
- La seguridad real siempre se valida en backend, no en la UI.
