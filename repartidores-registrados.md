# Repartidores Registrados - Producción

**Módulo:** `pedidosnow-administracion-production.up.railway.app`
**Fecha:** 2026-05-21

---

## Repartidor 1 - Luis García

| Campo | Valor |
|---|---|
| Nombre | Luis García |
| Email | `luis.garcia.repartidor.1779375391@test.com` |
| Password | `RepartidorTest1!` |
| ID Usuario | 11 |
| ID Courier | 6 |
| Vehículo | MOTORCYCLE |
| CUI | 12345678975391 |
| Placa | M-75391ABC |
| Banco | BANCO_INDUSTRIAL_01 (SAVINGS) |

---

## Repartidor 2 - María López

| Campo | Valor |
|---|---|
| Nombre | María López |
| Email | `maria.lopez.repartidor.1779375391@test.com` |
| Password | `RepartidorTest2!` |
| ID Usuario | 12 |
| ID Courier | 7 |
| Vehículo | BICYCLE |
| CUI | 98765432175391 |
| Placa | M-75392DEF |
| Banco | BANCO_INDUSTRIAL_01 (MONETARY) |

---

## Para probar Auth

Usar el Broker para login:

```bash
curl -X POST https://broker-services-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "luis.garcia.repartidor.1779375391@test.com",
    "password": "RepartidorTest1!"
  }'
```
