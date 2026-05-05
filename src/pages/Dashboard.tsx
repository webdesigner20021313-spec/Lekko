import { Link } from 'react-router-dom'
import { products, productOrder } from '@/config/products'

export function Dashboard() {
  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold text-gray-900">Добро пожаловать в Lekko</h1>
        <p className="mt-2 text-sm text-gray-500">Выберите продукт для перехода</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {productOrder.map((id) => {
            const product = products[id]
            const firstSection = product.sections[0]
            const target = firstSection
              ? `${product.basePath}/${firstSection.slug}`
              : product.basePath
            return (
              <Link
                key={id}
                to={target}
                className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50"
              >
                <img src={product.logo} alt={product.name} className="h-10 w-auto" />
                <p className="text-sm text-gray-500">
                  {product.sections.length > 0
                    ? `${product.sections.length} разделов`
                    : 'В разработке'}
                </p>
              </Link>
            )
          })}
        </div>

        <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Администрирование</h2>
          <Link
            to="/users"
            className="mt-3 inline-block text-sm font-medium text-[#3872FA] hover:underline"
          >
            Пользователи и роли →
          </Link>
        </div>
      </div>
    </div>
  )
}
