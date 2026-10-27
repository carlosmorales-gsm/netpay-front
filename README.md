# NetPay Admin — San Martín

Panel de administración de terminales NetPay (Vue 3 + Vite).

## Setup

```sh
npm install
```

Copia `.env.example` a `.env` y apunta al API:

```
VITE_API_URL=http://localhost:3017
```

## Desarrollo

```sh
npm run dev
```

## Credenciales semilla (API)

- Usuario: `admin@sanmartin.com.mx`
- Rol: Administrador

El seed se crea al iniciar `api-netpay`. La contraseña no se publica en este repo; pídela al equipo. En desarrollo puedes definir `VITE_DEV_PASSWORD` en tu `.env` local para autollenar el login.
