import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ErrorMessage, Loading } from '../../components/Feedback'
import { createBook, fetchBooks, updateBook, uploadBookCover } from '../../lib/api'

export default function AdminDashboard() {
  const [books, setBooks] = useState(null)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)

  function reload() {
    fetchBooks()
      .then(setBooks)
      .catch((e) => setError(e.message))
  }

  useEffect(reload, [])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
          Livres
        </h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="text-sm font-medium text-accent hover:text-accent-dark"
        >
          {showForm ? 'Annuler' : '+ Ajouter un livre'}
        </button>
      </div>

      {showForm && (
        <NewBookForm
          onCreated={() => {
            setShowForm(false)
            reload()
          }}
        />
      )}

      {error && <ErrorMessage message={error} />}
      {!error && !books && <Loading />}

      <ul className="flex flex-col divide-y divide-line rounded-lg border border-line bg-white">
        {books?.map((book) => (
          <li key={book.id}>
            <Link
              to={`/admin/livres/${book.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-ink no-underline hover:bg-paper-dim"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-8 shrink-0 items-center justify-center overflow-hidden rounded bg-paper-dim">
                  {book.cover_url ? (
                    <img
                      src={book.cover_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-sm text-ink-soft/40" aria-hidden="true">
                      📖
                    </span>
                  )}
                </span>
                {book.title}
              </span>
              <span className="text-ink-soft">Gérer les chapitres →</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function NewBookForm({ onCreated }) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [description, setDescription] = useState('')
  const [cover, setCover] = useState(null)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState(null) // null | 'creating' | 'uploading'

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      setStatus('creating')
      const book = await createBook({
        title,
        author,
        description,
        cover_url: null,
      })
      if (cover) {
        setStatus('uploading')
        const coverUrl = await uploadBookCover({ bookId: book.id, file: cover })
        await updateBook(book.id, { cover_url: coverUrl })
      }
      onCreated()
    } catch (err) {
      setError(err.message)
    } finally {
      setStatus(null)
    }
  }

  const isBusy = status !== null

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 flex flex-col gap-3 rounded-lg border border-line bg-white p-4"
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titre du livre"
        required
        className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <input
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        placeholder="Auteur (optionnel)"
        className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        rows={3}
        className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <label className="text-sm text-ink-soft">
        Illustration de couverture (optionnel)
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setCover(e.target.files?.[0] ?? null)}
          className="mt-1 block text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-paper-dim file:px-3 file:py-2 file:text-sm file:text-ink hover:file:bg-line"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={isBusy || !title}
        className="self-start rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-50"
      >
        {status === 'creating' && 'Création…'}
        {status === 'uploading' && "Envoi de l'illustration…"}
        {!status && 'Créer le livre'}
      </button>
    </form>
  )
}
