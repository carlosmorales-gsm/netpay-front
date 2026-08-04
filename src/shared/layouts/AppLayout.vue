<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/modules/auth/stores/auth'
import { MENU_SECTIONS, SCREENS } from '@/shared/config/menuSections'

type MenuItem = {
  to: string
  label: string
  hint: string
  permission: string
  pantalla: string
}

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const mobileOpen = ref(false)
const collapsed = ref(localStorage.getItem('netpay.sidebarCollapsed') === '1')

const menuByScreen: Record<string, Omit<MenuItem, 'pantalla'>> = {
  terminals: {
    to: '/terminals',
    label: 'Terminales',
    hint: 'Asignaciones NetPay',
    permission: 'terminals.view',
  },
  refunds: {
    to: '/refunds',
    label: 'Devoluciones',
    hint: 'Cancelar cobros aplicados',
    permission: 'refunds.view',
  },
  movements: {
    to: '/movements',
    label: 'Movimientos',
    hint: 'Ingresos y cobros',
    permission: 'movements.global',
  },
  users: {
    to: '/users',
    label: 'Usuarios',
    hint: 'Cuentas del panel',
    permission: 'users.view',
  },
  roles: {
    to: '/roles',
    label: 'Roles',
    hint: 'Permisos por pantalla',
    permission: 'roles.view',
  },
}

const sections = computed(() =>
  MENU_SECTIONS.map((section) => {
    const items = SCREENS.filter((screen) => screen.sectionId === section.id)
      .map((screen) => {
        const item = menuByScreen[screen.key]
        if (!item) return null
        return { ...item, pantalla: screen.key }
      })
      .filter((item): item is MenuItem => Boolean(item))
      .filter((item) => auth.hasPermission(item.permission))

    return { ...section, items }
  }).filter((section) => section.items.length > 0),
)

watch(
  () => route.path,
  () => {
    mobileOpen.value = false
  },
)

watch(collapsed, (value) => {
  localStorage.setItem('netpay.sidebarCollapsed', value ? '1' : '0')
})

async function syncPermissions() {
  if (!auth.isAuthenticated) return
  try {
    await auth.fetchMe({ force: true })
  } catch {
    // Mantener sesión cacheada si falla la red
  }
}

function onVisibilityChange() {
  if (document.visibilityState === 'visible') {
    void syncPermissions()
  }
}

onMounted(() => {
  document.addEventListener('visibilitychange', onVisibilityChange)
  void syncPermissions()
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
})

function logout() {
  auth.logout()
  router.push('/login')
}

function go(to: string) {
  mobileOpen.value = false
  router.push(to)
}

function toggleSidebar() {
  if (window.matchMedia('(max-width: 900px)').matches) {
    mobileOpen.value = !mobileOpen.value
    return
  }
  collapsed.value = !collapsed.value
}
</script>

<template>
  <div class="shell" :class="{ collapsed }">
    <aside class="sidebar" :class="{ open: mobileOpen, collapsed }">
      <div class="sidebar-brand">
        <img src="/logo-sanmartin-white.svg" alt="San Martín" />
        <div v-if="!collapsed" class="brand-text">
          <strong>NetPay</strong>
          <small>Administración</small>
        </div>
        <button
          class="collapse-btn desktop-only"
          type="button"
          :title="collapsed ? 'Mostrar menú' : 'Ocultar menú'"
          @click="collapsed = !collapsed"
        >
          {{ collapsed ? '»' : '«' }}
        </button>
      </div>

      <nav>
        <div v-for="section in sections" :key="section.id" class="nav-section">
          <p v-if="!collapsed" class="nav-label">{{ section.label }}</p>
          <p v-else class="nav-label-dot" :title="section.label">•</p>
          <button
            v-for="item in section.items"
            :key="item.to"
            type="button"
            class="nav-item"
            :class="{ active: route.path === item.to }"
            :title="collapsed ? item.label : undefined"
            @click="go(item.to)"
          >
            <span class="nav-initial">{{ item.label.charAt(0) }}</span>
            <span v-if="!collapsed" class="nav-copy">
              <span class="nav-title">{{ item.label }}</span>
              <span class="nav-hint">{{ item.hint }}</span>
            </span>
          </button>
        </div>
      </nav>
    </aside>

    <div v-if="mobileOpen" class="scrim" @click="mobileOpen = false" />

    <div class="workspace">
      <header class="topbar">
        <div class="topbar-left">
          <button class="menu-btn mobile-only" type="button" aria-label="Menú" @click="toggleSidebar">
            ☰
          </button>
        </div>
        <div class="topbar-right">
          <div class="user-chip">
            <span class="avatar">{{ auth.user?.nombre?.charAt(0)?.toUpperCase() || 'U' }}</span>
            <div class="user-meta">
              <strong>{{ auth.user?.nombre }}</strong>
              <small>{{ auth.user?.roleNombre }}</small>
            </div>
          </div>
          <button class="btn btn-sm logout-btn" type="button" @click="logout">Salir</button>
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
  transition: grid-template-columns 0.2s ease;
}

.shell.collapsed {
  grid-template-columns: 84px minmax(0, 1fr);
}

.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem 0.9rem;
  background: linear-gradient(180deg, var(--secondary) 0%, #1f3a4a 100%);
  color: white;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  overflow: auto;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.25rem 0.2rem 0.9rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-brand img {
  height: 38px;
  width: auto;
  flex-shrink: 0;
}

.brand-text {
  flex: 1;
  min-width: 0;
}

.brand-text strong {
  display: block;
  font-family: var(--font-display);
  font-size: 1.25rem;
  color: var(--accent);
  line-height: 1.1;
}

.brand-text small {
  opacity: 0.75;
  font-size: 0.75rem;
}

.collapse-btn {
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: transparent;
  color: white;
  border-radius: 6px;
  width: 30px;
  height: 30px;
  cursor: pointer;
  flex-shrink: 0;
}

.collapse-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.nav-section {
  margin-bottom: 0.85rem;
}

.nav-label {
  margin: 0.35rem 0.55rem 0.45rem;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.55;
}

.nav-label-dot {
  margin: 0.35rem 0;
  text-align: center;
  opacity: 0.4;
}

nav {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  width: 100%;
  text-align: left;
  border: 0;
  background: transparent;
  color: #f6f6f7;
  padding: 0.7rem 0.75rem;
  border-radius: 10px;
  cursor: pointer;
  transition: 0.2s ease;
}

.nav-initial {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.08);
  font-weight: 700;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.nav-copy {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.nav-title {
  font-weight: 600;
  font-size: 0.95rem;
}

.nav-hint {
  font-size: 0.72rem;
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

.nav-item.active .nav-initial {
  background: rgba(204, 160, 121, 0.28);
}

.sidebar.collapsed .sidebar-brand {
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 0.7rem 0.4rem;
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
  gap: 0.75rem;
}

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

.user-meta strong,
.user-meta small {
  display: block;
  line-height: 1.2;
}

.user-meta strong {
  color: var(--ink);
  font-size: 0.92rem;
}

.user-meta small {
  color: var(--muted);
  font-size: 0.75rem;
}

.logout-btn {
  background: transparent;
  border: 1px solid var(--border-strong);
  color: var(--primary);
}

.logout-btn:hover {
  border-color: var(--accent);
  color: var(--secondary);
}

.menu-btn {
  border: 1px solid var(--border-strong);
  background: var(--white);
  color: var(--primary);
  border-radius: 8px;
  width: 42px;
  height: 42px;
  cursor: pointer;
  font-size: 1.05rem;
}

.mobile-only {
  display: none;
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
  .shell:not(.collapsed) {
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
  .shell,
  .shell.collapsed {
    grid-template-columns: 1fr;
  }

  .mobile-only {
    display: grid;
    place-items: center;
  }

  .desktop-only {
    display: none !important;
  }

  .user-meta {
    display: none;
  }

  .sidebar,
  .sidebar.collapsed {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: min(300px, 86vw);
    z-index: 40;
    transform: translateX(-105%);
    transition: transform 0.25s ease;
    padding: 1.25rem 0.9rem;
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
}
</style>
