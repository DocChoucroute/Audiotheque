import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ErrorMessage, Loading } from '../../components/Feedback'
import {
  createChapter,
  deleteBook,
  deleteChapter,
  fetchBook,
  fetchChapters,
  MAX_UPLOAD_BYTES,
  readAudioDuration,
  updateBook,
  uploadBookCover,
  uploadChapterAudio,
} from '../../lib/api'

export default function AdminBookChapters() {
  const { bookId } = useParams()
  const [book, setBook] = useState(null)
  const [chapters, setChapters] = useState(null)
  const [error, setError] = useState(null)

  function reload() {
    Promise.all([fetchBook(bookId), fetchChapters(bookId)])
      .then(([b, c]) => {
        setBook(b)
        setChapters(c)
      })
      .catch((e) => setError(e.message))
  }

  useEffect(reload, [bookId])

  if (error) return <ErrorMessage message={error} />
  if (!book || !chapters) return <Loading />

  const nextChapterNumber =
    chapters.length > 0
      ? Math.max(...chapters.map((c) => c.chapter_number)) + 1
      : 1

  return (
    <div>
      <Link to="/admin" className="text-sm text-ink-soft hover:text-accent">
        ← Tous les livres
      </Link>

      <BookEditForm book={book} onSaved={reload} />

      <h3 className="mb-2 mt-8 text-sm font-semibold uppercase tracking-wide text-ink-soft">
        Chapitres
      </h3>

      <ul className="mb-6 flex flex-col divide-y divide-line rounded-lg border border-line bg-white">
        {chapters.map((chapter) => (
          <li
            key={chapter.id}
            className="flex items-center gap-3 px-4 py-3 text-sm"
          >
            <span className="w-6 shrink-0 tabular-nums text-ink-soft">
              {chapter.chapter_number}
            </span>
            <span className="flex-1 truncate text-ink">{chapter.title}</span>
            <button
              type="button"
              onClick={async () => {
                if (!confirm(`Supprimer le chapitre "${chapter.title}" ?`)) return
                await deleteChapter(chapter.id)
                reload()
              }}
              className="text-xs text-red-600 hover:text-red-800"
            >
              Supprimer
            </button>
          </li>
        ))}
        {chapters.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-ink-soft">
            Aucun chapitre pour l'instant.
          </li>
        )}
      </ul>

      <NewChapterForm
        bookId={bookId}
        nextChapterNumber={nextChapterNumber}
        onCreated={reload}
      />

      <DangerZone book={book} />
    </div>
  )
}

function BookEditForm({ book, onSaved }) {
  const [title, setTitle] = useState(book.title)
  const [author, setAuthor] = useState(book.author ?? '')
  const [description, setDescription] = useState(book.description ?? '')
  const [cover, setCover] = useState(null)
  const [status, setStatus] = useState(null) // null | 'saving' | 'uploading'
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      let coverUrl = book.cover_url
      if (cover) {
        setStatus('uploading')
        coverUrl = await uploadBookCover({ bookId: book.id, file: cover })
      }
      setStatus('saving')
      await updateBook(book.id, { title, author, description, cover_url: coverUrl })
      setCover(null)
      setSaved(true)
      onSaved()
      setTimeout(() => setSaved(false), 2000)
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
      className="mt-4 flex flex-col gap-3 rounded-lg border border-line bg-white p-4"
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
        placeholder="Auteur"
        className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        rows={3}
        className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <div className="flex items-center gap-3">
        {book.cover_url && (
          <img
            src={book.cover_url}
            alt=""
            className="h-20 w-14 shrink-0 rounded object-cover"
          />
        )}
        <label className="flex-1 text-sm text-ink-soft">
          {book.cover_url ? 'Remplacer l’illustration' : 'Illustration de couverture'}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCover(e.target.files?.[0] ?? null)}
            className="mt-1 block text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-paper-dim file:px-3 file:py-2 file:text-sm file:text-ink hover:file:bg-line"
          />
        </label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isBusy}
          className="self-start rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-50"
        >
          {status === 'uploading' && "Envoi de l'illustration…"}
          {status === 'saving' && 'Enregistrement…'}
          {!status && 'Enregistrer'}
        </button>
        {saved && <span className="text-sm text-ink-soft">Enregistré ✓</span>}
      </div>
    </form>
  )
}

function NewChapterForm({ bookId, nextChapterNumber, onCreated }) {
  const [chapterNumber, setChapterNumber] = useState(nextChapterNumber)
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState(null) // null | 'uploading' | 'saving'
  const [error, setError] = useState(null)

  useEffect(() => setChapterNumber(nextChapterNumber), [nextChapterNumber])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) return
    setError(null)
    try {
      setStatus('uploading')
      const audioPath = await uploadChapterAudio({ bookId, file })
      const duration = await readAudioDuration(file)
      setStatus('saving')
      await createChapter({
        bookId,
        chapterNumber: Number(chapterNumber),
        title,
        audioPath,
        durationSeconds: duration,
      })
      setTitle('')
      setFile(null)
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
      className="flex flex-col gap-3 rounded-lg border border-line bg-white p-4"
    >
      <h4 className="text-sm font-semibold text-ink">Ajouter un chapitre</h4>
      <div className="flex gap-3">
        <input
          type="number"
          min={1}
          value={chapterNumber}
          onChange={(e) => setChapterNumber(e.target.value)}
          className="w-20 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre du chapitre"
          required
          className="flex-1 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>
      <input
        type="file"
        accept="audio/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        required
        className="text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-paper-dim file:px-3 file:py-2 file:text-sm file:text-ink hover:file:bg-line"
      />
      <p className="text-xs text-ink-soft">
        Taille max : {Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024))} Mo par
        fichier (limite du plan gratuit Supabase). Pour de la voix seule, un
        export MP3 mono 64–96 kbps tient largement dans cette limite pour un
        chapitre classique.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={isBusy || !file || !title}
        className="self-start rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-50"
      >
        {status === 'uploading' && 'Envoi du fichier audio…'}
        {status === 'saving' && 'Enregistrement…'}
        {!status && 'Ajouter le chapitre'}
      </button>
    </form>
  )
}

function DangerZone({ book }) {
  const [error, setError] = useState(null)
  return (
    <div className="mt-8 border-t border-line pt-4">
      {error && <ErrorMessage message={error} />}
      <button
        type="button"
        onClick={async () => {
          if (
            !confirm(
              `Supprimer définitivement "${book.title}" et tous ses chapitres ?`
            )
          )
            return
          try {
            await deleteBook(book.id)
            window.location.href = '/admin'
          } catch (err) {
            setError(err.message)
          }
        }}
        className="text-xs text-red-600 hover:text-red-800"
      >
        Supprimer ce livre
      </button>
    </div>
  )
}
