<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { http } from '@/api/http'
import { useAuthStore } from '@/stores/auth'

type Permission = {
  id: number
  codigo: string
  pantalla: string
  descripcion: string
}

type Role = {
  id: number
  nombre: string
  descripcion: string | null
  permissions: Permission[]
}

const auth = useAuthStore()
const roles = ref<Role[]>([])
const permissions = ref<Permission[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const showModal = ref(false)
const editing = ref<Role | null>(null)

const form = reactive({
  nombre: '',
  descripcion: '',
  permissionIds: [] as number[],
})

async function load() {
  loading.value = true
  error.value = null
  try {
    const [rolesRes, permsRes] = await Promise.all([
      http.get<Role[]>('/admin/roles'),
      http.get<Permission[]>('/admin/permissions'),
    ])
    roles.value = rolesRes.data
    permissions.value = permsRes.data
  } catch {
    error.value = 'No se pudieron cargar los roles'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  form.nombre = ''
  form.descripcion = ''
  form.permissionIds = []
  showModal.value = true
}

function openEdit(role: Role) {
  editing.value = role
  form.nombre = role.nombre
  form.descripcion = role.descripcion || ''
  form.permissionIds = role.permissions.map((p) => p.id)
  showModal.value = true
}

function togglePermission(id: number) {
  if (form.permissionIds.includes(id)) {
    form.permissionIds = form.permissionIds.filter((p) => p !== id)
  } else {
    form.permissionIds.push(id)
  }
}

async function save() {
  error.value = null
  try {
    let roleId = editing.value?.id
    if (editing.value) {
      await http.patch(`/admin/roles/${editing.value.id}`, {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
      })
    } else {
      const { data } = await http.post<Role>('/admin/roles', {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
      })
      roleId = data.id
    }

    if (roleId != null && auth.hasPermission('roles.manage')) {
      await http.put(`/admin/roles/${roleId}/permissions`, {
        permissionIds: form.permissionIds,
      })
    }

    showModal.value = false
    await load()
  } catch (e: unknown) {
    const msg =
      (e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
    error.value = Array.isArray(msg) ? msg.join(', ') : msg || 'No se pudo guardar'
  }
}

onMounted(load)
</script>

<template>
  <section>
    <div class="page-header">
      <div>
        <h1>Roles y permisos</h1>
        <p>Control de acceso por pantalla</p>
      </div>
      <button
        v-if="auth.hasPermission('roles.manage')"
        class="btn btn-gold"
        type="button"
        @click="openCreate"
      >
        Nuevo rol
      </button>
    </div>

    <p v-if="error" class="error-text" role="alert">{{ error }}</p>

    <div class="card table-wrap">
      <div v-if="loading" class="loading-row">
        <span class="spinner" />
        Cargando roles…
      </div>
      <div v-else-if="!roles.length" class="empty-state">
        <strong>Sin roles</strong>
        Define roles para controlar el acceso por pantalla.
      </div>
      <table v-else class="data">
        <thead>
          <tr>
            <th>Rol</th>
            <th>Descripción</th>
            <th>Permisos</th>
            <th v-if="auth.hasPermission('roles.manage')">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="role in roles" :key="role.id">
            <td>{{ role.nombre }}</td>
            <td>{{ role.descripcion || '—' }}</td>
            <td class="perms">
              <span v-for="p in role.permissions" :key="p.id" class="badge badge-ok">
                {{ p.codigo }}
              </span>
            </td>
            <td v-if="auth.hasPermission('roles.manage')">
              <button class="btn btn-ghost btn-sm" type="button" @click="openEdit(role)">Editar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
      <div class="modal wide">
        <h2>{{ editing ? 'Editar rol' : 'Nuevo rol' }}</h2>
        <div class="field">
          <label>Nombre</label>
          <input v-model="form.nombre" required />
        </div>
        <div class="field">
          <label>Descripción</label>
          <input v-model="form.descripcion" />
        </div>
        <div class="field">
          <label>Permisos por pantalla</label>
          <div class="checkbox-grid">
            <label v-for="perm in permissions" :key="perm.id" class="checkbox-item">
              <input
                type="checkbox"
                :checked="form.permissionIds.includes(perm.id)"
                @change="togglePermission(perm.id)"
              />
              <span>
                <strong>{{ perm.codigo }}</strong>
                <small>{{ perm.descripcion }}</small>
              </span>
            </label>
          </div>
        </div>
        <div class="actions">
          <button class="btn btn-ghost" type="button" @click="showModal = false">Cancelar</button>
          <button class="btn btn-primary" type="button" @click="save">Guardar</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.perms {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  white-space: normal;
}

.modal.wide {
  width: min(720px, 100%);
  background: var(--cream-alt);
}

.checkbox-item span {
  display: flex;
  flex-direction: column;
}

.checkbox-item small {
  color: var(--sm-muted);
}
</style>
