// ── Permission types ──────────────────────────────────────────────────────────

export type PermissionType = 'view' | 'edit' | 'delete'

export const PERMISSION_LABELS: Record<PermissionType, string> = {
  view:   'Просмотр',
  edit:   'Редактирование',
  delete: 'Удаление',
}

export const PERMISSION_DESCRIPTIONS: Record<PermissionType, string> = {
  view:   'Только просмотр, без скачиваний и действий',
  edit:   'Может изменять данные, но не удалять',
  delete: 'Может удалять данные',
}

// ── Config types ──────────────────────────────────────────────────────────────

export interface SectionConfig {
  id:    string
  label: string
}

export interface ProjectConfig {
  id:       string
  label:    string
  sections: SectionConfig[]
}

// ── Static configs (single source of truth) ───────────────────────────────────

export const PROJECTS_CONFIG: ProjectConfig[] = [
  {
    id: 'megaprice',
    label: 'Megaprice',
    sections: [
      { id: 'shop',        label: 'Магазин'     },
      { id: 'needs',       label: 'Потребности' },
      { id: 'cart',        label: 'Корзина'     },
      { id: 'orders',      label: 'Заказы'      },
      { id: 'wholesalers', label: 'Оптовики'    },
    ],
  },
  { id: 'apteka',   label: 'Apteka',   sections: [] },
  { id: 'analytic', label: 'Analytic', sections: [] },
  {
    id: 'users',
    label: 'Пользователи',
    sections: [
      { id: 'users-list', label: 'Пользователи' },
      { id: 'roles',      label: 'Роли'         },
    ],
  },
]

export const PORTAL_SECTIONS_CONFIG: SectionConfig[] = []

// ── Runtime permission state ──────────────────────────────────────────────────

export interface SectionAccess {
  enabled: boolean
  view:    boolean
  edit:    boolean
  delete:  boolean
}

export interface ProjectAccess {
  enabled:  boolean
  sections: Record<string, SectionAccess>
}

// ── Domain models ─────────────────────────────────────────────────────────────

export interface Role {
  id:             string
  name:           string
  projects:       Record<string, ProjectAccess>
  portalSections: Record<string, SectionAccess>
}

export interface User {
  id:        string
  name:      string
  phone:     string
  email?:    string
  login:     string
  password:  string
  roleId:    string | null
  isActive:  boolean
  createdAt: string
  avatar?:   string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function buildEmptySectionAccess(): SectionAccess {
  return { enabled: false, view: false, edit: false, delete: false }
}

export function buildFullSectionAccess(): SectionAccess {
  return { enabled: true, view: true, edit: true, delete: true }
}

export function buildEmptyProjectAccess(config: ProjectConfig): ProjectAccess {
  return {
    enabled:  false,
    sections: Object.fromEntries(config.sections.map((s) => [s.id, buildEmptySectionAccess()])),
  }
}

export function buildFullProjectAccess(config: ProjectConfig): ProjectAccess {
  return {
    enabled:  true,
    sections: Object.fromEntries(config.sections.map((s) => [s.id, buildFullSectionAccess()])),
  }
}

export function mergeProjectAccess(saved: ProjectAccess | undefined, config: ProjectConfig): ProjectAccess {
  if (!saved) return buildEmptyProjectAccess(config)
  return {
    enabled:  saved.enabled,
    sections: Object.fromEntries(
      config.sections.map((s) => [s.id, saved.sections[s.id] ?? buildEmptySectionAccess()])
    ),
  }
}
