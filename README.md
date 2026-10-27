# NetPay Admin — San Martín

Panel de administración de terminales NetPay (Vue 3 + Vite).

## Setup

```sh
npm install
```

Copia `.env.example` a `.env` y apunta al API:

```
VITE_API_URL=http://localhost:3017
VITE_API_KEY=
```

`VITE_API_KEY` es la misma llave que `sale_extensions.netpay_api_key` en Odoo. El build de Pages la toma de los secrets `VITE_API_KEY` (main) y `VITE_API_KEY_STG` (develop). Docker la recibe como `ARG`, igual que la URL.

## Desarrollo

```sh
npm run dev
```

## Credenciales semilla (API)

- Usuario: `admin@sanmartin.com.mx`
- Rol: Administrador

El seed se crea al iniciar `api-netpay`. La contraseña no se publica en este repo; pídela al equipo. En desarrollo puedes definir `VITE_DEV_PASSWORD` en tu `.env` local para autollenar el login.
