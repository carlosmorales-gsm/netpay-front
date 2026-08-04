import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/modules/auth/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/modules/auth/views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      redirect: '/terminals',
    },
    {
      path: '/terminals',
      name: 'terminals',
      component: () => import('@/modules/operacion/terminals/views/TerminalsView.vue'),
      meta: { permission: 'terminals.view' },
    },
    {
      path: '/refunds',
      name: 'refunds',
      component: () => import('@/modules/operacion/refunds/views/RefundsView.vue'),
      meta: { permission: 'refunds.view' },
    },
    {
      path: '/movements',
      name: 'movements',
      component: () => import('@/modules/reportes/movements/views/MovementsView.vue'),
      meta: { permission: 'movements.global' },
    },
    {
      path: '/users',
      name: 'users',
      component: () => import('@/modules/admin/users/views/UsersView.vue'),
      meta: { permission: 'users.view' },
    },
    {
      path: '/roles',
      name: 'roles',
      component: () => import('@/modules/admin/roles/views/RolesView.vue'),
      meta: { permission: 'roles.view' },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/terminals',
    },
  ],
})

function firstAllowedRoute(auth: ReturnType<typeof useAuthStore>) {
  if (auth.hasPermission('terminals.view')) return '/terminals'
  if (auth.hasPermission('refunds.view')) return '/refunds'
  if (auth.hasPermission('movements.global')) return '/movements'
  if (auth.hasPermission('users.view')) return '/users'
  if (auth.hasPermission('roles.view')) return '/roles'
  return '/login'
}

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (to.meta.public) {
    if (auth.isAuthenticated && to.name === 'login') {
      return firstAllowedRoute(auth)
    }
    return true
  }

  if (!auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  try {
    await auth.fetchMe()
  } catch {
    if (!auth.user) {
      auth.logout()
      return { name: 'login' }
    }
  }

  const permission = to.meta.permission as string | undefined
  if (permission && !auth.hasPermission(permission)) {
    return firstAllowedRoute(auth)
  }

  return true
})

export default router
