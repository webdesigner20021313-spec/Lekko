import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, X } from 'lucide-react'
import { cn } from '@/shared/utils/utils'
import { useUsersStore } from '@/pages/Users/stores/useUsersStore'
import {
  PROJECTS_CONFIG, PORTAL_SECTIONS_CONFIG,
  mergeProjectAccess, buildEmptySectionAccess,
  type ProjectAccess, type SectionAccess, type PermissionType,
} from './types/users.types'

const PERMS: PermissionType[] = ['view', 'edit', 'delete']

interface Props {
  open:    boolean
  roleId:  string | null
  onClose: () => void
}

export function RoleEditModal({ open, roleId, onClose }: Props) {
  const { t } = useTranslation()
  const { roles, updateRole } = useUsersStore()
  const role = roles.find((r) => r.id === roleId) ?? null

  const [name,           setName]           = useState('')
  const [nameError,      setNameError]      = useState('')
  const [projects,       setProjects]       = useState<Record<string, ProjectAccess>>({})
  const [portalSections, setPortalSections] = useState<Record<string, SectionAccess>>({})

  useEffect(() => {
    if (!open || !role) return
    setName(role.name)
    setNameError('')
    setProjects(Object.fromEntries(PROJECTS_CONFIG.map((c) => [c.id, mergeProjectAccess(role.projects[c.id], c)])))
    setPortalSections(Object.fromEntries(PORTAL_SECTIONS_CONFIG.map((s) => [s.id, role.portalSections[s.id] ?? buildEmptySectionAccess()])))
  }, [open, role])

  function toggleProjectEnabled(projectId: string) {
    setProjects((prev) => ({
      ...prev,
      [projectId]: { ...prev[projectId], enabled: !prev[projectId].enabled },
    }))
  }

  function toggleSectionEnabled(projectId: string, sectionId: string) {
    setProjects((prev) => {
      const cur = prev[projectId].sections[sectionId]
      const enabling = !cur.enabled
      return {
        ...prev,
        [projectId]: {
          ...prev[projectId],
          sections: { ...prev[projectId].sections, [sectionId]: { ...cur, enabled: enabling, view: enabling ? true : cur.view } },
        },
      }
    })
  }

  function toggleSectionPerm(projectId: string, sectionId: string, perm: PermissionType) {
    setProjects((prev) => {
      const cur = prev[projectId].sections[sectionId]
      const updated = { ...cur, [perm]: !cur[perm] }
      const anyActive = updated.view || updated.edit || updated.delete
      return {
        ...prev,
        [projectId]: {
          ...prev[projectId],
          sections: { ...prev[projectId].sections, [sectionId]: { ...updated, enabled: anyActive } },
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

  function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) { setNameError(t('role_name_error')); return }
    if (roles.some((r) => r.id !== roleId && r.name.toLowerCase() === trimmed.toLowerCase())) {
      setNameError(t('role_name_exists')); return
    }
    const activeProjects = Object.fromEntries(Object.entries(projects).filter(([, p]) => p.enabled))
    const activeSections = Object.fromEntries(Object.entries(portalSections).filter(([, s]) => s.enabled))
    updateRole(roleId!, { name: trimmed, projects: activeProjects, portalSections: activeSections })
    onClose()
  }

  function getProjectLabel(id: string, fallback: string) {
    if (id === 'users') return t('nav_users')
    return fallback
  }

  function getSecLabel(id: string, fallback: string) {
    return t(`role_sec_${id.replace('-', '_')}`, fallback)
  }

  if (!open || !role) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm px-4 pt-10 pb-4">
      <div
        className="flex w-full max-w-2xl flex-col rounded-2xl bg-white dark:bg-gray-800 shadow-xl"
        style={{ maxHeight: 'calc(100vh - 96px)' }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 dark:border-gray-700 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('role_edit_title')}</h2>
            <p className="text-sm text-gray-400">{t('role_edit_desc')}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">

          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('role_name_label')}</label>
            <input
              type="text"
              value={name}
              autoFocus
              onChange={(e) => { setName(e.target.value); setNameError('') }}
              className={cn(
                'h-10 w-full rounded-lg border px-3 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-400/20',
                nameError ? 'border-red-300 focus:border-red-400' : 'border-gray-200 dark:border-gray-600 focus:border-gray-400',
              )}
            />
            {nameError && <p className="mt-1.5 text-xs text-red-500">{nameError}</p>}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700" />

          <div className="mt-5 mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('role_sections_title')}</h3>
            <p className="text-xs text-gray-400">{t('role_sections_desc')}</p>
          </div>

          <div className="flex flex-col gap-3">
            {PROJECTS_CONFIG.map((config) => {
              const proj = projects[config.id]
              if (!proj) return null
              return (
                <div key={config.id} className={cn(
                  'overflow-hidden rounded-xl border transition-colors',
                  proj.enabled ? 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700' : 'border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/60'
                )}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1">
                      <p className={cn('text-sm font-semibold', proj.enabled ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400')}>
                        {getProjectLabel(config.id, config.label)}
                      </p>
                      {config.sections.length > 0 && (
                        <p className="text-xs text-gray-400">
                          {t('role_sections_active', {
                            active: Object.values(proj.sections).filter((s) => s.enabled).length,
                            total: config.sections.length,
                          })}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => toggleProjectEnabled(config.id)}
                      className={cn('relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200', proj.enabled ? 'bg-gray-900' : 'bg-gray-200 dark:bg-gray-600')}
                    >
                      <span className={cn('inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200', proj.enabled ? 'translate-x-5' : 'translate-x-0.5')} />
                    </button>
                  </div>

                  {proj.enabled && config.sections.length > 0 && (
                    <div className="border-t border-gray-100 dark:border-gray-700">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50">
                            <th className="px-4 py-2 text-left text-[11px] font-semibold text-gray-400">{t('role_sec_col')}</th>
                            {PERMS.map((p) => (
                              <th key={p} className="px-3 py-2 text-center text-[11px] font-semibold text-gray-400">{t(`perm_${p}`)}</th>
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
                                      className={cn('relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors', acc.enabled ? 'bg-gray-900' : 'bg-gray-200 dark:bg-gray-600')}
                                    >
                                      <span className={cn('inline-block h-3 w-3 rounded-full bg-white shadow transition-transform', acc.enabled ? 'translate-x-3.5' : 'translate-x-0.5')} />
                                    </button>
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{getSecLabel(sec.id, sec.label)}</span>
                                  </div>
                                </td>
                                {PERMS.map((perm) => (
                                  <td key={perm} className="px-3 py-2.5 text-center">
                                    <button
                                      onClick={() => toggleSectionPerm(config.id, sec.id, perm)}
                                      className={cn('mx-auto flex h-5 w-5 items-center justify-center rounded border-2 transition-colors', acc[perm] ? 'border-gray-900 bg-gray-900' : 'border-gray-200 dark:border-gray-500 bg-white dark:bg-gray-700')}
                                    >
                                      {acc[perm] && <Check className="h-3 w-3 text-white" />}
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
                    <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3 text-xs text-gray-400">{t('role_sections_soon')}</div>
                  )}
                </div>
              )
            })}

            {PORTAL_SECTIONS_CONFIG.map((sec) => {
              const acc = portalSections[sec.id] ?? buildEmptySectionAccess()
              return (
                <div key={sec.id} className={cn('overflow-hidden rounded-xl border transition-colors', acc.enabled ? 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700' : 'border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/60')}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1">
                      <p className={cn('text-sm font-semibold', acc.enabled ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400')}>{getSecLabel(sec.id, sec.label)}</p>
                    </div>
                    <button
                      onClick={() => togglePortalEnabled(sec.id)}
                      className={cn('relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200', acc.enabled ? 'bg-gray-900' : 'bg-gray-200 dark:bg-gray-600')}
                    >
                      <span className={cn('inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200', acc.enabled ? 'translate-x-5' : 'translate-x-0.5')} />
                    </button>
                  </div>
                  {acc.enabled && (
                    <div className="border-t border-gray-100 dark:border-gray-700">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50">
                            <th className="px-4 py-2 text-left text-[11px] font-semibold text-gray-400">{t('role_sec_col')}</th>
                            {PERMS.map((p) => (
                              <th key={p} className="px-3 py-2 text-center text-[11px] font-semibold text-gray-400">{t(`perm_${p}`)}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300">{getSecLabel(sec.id, sec.label)}</td>
                            {PERMS.map((perm) => (
                              <td key={perm} className="px-3 py-2.5 text-center">
                                <button
                                  onClick={() => togglePortalPerm(sec.id, perm)}
                                  className={cn('mx-auto flex h-5 w-5 items-center justify-center rounded border-2 transition-colors', acc[perm] ? 'border-gray-900 bg-gray-900' : 'border-gray-200 dark:border-gray-500 bg-white dark:bg-gray-700')}
                                >
                                  {acc[perm] && <Check className="h-3 w-3 text-white" />}
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

        {/* Footer */}
        <div className="shrink-0 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-end gap-3">
            <button onClick={onClose} className="h-9 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600">
              {t('confirm_cancel')}
            </button>
            <button onClick={handleSave} className="h-9 rounded-lg bg-gray-900 px-5 text-sm font-semibold text-white hover:bg-black">
              {t('role_save_btn')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
