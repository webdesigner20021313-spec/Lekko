import { useState } from 'react'

export function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}>
      <div className="flex h-4 w-4 cursor-default select-none items-center justify-center rounded-full bg-gray-400 hover:bg-gray-500 transition-colors">
        <span className="text-[9px] font-bold leading-none text-white">!</span>
      </div>
      {show && (
        <div className="absolute right-0 top-5 z-50 w-52 rounded-lg bg-gray-900 p-2.5 shadow-lg dark:bg-[#f1f1f1]">
          <p className="text-xs leading-snug text-white dark:text-gray-900">{text}</p>
        </div>
      )}
    </div>
  )
}
