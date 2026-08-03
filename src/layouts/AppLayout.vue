<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const mobileOpen = ref(false)

const menu = computed(() =>
  [
    { to: '/terminals', label: 'Terminales', hint: 'Asignaciones NetPay', permission: 'terminals.view' },
    { to: '/movements', label: 'Movimientos', hint: 'Ingresos y cobros', permission: 'movements.own' },
    { to: '/users', label: 'Usuarios', hint: 'Cuentas del panel', permission: 'users.view' },
    { to: '/roles', label: 'Roles', hint: 'Permisos por pantalla', permission: 'roles.view' },
  ].filter((item) => auth.hasPermission(item.permission)),
)

const pageTitle = computed(() => {
  const found = menu.value.find((m) => m.to === route.path)
  return found?.label ?? 'NetPay Admin'
})

const pageHint = computed(() => {
  const found = menu.value.find((m) => m.to === route.path)
  return found?.hint ?? ''
})

watch(
  () => route.path,
  () => {
    mobileOpen.value = false
  },
)

function logout() {
  auth.logout()
  router.push('/login')
}

function go(to: string) {
  mobileOpen.value = false
  router.push(to)
}
</script>

<template>
  <div class="shell">
    <aside class="sidebar" :class="{ open: mobileOpen }">
      <div class="sidebar-brand">
        <img src="/logo-sanmartin-white.svg" alt="San Martín" />
        <div>
          <strong>NetPay</strong>
          <small>Administración</small>
        </div>
      </div>

      <p class="nav-label">Menú</p>
      <nav>
        <button
          v-for="item in menu"
          :key="item.to"
          type="button"
          class="nav-item"
          :class="{ active: route.path === item.to }"
          @click="go(item.to)"
        >
          <span class="nav-title">{{ item.label }}</span>
          <span class="nav-hint">{{ item.hint }}</span>
        </button>
      </nav>

      <div class="sidebar-foot">
        <div class="user-block">
          <span class="avatar">{{ auth.user?.nombre?.charAt(0)?.toUpperCase() || 'U' }}</span>
          <div>
            <strong>{{ auth.user?.nombre }}</strong>
            <small>{{ auth.user?.roleNombre }}</small>
          </div>
        </div>
        <button class="btn btn-sm logout-btn" type="button" @click="logout">Cerrar sesión</button>
      </div>
    </aside>

    <div v-if="mobileOpen" class="scrim" @click="mobileOpen = false" />

    <div class="workspace">
      <header class="topbar">
        <div class="topbar-left">
          <button class="menu-btn" type="button" aria-label="Menú" @click="mobileOpen = !mobileOpen">
            ☰
          </button>
          <div class="crumb">
            <span>NetPay Admin</span>
            <strong>{{ pageTitle }}</strong>
            <small v-if="pageHint">{{ pageHint }}</small>
          </div>
        </div>
        <div class="topbar-right">
          <div class="user-chip desktop-only">
            <span class="avatar">{{ auth.user?.nombre?.charAt(0)?.toUpperCase() || 'U' }}</span>
            <div>
              <strong>{{ auth.user?.nombre }}</strong>
              <small>{{ auth.user?.roleNombre }}</small>
            </div>
          </div>
          <button class="btn btn-sm logout-btn desktop-only" type="button" @click="logout">
            Salir
          </button>
        </div>
      </header>

      <main class="content">
        <div class="content-inner">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  background: var(--cream);
}

.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem 1.1rem;
  background: linear-gradient(180deg, var(--secondary) 0%, #1f3a4a 100%);
  color: white;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  overflow: auto;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.25rem 0.35rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-brand img {
  height: 42px;
  width: auto;
}

.sidebar-brand strong {
  display: block;
  font-family: var(--font-display);
  font-size: 1.35rem;
  color: var(--accent);
  line-height: 1.1;
}

.sidebar-brand small {
  opacity: 0.75;
  font-size: 0.78rem;
}

.nav-label {
  margin: 0.25rem 0.5rem 0;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.55;
}

nav {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.15rem;
  text-align: left;
  border: 0;
  background: transparent;
  color: #f6f6f7;
  padding: 0.85rem 0.95rem;
  border-radius: 10px;
  cursor: pointer;
  transition: 0.2s ease;
}

.nav-title {
  font-weight: 600;
  font-size: 0.98rem;
}

.nav-hint {
  font-size: 0.75rem;
  opacity: 0.65;
}

.nav-item:hover {
  background: rgba(204, 160, 121, 0.14);
}

.nav-item.active {
  background: rgba(204, 160, 121, 0.22);
  color: var(--accent);
  box-shadow: inset 3px 0 0 var(--accent);
}

.sidebar-foot {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.user-block,
.user-chip {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--accent);
  color: var(--secondary);
  font-weight: 700;
  flex-shrink: 0;
}

.user-block strong,
.user-chip strong,
.user-block small,
.user-chip small {
  display: block;
  line-height: 1.2;
}

.user-block small,
.user-chip small {
  opacity: 0.75;
  font-size: 0.75rem;
}

.logout-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  width: 100%;
}

.logout-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.workspace {
  min-width: 0;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 72px;
  padding: 0.85rem 2rem;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
}

.topbar-left,
.topbar-right {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.topbar-right .logout-btn {
  width: auto;
  color: var(--primary);
  border-color: var(--border-strong);
}

.topbar-right .logout-btn:hover {
  border-color: var(--accent);
  color: var(--secondary);
}

.crumb {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.crumb span {
  font-size: 0.75rem;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.crumb strong {
  font-family: var(--font-display);
  font-size: 1.45rem;
  color: var(--primary);
  line-height: 1.1;
}

.crumb small {
  color: var(--muted);
  font-size: 0.85rem;
}

.menu-btn {
  display: none;
  border: 1px solid var(--border-strong);
  background: var(--white);
  color: var(--primary);
  border-radius: 8px;
  width: 42px;
  height: 42px;
  cursor: pointer;
  font-size: 1.15rem;
}

.content {
  flex: 1;
  padding: 1.75rem 2rem 2.5rem;
}

.content-inner {
  width: min(1280px, 100%);
  margin: 0 auto;
}

.scrim {
  display: none;
}

@media (max-width: 1100px) {
  .shell {
    grid-template-columns: 240px minmax(0, 1fr);
  }

  .content {
    padding: 1.25rem 1.25rem 2rem;
  }

  .topbar {
    padding: 0.75rem 1.25rem;
  }
}

@media (max-width: 900px) {
  .shell {
    grid-template-columns: 1fr;
  }

  .menu-btn {
    display: grid;
    place-items: center;
  }

  .desktop-only {
    display: none !important;
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: min(300px, 86vw);
    z-index: 40;
    transform: translateX(-105%);
    transition: transform 0.25s ease;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .scrim {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(40, 75, 94, 0.4);
    z-index: 35;
  }

  .content {
    padding: 1rem;
  }

  .topbar {
    min-height: 64px;
  }

  .crumb strong {
    font-size: 1.2rem;
  }
}
</style>
