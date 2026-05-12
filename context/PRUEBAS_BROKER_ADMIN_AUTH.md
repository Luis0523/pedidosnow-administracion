# Pruebas Broker -> Administracion Auth

Fecha de validacion: 10 mayo 2026

## URLs

- Broker: `https://broker-services-production.up.railway.app`
- Administracion: `https://pedidosnow-administracion-production.up.railway.app`

## Configuracion Requerida en Broker

Si el broker resuelve administracion con `/api` incluido, la variable debe quedar asi:

```text
SERVICE_ADMINISTRACION=https://pedidosnow-administracion-production.up.railway.app/api
```

Con esa configuracion, las rutas internas del broker hacia administracion deben ir sin `/api`:

```js
restaurante: "/restaurants/register"
repartidor: "/couriers/register"
```

La URL final esperada en logs del broker es:

```text
https://pedidosnow-administracion-production.up.railway.app/api/restaurants/register
https://pedidosnow-administracion-production.up.railway.app/api/couriers/register
```

## Restaurante de Prueba

### Registro por Broker

Endpoint:

```http
POST https://broker-services-production.up.railway.app/api/auth/register
```

Body usado:

```json
{
  "rol": 2,
  "restaurant": {
    "nombre": "Broker Protocol Fixed 1768009601",
    "descripcion": "Pizzeria artesanal",
    "telefono": "5555-1111",
    "direccion": "Zona 1"
  },
  "owner": {
    "firstName": "Maria",
    "lastName": "Lopez",
    "email": "maria.protocol1768009601@pizza.com",
    "phone": "5555-3333",
    "passwordRaw": "PasswordSeguro123"
  }
}
```

Resultado verificado:

```http
HTTP/2 201
```

Respuesta relevante:

```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "token": "<jwt>",
    "usuario": {
      "message": "Restaurante registrado exitosamente.",
      "id": 7,
      "id_usuario": 7,
      "userId": 7,
      "email": "maria.protocol1768009601@pizza.com",
      "rol": "restaurante",
      "role": "restaurante",
      "restaurantId": 4
    }
  }
}
```

### Login por Broker

Endpoint:

```http
POST https://broker-services-production.up.railway.app/api/auth/login
```

Body:

```json
{
  "email": "maria.protocol1768009601@pizza.com",
  "password": "PasswordSeguro123"
}
```

Resultado verificado:

```http
HTTP/2 200
```

Respuesta relevante:

```json
{
  "success": true,
  "message": "Autenticación exitosa",
  "data": {
    "token": "<jwt>",
    "usuario": {
      "id": 7,
      "id_usuario": 7,
      "userId": 7,
      "email": "maria.protocol1768009601@pizza.com",
      "firstName": "Maria",
      "lastName": "Lopez",
      "phone": "5555-3333",
      "rol": "restaurante",
      "role": "restaurante",
      "activo": true,
      "verificado": false,
      "restaurantes": [
        {
          "id": 4,
          "nombre": "Broker Protocol Fixed 1768009601",
          "tipoAcceso": "owner"
        }
      ]
    }
  }
}
```

## Repartidor de Prueba

### Registro por Broker

Endpoint:

```http
POST https://broker-services-production.up.railway.app/api/auth/register
```

Body usado:

```json
{
  "rol": 3,
  "firstName": "Ana",
  "lastName": "Gomez",
  "birthDate": "1996-08-22",
  "nationality": "Guatemalteca",
  "department": "Guatemala",
  "address": "Zona 7, Ciudad de Guatemala",
  "phone": "5555-4444",
  "email": "ana.courier1768016251@demo.com",
  "cui": "1768016251",
  "dpiPhotoBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB",
  "nit": "9876543-2",
  "profilePhotoBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB",
  "vehicleType": "MOTORCYCLE",
  "licensePlate": "AC1768016251",
  "bankAccountType": "MONETARY",
  "bankId": "BANCO_INDUSTRIAL_01",
  "bankAccountNumber": "9876543210",
  "passwordRaw": "PasswordSeguro123"
}
```

Resultado verificado:

```http
HTTP/2 201
```

Respuesta relevante:

```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "token": "<jwt>",
    "usuario": {
      "message": "Repartidor registrado exitosamente. Tu cuenta esta activa.",
      "id": 8,
      "id_usuario": 8,
      "userId": 8,
      "email": "ana.courier1768016251@demo.com",
      "rol": "repartidor",
      "role": "repartidor",
      "courierId": 4
    }
  }
}
```

### Login por Broker

Endpoint:

```http
POST https://broker-services-production.up.railway.app/api/auth/login
```

Body:

```json
{
  "email": "ana.courier1768016251@demo.com",
  "password": "PasswordSeguro123"
}
```

Resultado verificado:

```http
HTTP/2 200
```

Respuesta relevante:

```json
{
  "success": true,
  "message": "Autenticación exitosa",
  "data": {
    "token": "<jwt>",
    "usuario": {
      "id": 8,
      "id_usuario": 8,
      "userId": 8,
      "email": "ana.courier1768016251@demo.com",
      "firstName": "Ana",
      "lastName": "Gomez",
      "phone": "5555-4444",
      "rol": "repartidor",
      "role": "repartidor",
      "activo": true,
      "verificado": false,
      "courier": {
        "id": 4,
        "accountStatus": "ACTIVE",
        "operationalStatus": "INACTIVE"
      }
    }
  }
}
```

## Refresh Token

Endpoint:

```http
POST https://broker-services-production.up.railway.app/api/auth/refresh
Authorization: Bearer <token>
```

Resultado verificado:

```http
HTTP/2 200
```

Respuesta relevante:

```json
{
  "success": true,
  "message": "Token renovado",
  "data": {
    "token": "<jwt renovado>"
  }
}
```
