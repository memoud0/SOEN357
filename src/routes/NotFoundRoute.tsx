import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'

export function NotFoundRoute() {
  return (
    <Card>
      <h1 className="text-xl font-semibold text-slate-100">Page not found</h1>
      <p className="mt-2 text-sm text-slate-300">This route does not exist in Momentum.</p>
      <Link
        to="/"
        className="mt-4 inline-flex rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
      >
        Back to home
      </Link>
    </Card>
  )
}
