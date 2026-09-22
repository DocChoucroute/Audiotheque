import { Link, Outlet } from 'react-router-dom'
import { Loading } from '../../components/Feedback'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import AdminLogin from './AdminLogin'

export default function AdminLayout() {
  const { isLoading, isAuthenticated, logout } = useAdminAuth()

  if (isLoading) return <Loading />
  if (!isAuthenticated) return <AdminLogin />

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-5 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/admin"
          className="text-lg font-semibold tracking-tight text-ink no-underline"
        >
          Espace admin
        </Link>
        <button
          type="button"
          onClick={logout}
          className="text-sm text-ink-soft hover:text-accent"
        >
          Déconnexion
        </button>
      </div>
      <Outlet />
    </div>
  )
}
