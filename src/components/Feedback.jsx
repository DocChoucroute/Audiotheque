export function Loading({ label = 'Chargement…' }) {
  return (
    <div className="flex items-center justify-center py-12 text-sm text-ink-soft">
      {label}
    </div>
  )
}

export function ErrorMessage({ message }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  )
}

export function EmptyState({ children }) {
  return (
    <div className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-sm text-ink-soft">
      {children}
    </div>
  )
}
