import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, CheckCircle2, ShieldCheck } from 'lucide-react'
import { cn } from '@/shared/utils/utils'
import { useUsersStore } from '@/pages/Users/stores/useUsersStore'
import {
  PROJECTS_CONFIG, PORTAL_SECTIONS_CONFIG,
  PERMISSION_LABELS, buildEmptySectionAccess, buildEmptyProjectAccess,
  type ProjectAccess, type SectionAccess, type PermissionType,
} from './types/users.types'

const PERMS: PermissionType[] = ['view', 'edit', 'delete']

// ── Success modal ─────────────────────────────────────────────────────────────

interface SuccessModalProps {
  roleName: string
  onClose:  () => void
}

function SuccessModal({ roleName, onClose }: SuccessModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm px-4"
         style={{ paddingTop: 80 }}>
      <div className="flex w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white dark:bg-[#222222] shadow-xl">
        <div className="flex flex-col items-center px-6 pt-8 pb-6 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Роль успешно создана</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-[#929292]">Новая роль добавлена в систему</p>
          <div className="mt-4 w-full flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-[#333333] px-4 py-3 text-left">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-900">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Название роли</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{roleName}</p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 dark:border-gray-700 px-6 py-4">
          <button
            onClick={onClose}
            className="h-10 w-full rounded-xl bg-gray-900 text-sm font-semibold text-white hover:bg-black dark:bg-[#f1f1f1] dark:text-gray-900 dark:hover:bg-[#e0e0e0]"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  )
}

// ── RoleCreatePage ────────────────────────────────────────────────────────────

export function RoleCreatePage() {
  const navigate           = useNavigate()
  const { addRole, roles } = useUsersStore()

  const [name,           setName]           = useState('')
  const [nameError,      setNameError]      = useState('')
  const [projects,       setProjects]       = useState<Record<string, ProjectAccess>>(
    () => Object.fromEntries(PROJECTS_CONFIG.map((c) => [c.id, buildEmptyProjectAccess(c)]))
  )
  const [portalSections, setPortalSections] = useState<Record<string, SectionAccess>>(
    () => Object.fromEntries(PORTAL_SECTIONS_CONFIG.map((s) => [s.id, buildEmptySectionAccess()]))
  )
  const [savedName, setSavedName] = useState<string | null>(null)

  // ── Toggle helpers ────────────────────────────────────────────────────────

  function toggleProjectEnabled(projectId: string) {
    setProjects((prev) => ({
      ...prev,
      [projectId]: { ...prev[projectId], enabled: !prev[projectId].enabled },
    }))
  }

  function toggleSectionEnabled(projectId: string, sectionId: string) {
    setProjects((prev) => {
      const cur = prev[projectId].sections[sectionId]
      return {
        ...prev,
        [projectId]: {
          ...prev[projectId],
          sections: { ...prev[projectId].sections, [sectionId]: { ...cur, enabled: !cur.enabled } },
        },
      }
    })
  }

  function toggleSectionPerm(projectId: string, sectionId: string, perm: PermissionType) {
    setProjects((prev) => {
      const cur = prev[projectId].sections[sectionId]
      return {
        ...prev,
        [projectId]: {
          ...prev[projectId],
          sections: { ...prev[projectId].sections, [sectionId]: { ...cur, [perm]: !cur[perm] } },
        },
      }
    })
  }

  function togglePortalEnabled(sectionId: string) {
    setPortalSections((prev) => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], enabled: !prev[sectionId].enabled },
    }))
  }

  function togglePortalPerm(sectionId: string, perm: PermissionType) {
    setPortalSections((prev) => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], [perm]: !prev[sectionId][perm] },
    }))
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) { setNameError('Введите название роли'); return }
    if (roles.some((r) => r.name.toLowerCase() === trimmed.toLowerCase())) {
      setNameError('Роль с таким названием уже существует'); return
    }

    const activeProjects = Object.fromEntries(
      Object.entries(projects).filter(([, p]) => p.enabled)
    )
    const activeSections = Object.fromEntries(
      Object.entries(portalSections).filter(([, s]) => s.enabled)
    )

    addRole({ name: trimmed, projects: activeProjects, portalSections: activeSections })
    setSavedName(trimmed)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="flex h-full flex-col overflow-hidden bg-white dark:bg-[#111111]">
        <div className="min-h-0 flex-1 overflow-y-auto">

          <div className="px-6 pt-5 pb-0">
            <button
              onClick={() => navigate('/users/roles')}
              className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-[#929292] hover:text-gray-700 dark:hover:text-gray-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Назад к ролям
            </button>
          </div>

          <div className="mx-auto max-w-3xl px-6 pb-8 pt-5">

            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Создание роли</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-[#929292]">Настройте доступы для новой роли</p>
            </div>

            {/* Role name */}
            <div className="mb-6">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Название роли</label>
              <input
                type="text"
                placeholder="Например: Менеджер, Оператор"
                value={name}
                autoFocus
                onChange={(e) => { setName(e.target.value); setNameError('') }}
                className={cn(
                  'h-10 w-full rounded-lg border px-3 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-[#222222] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-400/20',
                  nameError ? 'border-red-300 focus:border-red-400' : 'border-gray-200 dark:border-gray-600 focus:border-gray-400',
                )}
              />
              {nameError && <p className="mt-1.5 text-xs text-red-500">{nameError}</p>}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700" />

            {/* All sections */}
            <div className="mt-6 mb-3">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Разделы</h2>
              <p className="text-xs text-gray-400">Настройте доступ к разделам платформы</p>
            </div>

            <div className="flex flex-col gap-3">
              {PROJECTS_CONFIG.map((config) => {
                const proj = projects[config.id]

                return (
                  <div key={config.id} className={cn(
                    'overflow-hidden rounded-xl border transition-colors',
                    proj.enabled ? 'border-gray-200 dark:border-gray-600 bg-white dark:bg-[#222222]' : 'border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-[#222222]/40'
                  )}>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1">
                        <p className={cn('text-sm font-semibold', proj.enabled ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400')}>
                          {config.label}
                        </p>
                        {config.sections.length > 0 && (
                          <p className="text-xs text-gray-400">
                            {Object.values(proj.sections).filter((s) => s.enabled).length} из {config.sections.length} разделов активно
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => toggleProjectEnabled(config.id)}
                        className={cn(
                          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200',
                          proj.enabled ? 'bg-gray-900' : 'bg-gray-200 dark:bg-gray-600',
                        )}
                      >
                        <span className={cn(
                          'inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
                          proj.enabled ? 'translate-x-5' : 'translate-x-0.5',
                        )} />
                      </button>
                    </div>

                    {proj.enabled && config.sections.length > 0 && (
                      <div className="border-t border-gray-100 dark:border-gray-700">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-100 dark:border-[#333333] bg-gray-50/50 dark:bg-[#1a1a1a]">
                              <th className="px-4 py-2 text-left text-[11px] font-semibold text-gray-400">Раздел</th>
                              {PERMS.map((p) => (
                                <th key={p} className="px-3 py-2 text-center text-[11px] font-semibold text-gray-400">{PERMISSION_LABELS[p]}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 dark:divide-[#333333]">
                            {config.sections.map((sec) => {
                              const acc = proj.sections[sec.id] ?? buildEmptySectionAccess()
                              return (
                                <tr key={sec.id} className={cn('transition-opacity', !acc.enabled && 'opacity-40')}>
                                  <td className="px-4 py-2.5">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => toggleSectionEnabled(config.id, sec.id)}
                                        className={cn(
                                          'relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors',
                                          acc.enabled ? 'bg-gray-900 dark:bg-[#f1f1f1]' : 'bg-gray-200 dark:bg-gray-600'
                                        )}
                                      >
                                        <span className={cn(
                                          'inline-block h-3 w-3 rounded-full bg-white shadow transition-transform',
                                          acc.enabled ? 'translate-x-3.5 dark:bg-gray-900' : 'translate-x-0.5'
                                        )} />
                                      </button>
                                      <span className="text-sm text-gray-700 dark:text-gray-300">{sec.label}</span>
                                    </div>
                                  </td>
                                  {PERMS.map((perm) => (
                                    <td key={perm} className="px-3 py-2.5 text-center">
                                      <button
                                        disabled={!acc.enabled}
                                        onClick={() => toggleSectionPerm(config.id, sec.id, perm)}
                                        className={cn(
                                          'mx-auto flex h-5 w-5 items-center justify-center rounded border-2 transition-colors',
                                          acc[perm] && acc.enabled ? 'border-gray-900 bg-gray-900 dark:border-[#f1f1f1] dark:bg-[#f1f1f1]' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-[#222222]',
                                          !acc.enabled && 'pointer-events-none'
                                        )}
                                      >
                                        {acc[perm] && acc.enabled && <Check className="h-3 w-3 text-white dark:text-gray-900" />}
                                      </button>
                                    </td>
                                  ))}
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {proj.enabled && config.sections.length === 0 && (
                      <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3 text-xs text-gray-400">
                        Разделы появятся позже
                      </div>
                    )}
                  </div>
                )
              })}

              {PORTAL_SECTIONS_CONFIG.map((sec) => {
                const acc = portalSections[sec.id] ?? buildEmptySectionAccess()
                return (
                  <div key={sec.id} className={cn(
                    'overflow-hidden rounded-xl border transition-colors',
                    acc.enabled ? 'border-gray-200 dark:border-gray-600 bg-white dark:bg-[#222222]' : 'border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-[#222222]/40'
                  )}>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1">
                        <p className={cn('text-sm font-semibold', acc.enabled ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400')}>
                          {sec.label}
                        </p>
                      </div>
                      <button
                        onClick={() => togglePortalEnabled(sec.id)}
                        className={cn(
                          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200',
                          acc.enabled ? 'bg-gray-900' : 'bg-gray-200 dark:bg-gray-600',
                        )}
                      >
                        <span className={cn(
                          'inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
                          acc.enabled ? 'translate-x-5' : 'translate-x-0.5',
                        )} />
                      </button>
                    </div>

                    {acc.enabled && (
                      <div className="border-t border-gray-100 dark:border-gray-700">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-100 dark:border-[#333333] bg-gray-50/50 dark:bg-[#1a1a1a]">
                              <th className="px-4 py-2 text-left text-[11px] font-semibold text-gray-400">Раздел</th>
                              {PERMS.map((p) => (
                                <th key={p} className="px-3 py-2 text-center text-[11px] font-semibold text-gray-400">{PERMISSION_LABELS[p]}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300">{sec.label}</td>
                              {PERMS.map((perm) => (
                                <td key={perm} className="px-3 py-2.5 text-center">
                                  <button
                                    onClick={() => togglePortalPerm(sec.id, perm)}
                                    className={cn(
                                      'mx-auto flex h-5 w-5 items-center justify-center rounded border-2 transition-colors',
                                      acc[perm] ? 'border-gray-900 bg-gray-900 dark:border-[#f1f1f1] dark:bg-[#f1f1f1]' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-[#222222]',
                                    )}
                                  >
                                    {acc[perm] && <Check className="h-3 w-3 text-white dark:text-gray-900" />}
                                  </button>
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

          </div>
        </div>

        {/* Sticky footer */}
        <div className="shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111111] px-6 py-4 shadow-sm">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => navigate('/users/roles')}
              className="h-9 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#222222] px-4 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#333333]"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              className="h-9 rounded-lg bg-gray-900 px-5 text-sm font-semibold text-white hover:bg-black dark:bg-[#f1f1f1] dark:text-gray-900 dark:hover:bg-[#e0e0e0]"
            >
              Создать роль
            </button>
          </div>
        </div>
      </div>

      {savedName && (
        <SuccessModal
          roleName={savedName}
          onClose={() => navigate('/users/roles')}
        />
      )}
    </>
  )
}
