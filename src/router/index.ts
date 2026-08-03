import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      redirect: '/terminals',
    },
    {
      path: '/terminals',
      name: 'terminals',
      component: () => import('@/views/TerminalsView.vue'),
      meta: { permission: 'terminals.view' },
    },
    {
      path: '/movements',
      name: 'movements',
      component: () => import('@/views/MovementsView.vue'),
      meta: { permission: 'movements.own' },
    },
    {
      path: '/users',
      name: 'users',
      component: () => import('@/views/UsersView.vue'),
      meta: { permission: 'users.view' },
    },
    {
      path: '/roles',
      name: 'roles',
      component: () => import('@/views/RolesView.vue'),
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
  if (auth.hasPermission('movements.own')) return '/movements'
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

  if (!auth.user?.permissions?.length) {
    try {
      await auth.fetchMe()
    } catch {
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
