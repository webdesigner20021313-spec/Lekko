import React, { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import {
  Modal, ModalContent, ModalHeader, ModalTitle,
  ModalDescription, ModalFooter,
} from '@/shared/ui-kit/Modal'
import { cn } from '@/shared/utils/utils'
import { useUsersStore } from '@/pages/Users/stores/useUsersStore'
import {
  PROJECTS_CONFIG, PORTAL_SECTIONS_CONFIG,
  PERMISSION_LABELS, buildEmptySectionAccess, buildEmptyProjectAccess,
  type ProjectAccess, type SectionAccess, type PermissionType,
} from './types/users.types'

interface Props {
  open:    boolean
  onClose: () => void
}

type Step = 1 | 2 | 3

type SelectedItem = { kind: 'project'; id: string } | { kind: 'portal'; id: string }

export function RoleCreateWizard({ open, onClose }: Props) {
  const { addRole } = useUsersStore()

  const [step,      setStep]      = useState<Step>(1)
  const [roleName,  setRoleName]  = useState('')
  const [nameError, setNameError] = useState('')
  const [selected,  setSelected]  = useState<SelectedItem[]>([])
  const [selError,  setSelError]  = useState('')

  const [projects,       setProjects]       = useState<Record<string, ProjectAccess>>({})
  const [portalSections, setPortalSections] = useState<Record<string, SectionAccess>>({})

  useEffect(() => {
    if (!open) return
    setStep(1); setRoleName(''); setNameError('')
    setSelected([]); setSelError('')
    setProjects({}); setPortalSections({})
  }, [open])

  // ── Navigation ────────────────────────────────────────────────────────────

  function goToStep2() {
    if (!roleName.trim()) { setNameError('Введите название роли'); return }
    setNameError(''); setStep(2)
  }

  function goToStep3() {
    if (selected.length === 0) { setSelError('Выберите хотя бы один раздел'); return }
    setSelError('')

    // Init state for newly selected items, preserve existing
    const nextProjects: Record<string, ProjectAccess> = {}
    const nextPortal:   Record<string, SectionAccess>  = {}

    for (const item of selected) {
      if (item.kind === 'project') {
        const config = PROJECTS_CONFIG.find((p) => p.id === item.id)!
        nextProjects[item.id] = projects[item.id] ?? { ...buildEmptyProjectAccess(config), enabled: true }
      } else {
        nextPortal[item.id] = portalSections[item.id] ?? { ...buildEmptySectionAccess(), enabled: true }
      }
    }

    setProjects(nextProjects)
    setPortalSections(nextPortal)
    setStep(3)
  }

  // ── Selection helpers ─────────────────────────────────────────────────────

  function toggleItem(item: SelectedItem) {
    setSelected((prev) => {
      const exists = prev.some((s) => s.kind === item.kind && s.id === item.id)
      return exists
        ? prev.filter((s) => !(s.kind === item.kind && s.id === item.id))
        : [...prev, item]
    })
    setSelError('')
  }

  function isSelected(item: SelectedItem) {
    return selected.some((s) => s.kind === item.kind && s.id === item.id)
  }

  // ── Permission helpers ────────────────────────────────────────────────────

  function toggleSectionPerm(projectId: string, sectionId: string, perm: PermissionType) {
    setProjects((prev) => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        sections: {
          ...prev[projectId].sections,
          [sectionId]: {
            ...prev[projectId].sections[sectionId],
            [perm]: !prev[projectId].sections[sectionId]?.[perm],
          },
        },
      },
    }))
  }

  function toggleSectionEnabled(projectId: string, sectionId: string) {
    setProjects((prev) => {
      const cur = prev[projectId].sections[sectionId]
      return {
        ...prev,
        [projectId]: {
          ...prev[projectId],
          sections: {
            ...prev[projectId].sections,
            [sectionId]: { ...cur, enabled: !cur.enabled },
          },
        },
      }
    })
  }

  function togglePortalPerm(sectionId: string, perm: PermissionType) {
    setPortalSections((prev) => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], [perm]: !prev[sectionId][perm] },
    }))
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  function handleSave() {
    addRole({ name: roleName.trim(), projects, portalSections })
    onClose()
  }

  // ── Step indicator ────────────────────────────────────────────────────────

  const STEPS = [
    { n: 1 as Step, label: 'Название' },
    { n: 2 as Step, label: 'Разделы'  },
    { n: 3 as Step, label: 'Права'    },
  ]

  const PERMS: PermissionType[] = ['view', 'edit', 'delete']

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Modal open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <ModalContent className="max-w-2xl">

        {/* Step indicator */}
        <div className="mb-2 flex items-center">
          {STEPS.map(({ n, label }, i) => (
            <React.Fragment key={n}>
              <div className="flex items-center gap-2">
                <div className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                  step >= n ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'
                )}>
                  {step > n ? <Check className="h-3.5 w-3.5" /> : n}
                </div>
                <span className={cn('text-sm transition-colors', step >= n ? 'font-medium text-gray-900' : 'text-gray-400')}>
                  {label}
                </span>
              </div>
              {i < 2 && (
                <div className={cn('mx-3 h-px flex-1 transition-colors', step > n ? 'bg-gray-900' : 'bg-gray-200')} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── Step 1: Название ─────────────────────────────────────────────── */}
        {step === 1 && (
          <>
            <ModalHeader>
              <ModalTitle>Название роли</ModalTitle>
              <ModalDescription>Придумайте понятное название — например, «Менеджер» или «Оператор»</ModalDescription>
            </ModalHeader>
            <div className="py-4">
              <input
                type="text"
                placeholder="Название роли"
                value={roleName}
                autoFocus
                onChange={(e) => { setRoleName(e.target.value); setNameError('') }}
                onKeyDown={(e) => { if (e.key === 'Enter') goToStep2() }}
                className="h-10 w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-400/20"
              />
              {nameError && <p className="mt-1.5 text-xs text-red-500">{nameError}</p>}
            </div>
            <ModalFooter>
              <button onClick={onClose} className="h-9 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Отмена</button>
              <button onClick={goToStep2} className="h-9 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-black dark:bg-[#f1f1f1] dark:text-gray-900 dark:hover:bg-[#e0e0e0]">Далее →</button>
            </ModalFooter>
          </>
        )}

        {/* ── Step 2: Разделы ──────────────────────────────────────────────── */}
        {step === 2 && (
          <>
            <ModalHeader>
              <ModalTitle>Доступ к разделам</ModalTitle>
              <ModalDescription>Выберите проекты и разделы для роли «{roleName}»</ModalDescription>
            </ModalHeader>
            <div className="py-4 space-y-4">

              {/* Projects */}
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Проекты</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {PROJECTS_CONFIG.map((p) => {
                    const item: SelectedItem = { kind: 'project', id: p.id }
                    const sel = isSelected(item)
                    return (
                      <button
                        key={p.id}
                        onClick={() => toggleItem(item)}
                        className={cn(
                          'flex flex-col gap-1 rounded-xl border-2 p-4 text-left transition-all duration-150',
                          sel ? 'border-gray-900 bg-gray-50 dark:bg-gray-700' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors',
                            sel ? 'border-gray-900 bg-gray-900' : 'border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700'
                          )}>
                            {sel && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <span className={cn('text-sm font-medium', sel ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400')}>{p.label}</span>
                        </div>
                        {p.sections.length > 0 && (
                          <p className="pl-7 text-xs text-gray-400">{p.sections.length} разделов</p>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Portal sections */}
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Разделы портала</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {PORTAL_SECTIONS_CONFIG.map((s) => {
                    const item: SelectedItem = { kind: 'portal', id: s.id }
                    const sel = isSelected(item)
                    return (
                      <button
                        key={s.id}
                        onClick={() => toggleItem(item)}
                        className={cn(
                          'flex items-center gap-2.5 rounded-xl border-2 p-4 text-left transition-all duration-150',
                          sel ? 'border-gray-900 bg-gray-50 dark:bg-gray-700' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        )}
                      >
                        <div className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors',
                          sel ? 'border-gray-900 bg-gray-900' : 'border-gray-300 bg-white'
                        )}>
                          {sel && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <span className={cn('text-sm font-medium', sel ? 'text-gray-900' : 'text-gray-600')}>{s.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {selError && <p className="text-xs text-red-500">{selError}</p>}
            </div>
            <ModalFooter>
              <button onClick={() => setStep(1)} className="h-9 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">← Назад</button>
              <button onClick={goToStep3} className="h-9 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-black dark:bg-[#f1f1f1] dark:text-gray-900 dark:hover:bg-[#e0e0e0]">Далее →</button>
            </ModalFooter>
          </>
        )}

        {/* ── Step 3: Права ────────────────────────────────────────────────── */}
        {step === 3 && (
          <>
            <ModalHeader>
              <ModalTitle>Права доступа</ModalTitle>
              <ModalDescription>Настройте права роли «{roleName}»</ModalDescription>
            </ModalHeader>
            <div className="max-h-[50vh] overflow-y-auto py-4 space-y-4">

              {/* Projects */}
              {selected.filter((s) => s.kind === 'project').map((item) => {
                const config = PROJECTS_CONFIG.find((p) => p.id === item.id)!
                const proj   = projects[item.id]
                if (!proj) return null

                return (
                  <div key={item.id} className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2.5">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{config.label}</p>
                    </div>

                    {config.sections.length === 0 ? (
                      <div className="px-4 py-3 text-xs text-gray-400">Разделы появятся позже</div>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100 dark:border-gray-700">
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
                                      onClick={() => toggleSectionEnabled(item.id, sec.id)}
                                      className={cn(
                                        'relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors',
                                        acc.enabled ? 'bg-gray-900' : 'bg-gray-200 dark:bg-gray-600'
                                      )}
                                    >
                                      <span className={cn(
                                        'inline-block h-3 w-3 rounded-full bg-white shadow transition-transform',
                                        acc.enabled ? 'translate-x-3.5' : 'translate-x-0.5'
                                      )} />
                                    </button>
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{sec.label}</span>
                                  </div>
                                </td>
                                {PERMS.map((perm) => (
                                  <td key={perm} className="px-3 py-2.5 text-center">
                                    <button
                                      disabled={!acc.enabled}
                                      onClick={() => toggleSectionPerm(item.id, sec.id, perm)}
                                      className={cn(
                                        'mx-auto flex h-5 w-5 items-center justify-center rounded border-2 transition-colors',
                                        acc[perm] && acc.enabled
                                          ? 'border-gray-900 bg-gray-900'
                                          : 'border-gray-200 dark:border-gray-500 bg-white dark:bg-gray-700',
                                        !acc.enabled && 'pointer-events-none'
                                      )}
                                    >
                                      {acc[perm] && acc.enabled && <Check className="h-3 w-3 text-white" />}
                                    </button>
                                  </td>
                                ))}
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )
              })}

              {/* Portal sections */}
              {selected.filter((s) => s.kind === 'portal').length > 0 && (
                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2.5">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Разделы портала</p>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="px-4 py-2 text-left text-[11px] font-semibold text-gray-400">Раздел</th>
                        {PERMS.map((p) => (
                          <th key={p} className="px-3 py-2 text-center text-[11px] font-semibold text-gray-400">{PERMISSION_LABELS[p]}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {selected.filter((s) => s.kind === 'portal').map((item) => {
                        const sec = PORTAL_SECTIONS_CONFIG.find((s) => s.id === item.id)!
                        const acc = portalSections[item.id] ?? buildEmptySectionAccess()
                        return (
                          <tr key={item.id}>
                            <td className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300">{sec.label}</td>
                            {PERMS.map((perm) => (
                              <td key={perm} className="px-3 py-2.5 text-center">
                                <button
                                  onClick={() => togglePortalPerm(item.id, perm)}
                                  className={cn(
                                    'mx-auto flex h-5 w-5 items-center justify-center rounded border-2 transition-colors',
                                    acc[perm] ? 'border-gray-900 bg-gray-900' : 'border-gray-200 dark:border-gray-500 bg-white dark:bg-gray-700'
                                  )}
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
            </div>
            <ModalFooter>
              <button onClick={() => setStep(2)} className="h-9 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">← Назад</button>
              <button onClick={handleSave} className="h-9 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-black dark:bg-[#f1f1f1] dark:text-gray-900 dark:hover:bg-[#e0e0e0]">Сохранить роль</button>
            </ModalFooter>
          </>
        )}

      </ModalContent>
    </Modal>
  )
}
