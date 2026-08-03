<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { http } from '@/api/http'
import { useAuthStore } from '@/stores/auth'

type Role = { id: number; nombre: string }
type User = {
  id: number
  email: string
  nombre: string
  odooUserId: number | null
  roleId: number
  roleNombre: string | null
  activo: boolean
}

const auth = useAuthStore()
const users = ref<User[]>([])
const roles = ref<Role[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const showModal = ref(false)
const editingId = ref<number | null>(null)

const form = reactive({
  email: '',
  password: '',
  nombre: '',
  odooUserId: '' as string | number,
  roleId: '' as string | number,
  activo: true,
})

async function load() {
  loading.value = true
  error.value = null
  try {
    const usersRes = await http.get<User[]>('/admin/users')
    users.value = usersRes.data
    try {
      const rolesRes = auth.hasPermission('roles.view')
        ? await http.get<Role[]>('/admin/roles')
        : await http.get<Role[]>('/admin/roles/options')
      roles.value = rolesRes.data
    } catch {
      roles.value = []
    }
  } catch {
    error.value = 'No se pudieron cargar los usuarios'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  form.email = ''
  form.password = ''
  form.nombre = ''
  form.odooUserId = ''
  form.roleId = roles.value[0]?.id ?? ''
  form.activo = true
  showModal.value = true
}

function openEdit(user: User) {
  editingId.value = user.id
  form.email = user.email
  form.password = ''
  form.nombre = user.nombre
  form.odooUserId = user.odooUserId ?? ''
  form.roleId = user.roleId
  form.activo = user.activo
  showModal.value = true
}

async function save() {
  error.value = null
  const payload: Record<string, unknown> = {
    email: form.email.trim(),
    nombre: form.nombre.trim(),
    roleId: Number(form.roleId),
    activo: form.activo,
    odooUserId: form.odooUserId === '' ? null : Number(form.odooUserId),
  }
  if (form.password) payload.password = form.password

  try {
    if (editingId.value) {
      await http.patch(`/admin/users/${editingId.value}`, payload)
    } else {
      if (!form.password) {
        error.value = 'La contraseña es requerida'
        return
      }
      payload.password = form.password
      await http.post('/admin/users', payload)
    }
    showModal.value = false
    await load()
  } catch (e: unknown) {
    const msg =
      (e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
    error.value = Array.isArray(msg) ? msg.join(', ') : msg || 'No se pudo guardar'
  }
}

async function deactivate(user: User) {
  if (!confirm(`¿Desactivar a ${user.nombre}?`)) return
  await http.delete(`/admin/users/${user.id}`)
  await load()
}

onMounted(load)
</script>

<template>
  <section>
    <div class="page-header">
      <div>
        <h1>Usuarios</h1>
        <p>Administración de usuarios y asignación de roles</p>
      </div>
      <button
        v-if="auth.hasPermission('users.manage')"
        class="btn btn-gold"
        type="button"
        @click="openCreate"
      >
        Nuevo usuario
      </button>
    </div>

    <p v-if="error" class="error-text" role="alert">{{ error }}</p>

    <div class="card table-wrap">
      <div v-if="loading" class="loading-row">
        <span class="spinner" />
        Cargando usuarios…
      </div>
      <div v-else-if="!users.length" class="empty-state">
        <strong>Sin usuarios</strong>
        Crea el primer usuario del panel.
      </div>
      <table v-else class="data">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Odoo ID</th>
            <th>Estado</th>
            <th v-if="auth.hasPermission('users.manage')">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.nombre }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.roleNombre }}</td>
            <td>{{ user.odooUserId ?? '—' }}</td>
            <td>
              <span class="badge" :class="user.activo ? 'badge-ok' : 'badge-off'">
                {{ user.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td v-if="auth.hasPermission('users.manage')" class="actions">
              <button class="btn btn-ghost btn-sm" type="button" @click="openEdit(user)">Editar</button>
              <button
                v-if="user.activo"
                class="btn btn-danger btn-sm"
                type="button"
                @click="deactivate(user)"
              >
                Desactivar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
      <div class="modal">
        <h2>{{ editingId ? 'Editar usuario' : 'Nuevo usuario' }}</h2>
        <div class="field">
          <label>Nombre</label>
          <input v-model="form.nombre" required />
        </div>
        <div class="field">
          <label>Email</label>
          <input v-model="form.email" type="email" required />
        </div>
        <div class="field">
          <label>{{ editingId ? 'Nueva contraseña (opcional)' : 'Contraseña' }}</label>
          <input v-model="form.password" type="password" :required="!editingId" />
        </div>
        <div class="field">
          <label>Rol</label>
          <select v-model="form.roleId" required>
            <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.nombre }}</option>
          </select>
        </div>
        <div class="field">
          <label>Odoo User ID</label>
          <input v-model="form.odooUserId" type="number" placeholder="Opcional" />
        </div>
        <div class="field">
          <label>
            <input v-model="form.activo" type="checkbox" />
            Activo
          </label>
        </div>
        <div class="actions">
          <button class="btn btn-ghost" type="button" @click="showModal = false">Cancelar</button>
          <button class="btn btn-primary" type="button" @click="save">Guardar</button>
        </div>
      </div>
    </div>
  </section>
</template>
