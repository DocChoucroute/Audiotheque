import { Link } from 'react-router-dom'

export default function BookCard({ book }) {
  return (
    <Link
      to={`/livres/${book.id}`}
      className="group flex gap-4 rounded-lg border border-line bg-white p-4 no-underline transition-colors hover:border-accent"
    >
      <div className="flex h-24 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-paper-dim">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-2xl text-ink-soft/40" aria-hidden="true">
            📖
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-base font-semibold text-ink group-hover:text-accent">
          {book.title}
        </h2>
        {book.author && (
          <p className="mt-0.5 text-sm text-ink-soft">{book.author}</p>
        )}
        {book.description && (
          <p className="mt-2 line-clamp-2 text-sm text-ink-soft">
            {book.description}
          </p>
        )}
      </div>
    </Link>
  )
}
