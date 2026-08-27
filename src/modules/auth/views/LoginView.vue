<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/modules/auth/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const isDev = import.meta.env.DEV
const email = ref(isDev ? 'admin@sanmartin.com.mx' : '')
const password = ref(isDev ? 'AdminSM2026!' : '')
const localError = ref<string | null>(null)
const showPassword = ref(false)

function resolveHome() {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  if (redirect && redirect !== '/login') return redirect
  if (auth.hasPermission('terminals.view')) return '/terminals'
  if (auth.hasPermission('movements.own')) return '/movements'
  if (auth.hasPermission('users.view')) return '/users'
  if (auth.hasPermission('roles.view')) return '/roles'
  return '/terminals'
}

async function onSubmit() {
  localError.value = null
  try {
    await auth.login(email.value.trim(), password.value)
    await router.replace(resolveHome())
  } catch {
    localError.value = auth.error || 'No se pudo iniciar sesión'
  }
}
</script>

<template>
  <div class="login-shell">
    <aside class="brand-panel">
      <img src="/logo-sanmartin-white.svg" alt="San Martín" class="logo-white" />
      <div class="brand-copy">
        <img src="/icons-palomasanmartin.svg" alt="" class="dove" />
        <h1>NetPay</h1>
        <p>Administración de terminales y movimientos</p>
      </div>
      <small>Grupo San Martín</small>
    </aside>

    <section class="form-panel">
      <form class="login-card" @submit.prevent="onSubmit">
        <img src="/logo-gsm-azul.svg" alt="GSM" class="logo-blue" />
        <h2>Iniciar sesión</h2>
        <p class="subtitle">Ingresa con tu cuenta de administrador</p>

        <div class="field">
          <label for="email">Correo</label>
          <input
            id="email"
            v-model="email"
            type="email"
            autocomplete="username"
            placeholder="correo@sanmartin.com.mx"
            required
          />
        </div>

        <div class="field">
          <label for="password">Contraseña</label>
          <div class="password-row">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="••••••••"
              required
            />
            <button class="toggle-pass" type="button" @click="showPassword = !showPassword">
              {{ showPassword ? 'Ocultar' : 'Ver' }}
            </button>
          </div>
        </div>

        <p v-if="localError" class="error-text" role="alert">{{ localError }}</p>

        <button class="btn btn-primary submit" type="submit" :disabled="auth.loading">
          <span v-if="auth.loading" class="spinner" />
          {{ auth.loading ? 'Entrando…' : 'Entrar' }}
        </button>
      </form>
    </section>
  </div>
</template>

<style scoped>
.login-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(420px, 46%) minmax(0, 1fr);
}

.brand-panel {
  background: linear-gradient(165deg, var(--primary) 0%, var(--secondary) 100%);
  color: var(--white);
  padding: clamp(2.5rem, 5vw, 4.5rem);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
}

.brand-panel::after {
  content: '';
  position: absolute;
  inset: auto -20% -30% 40%;
  height: 60%;
  background: radial-gradient(circle, rgba(204, 160, 121, 0.28), transparent 65%);
  pointer-events: none;
}

.logo-white {
  width: min(180px, 60%);
  position: relative;
  z-index: 1;
  animation: rise 0.6s ease both;
}

.brand-copy {
  position: relative;
  z-index: 1;
  animation: rise 0.7s ease 0.05s both;
}

.dove {
  width: 48px;
  margin-bottom: 1rem;
  filter: brightness(0) invert(1);
  opacity: 0.9;
}

.brand-copy h1 {
  color: var(--accent);
  font-size: clamp(2.5rem, 5vw, 3.75rem);
  margin-bottom: 0.5rem;
}

.brand-copy p {
  margin: 0;
  max-width: 280px;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 300;
}

.brand-panel small {
  position: relative;
  z-index: 1;
  opacity: 0.7;
  letter-spacing: 0.04em;
}

.form-panel {
  display: grid;
  place-items: center;
  padding: clamp(2rem, 6vw, 4rem);
  background:
    radial-gradient(circle at top right, rgba(204, 160, 121, 0.18), transparent 35%),
    var(--cream);
}

.login-card {
  width: min(460px, 100%);
  background: var(--cream-alt);
  border: 1px solid var(--accent);
  border-radius: 24px 8px 8px 8px;
  padding: 2.4rem 2.1rem;
  box-shadow: var(--shadow-lg);
  animation: rise 0.75s ease 0.1s both;
}

.logo-blue {
  width: 120px;
  margin-bottom: 1.25rem;
}

.login-card h2 {
  font-size: 1.85rem;
  margin-bottom: 0.25rem;
}

.subtitle {
  margin: 0 0 1.5rem;
  color: var(--muted);
  font-size: 0.95rem;
}

.password-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem;
}

.toggle-pass {
  border: 1px solid var(--border-strong);
  background: var(--white);
  border-radius: var(--radius);
  padding: 0 0.85rem;
  color: var(--primary);
  cursor: pointer;
  font-weight: 500;
}

.toggle-pass:hover {
  border-color: var(--accent);
}

.submit {
  width: 100%;
  margin-top: 0.5rem;
  min-height: 45px;
}

@media (max-width: 960px) {
  .login-shell {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
    align-content: start;
    min-height: 100vh;
    min-height: 100dvh;
  }

  .brand-panel {
    min-height: 0;
    padding: 1.25rem 1.35rem 1.5rem;
    gap: 0.85rem;
    justify-content: flex-start;
  }

  .brand-panel small {
    display: none;
  }

  .logo-white {
    width: min(140px, 48%);
  }

  .dove {
    width: 36px;
    margin-bottom: 0.45rem;
  }

  .brand-copy h1 {
    font-size: clamp(1.75rem, 6.5vw, 2.1rem);
    margin-bottom: 0.25rem;
  }

  .brand-copy p {
    max-width: none;
    font-size: 0.95rem;
  }

  .form-panel {
    display: block;
    padding: 0 1.15rem 1.5rem;
    margin-top: -1.25rem;
    place-items: unset;
  }

  .login-card {
    width: 100%;
    border-radius: 16px 8px 8px 8px;
    padding: 1.5rem 1.25rem 1.35rem;
    margin: 0 auto;
  }

  .logo-blue {
    width: 100px;
    margin-bottom: 0.85rem;
  }

  .login-card h2 {
    font-size: 1.55rem;
  }

  .subtitle {
    margin-bottom: 1.15rem;
  }
}

@media (max-width: 600px) {
  .brand-panel {
    padding: 1rem 1.1rem 1.25rem;
    gap: 0.65rem;
  }

  .form-panel {
    padding: 0 0.9rem calc(1.25rem + env(safe-area-inset-bottom, 0px));
    margin-top: -1rem;
  }

  .login-card {
    padding: 1.25rem 1.05rem 1.2rem;
  }

  .toggle-pass {
    min-height: 44px;
  }

  .submit {
    min-height: 48px;
  }
}
</style>
