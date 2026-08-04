# AGENTS.md — NetPay Front

Guía para trabajar en este repo (humano o agente). Vue 3 + Vite + Pinia + Vue Router. Panel admin de NetPay (San Martín). El cobro/bill vive en otro servicio (`api-netpay`); **no modificar reglas de transacciones de cobro** desde este front.

## Stack y comandos

- Dev: `npm run dev` (no lo inicies si el usuario no lo pide)
- Type-check: `npm run type-check`
- API local: `VITE_API_URL` (por defecto `http://localhost:3017`)

## Estructura obligatoria

```
src/
  modules/{seccion}/{pantalla}/
    api/{pantalla}.api.ts      ← solo endpoints HTTP
    stores/{pantalla}.ts       ← estado, filtros, modal, PDF
    components/*List.vue
    components/*FormModal.vue
    views/{Pantalla}View.vue   ← orquesta header + list + modal
    types.ts
  modules/auth/                ← login + sesión
  shared/                      ← api, config, layouts, stores, types, utils
  router/ App.vue main.ts assets/
```

Secciones actuales: `operacion`, `reportes`, `admin`. Pantallas: `terminals`, `movements`, `users`, `roles`.

## Reglas al agregar o cambiar código

1. **Pantalla nueva** → carpeta completa bajo `modules/{seccion}/{pantalla}/`. Registrar ruta en `src/router/index.ts` y entrada en `shared/config/menuSections.ts` (+ permiso backend si aplica).
2. **HTTP solo en `api/`**. El store llama al api. Los `.vue` no usan `http` directo.
3. **Transversal** → `shared/` (nunca duplicar http/client, empresas, PDF, errores).
4. **Auth** → `modules/auth/` (`stores/auth`, `api/auth.api`, `types`).
5. **UI**: listado y modal son componentes separados; la view solo orquesta.
6. **Permisos**: menú y acciones con `auth.hasPermission('codigo')`. Códigos tipo `terminals.view`, `terminals.manage`.
7. **Branding**: variables CSS existentes (`--primary`, `--secondary`, `--accent`, `--cream`). No inventar tema purple/IA genérico.
8. **No** crear markdown de docs salvo que el usuario lo pida. Este `AGENTS.md` sí se mantiene actualizado si cambia la estructura.
9. **No** commit/push sin petición explícita del usuario.
10. **No** auto-arrancar `npm run dev` si ya hay uno o el usuario no lo pidió.

## Dónde tocar qué

| Tarea | Dónde |
| --- | --- |
| Endpoint / contrato API | `modules/.../api/*.api.ts` |
| Estado, filtros, guardar, PDF | `modules/.../stores/*.ts` |
| Tabla / cards | `components/*List.vue` |
| Formulario modal | `components/*FormModal.vue` |
| Título + botones de página | `views/*View.vue` |
| Menú / secciones | `shared/config/menuSections.ts` + `shared/layouts/AppLayout.vue` |
| Empresas | `shared/stores/empresas.ts` + `shared/api/empresas.api.ts` |
| Login / JWT / permisos | `modules/auth/` |
| Cliente axios / refresh | `shared/api/http.ts` |
| Toasts / confirm / loading | `shared/stores/ui.ts` + `shared/components/App*` — **no usar** `alert()` ni `confirm()` nativos |
| Buscar usuario Odoo | Front → `/admin/terminals/odoo-users/:ref` o `/admin/users/odoo/:ref` → api-netpay → api-odoo-gsm `GET /users/:ref` |

Backend relacionado: `api-netpay` usa `API_ODOO` (debe apuntar a api-odoo-gsm, ej. `http://localhost:3006/`).

## Checklist pantalla nueva

- [ ] `types.ts`, `api/`, `stores/`, `components/`, `views/`
- [ ] Ruta + `meta.permission`
- [ ] Screen en `menuSections.ts` (sectionId correcto)
- [ ] Acciones protegidas con `*.manage` si aplica
- [ ] `npm run type-check` OK
