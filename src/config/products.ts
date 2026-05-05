import type { ProductId } from './mode'
import megapriceLogo from '@/assets/logos/megaprice-logo.svg'
import aptekaLogo from '@/assets/logos/apteka-logo.svg'
import analyticLogo from '@/assets/logos/analytic-logo.svg'
import lekkoLogo from '@/assets/logos/lekko-logo.svg'

export interface ProductSection {
  label: string
  /** В standalone это полный путь от корня (`/purchase`). В portal — относительный к basePath (`purchase`). */
  slug: string
  iconName: string
}

export interface Product {
  id: ProductId
  name: string
  logo: string
  domain: string
  basePath: string
  sections: ProductSection[]
}

export const PORTAL_LOGO = lekkoLogo
export const PORTAL_DOMAIN = 'platform.lekko.com'

export const products: Record<ProductId, Product> = {
  megaprice: {
    id: 'megaprice',
    name: 'Mega price',
    logo: megapriceLogo,
    domain: 'megaprice.com',
    basePath: '/megaprice',
    sections: [
      { label: 'Магазин',     slug: 'purchase',     iconName: 'Store' },
      { label: 'Потребность', slug: 'need',         iconName: 'TrendingUp' },
      { label: 'Корзинка',    slug: 'cart',         iconName: 'ShoppingCart' },
      { label: 'Заказы',      slug: 'orders',       iconName: 'ClipboardList' },
      { label: 'Дистрибуторы', slug: 'wholesalers',  iconName: 'Building2' },
    ],
  },
  apteka: {
    id: 'apteka',
    name: 'Apteka',
    logo: aptekaLogo,
    domain: 'apteka.com',
    basePath: '/apteka',
    sections: [],
  },
  analytic: {
    id: 'analytic',
    name: 'Analytic',
    logo: analyticLogo,
    domain: 'analytic.com',
    basePath: '/analytic',
    sections: [],
  },
}

export const productOrder: ProductId[] = ['megaprice', 'analytic', 'apteka']

export function getProduct(id: ProductId): Product {
  return products[id]
}

/** Лого для текущего режима. */
export function getLogoForMode(productId: ProductId | null): string {
  if (productId === null) return PORTAL_LOGO
  return products[productId].logo
}
