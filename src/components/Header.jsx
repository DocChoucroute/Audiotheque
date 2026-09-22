import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="border-b border-line bg-paper">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
        <Link to="/" className="flex items-baseline gap-2 no-underline">
          <span className="text-lg font-semibold tracking-tight text-ink">
            Audiothèque
          </span>
        </Link>
        <Link
          to="/admin"
          className="text-sm text-ink-soft hover:text-accent transition-colors"
        >
          Admin
        </Link>
      </div>
    </header>
  )
}
