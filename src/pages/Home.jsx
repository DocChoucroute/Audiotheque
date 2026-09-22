import { useEffect, useState } from 'react'
import BookCard from '../components/BookCard'
import { EmptyState, ErrorMessage, Loading } from '../components/Feedback'
import { fetchBooks } from '../lib/api'

export default function Home() {
  const [books, setBooks] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchBooks()
      .then(setBooks)
      .catch((e) => setError(e.message))
  }, [])

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-5 py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-ink">
        Mes livres audio
      </h1>

      {error && <ErrorMessage message={error} />}
      {!error && !books && <Loading label="Chargement des livres…" />}
      {books && books.length === 0 && (
        <EmptyState>Aucun livre pour le moment.</EmptyState>
      )}

      <div className="flex flex-col gap-3">
        {books?.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </div>
  )
}
