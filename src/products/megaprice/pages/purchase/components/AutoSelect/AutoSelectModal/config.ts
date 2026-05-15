// Все города Узбекистана (для пилюль фильтра)
export const UZ_CITIES = [
  'Ташкент', 'Самарканд', 'Бухара', 'Наманган', 'Андижан',
  'Фергана', 'Нукус', 'Карши', 'Термез', 'Ургенч',
  'Навои', 'Джизак', 'Гулистон', 'Коканд',
]

export const DIST_META: Record<string, { region: string; isPrevious: boolean }> = {
  'd1':  { region: 'Ташкент',   isPrevious: true  },
  'd2':  { region: 'Самарканд', isPrevious: true  },
  'd3':  { region: 'Ташкент',   isPrevious: false },
  'd4':  { region: 'Ташкент',   isPrevious: true  },
  'd5':  { region: 'Бухара',    isPrevious: false },
  'd6':  { region: 'Андижан',   isPrevious: false },
  'd7':  { region: 'Самарканд', isPrevious: false },
  'd8':  { region: 'Навои',     isPrevious: true  },
  'd9':  { region: 'Наманган',  isPrevious: false },
  'd10': { region: 'Ташкент',   isPrevious: true  },
  'd11': { region: 'Фергана',   isPrevious: false },
  'd12': { region: 'Фергана',   isPrevious: false },
  'd13': { region: 'Самарканд', isPrevious: false },
  'd14': { region: 'Карши',     isPrevious: true  },
  'd15': { region: 'Ташкент',   isPrevious: true  },
}

export const inputCls = [
  'h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800',
  'placeholder:text-gray-400 transition-colors duration-150',
  'hover:border-gray-300 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10',
  'dark:border-gray-700 dark:bg-[#222222] dark:text-gray-200 dark:placeholder:text-gray-500 dark:hover:border-gray-600 dark:focus:border-gray-500',
].join(' ')
