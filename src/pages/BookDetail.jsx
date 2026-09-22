import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AudioPlayer from '../components/AudioPlayer'
import { EmptyState, ErrorMessage, Loading } from '../components/Feedback'
import { useChapterProgress } from '../hooks/useChapterProgress'
import { useListenedChapters } from '../hooks/useListenedChapters'
import { fetchBook, fetchChapters, getAudioUrl } from '../lib/api'

function formatDuration(seconds) {
  if (!seconds) return null
  const m = Math.round(seconds / 60)
  return `${m} min`
}

export default function BookDetail() {
  const { bookId } = useParams()
  const [book, setBook] = useState(null)
  const [chapters, setChapters] = useState(null)
  const [error, setError] = useState(null)
  const [activeIndex, setActiveIndex] = useState(null)
  const { isListened, setListened } = useListenedChapters()
  const { progress, saveProgress, clearProgress } = useChapterProgress(bookId)

  // Dernière position de lecture connue pour le chapitre actif, tenue à
  // jour en continu mais sans re-render (juste pour pouvoir l'enregistrer
  // au bon moment : pause, changement de chapitre, fermeture de la page).
  const lastPositionRef = useRef(0)

  useEffect(() => {
    setBook(null)
    setChapters(null)
    setActiveIndex(null)
    Promise.all([fetchBook(bookId), fetchChapters(bookId)])
      .then(([b, c]) => {
        setBook(b)
        setChapters(c)
      })
      .catch((e) => setError(e.message))
  }, [bookId])

  const activeChapter = useMemo(
    () => (activeIndex !== null ? chapters?.[activeIndex] : null),
    [activeIndex, chapters]
  )

  // Sauvegarde de sécurité quand on quitte complètement la page (retour à
  // l'accueil, fermeture d'onglet). Passe par une ref pour toujours lire
  // les toutes dernières valeurs au moment du démontage.
  const latestRef = useRef({})
  useEffect(() => {
    latestRef.current = { activeChapter, saveProgress }
  })
  useEffect(() => {
    return () => {
      const { activeChapter: chapter, saveProgress: save } = latestRef.current
      if (chapter) {
        save(chapter.id, lastPositionRef.current)
      }
    }
  }, [])

  function switchTo(index) {
    if (activeChapter) {
      saveProgress(activeChapter.id, lastPositionRef.current)
    }
    lastPositionRef.current = 0
    setActiveIndex(index)
  }

  function handleEnded() {
    if (activeChapter) {
      setListened(activeChapter.id, true)
      clearProgress(activeChapter.id)
    }
    lastPositionRef.current = 0
    if (activeIndex < chapters.length - 1) {
      setActiveIndex((i) => i + 1)
    }
  }

  function handleToggleListened(chapter) {
    const nextValue = !isListened(chapter.id)
    setListened(chapter.id, nextValue)
    if (nextValue) {
      clearProgress(chapter.id)
    }
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-8">
        <ErrorMessage message={error} />
      </div>
    )
  }

  if (!book || !chapters) {
    return <Loading label="Chargement du livre…" />
  }

  const startAt =
    activeChapter && progress?.chapterId === activeChapter.id
      ? progress.position
      : undefined

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 py-8 pb-32">
      <Link to="/" className="mb-4 text-sm text-ink-soft hover:text-accent">
        ← Tous les livres
      </Link>

      <div className="flex gap-5">
        <div className="flex h-32 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md bg-paper-dim">
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-3xl text-ink-soft/40" aria-hidden="true">
              📖
            </span>
          )}
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            {book.title}
          </h1>
          {book.author && (
            <p className="mt-1 text-sm text-ink-soft">{book.author}</p>
          )}
          {book.description && (
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              {book.description}
            </p>
          )}
        </div>
      </div>

      <h2 className="mb-2 mt-8 text-sm font-semibold uppercase tracking-wide text-ink-soft">
        Chapitres
      </h2>

      {chapters.length === 0 && (
        <EmptyState>Aucun chapitre disponible pour l'instant.</EmptyState>
      )}

      <ol className="flex flex-col divide-y divide-line rounded-lg border border-line bg-white">
        {chapters.map((chapter, index) => {
          const isActive = index === activeIndex
          const listened = isListened(chapter.id)
          const inProgress = !listened && progress?.chapterId === chapter.id
          const icon = inProgress ? '🚩' : listened ? '✓' : '○'
          const iconLabel = listened
            ? 'Marquer ce chapitre comme non écouté'
            : 'Marquer ce chapitre comme écouté'
          const iconTitle = inProgress
            ? 'En cours — cliquer pour marquer comme terminé'
            : listened
              ? 'Écouté'
              : 'Marquer comme écouté'

          return (
            <li
              key={chapter.id}
              className={`flex items-center ${isActive ? 'bg-accent/10' : ''}`}
            >
              <button
                type="button"
                onClick={() => handleToggleListened(chapter)}
                aria-pressed={listened}
                aria-label={iconLabel}
                title={iconTitle}
                className={`flex h-9 w-9 shrink-0 items-center justify-center pl-4 text-lg transition-colors ${
                  listened || inProgress
                    ? 'text-accent'
                    : 'text-ink-soft/40 hover:text-ink-soft'
                }`}
              >
                {icon}
              </button>
              <button
                type="button"
                onClick={() => switchTo(index)}
                className="flex flex-1 items-center gap-3 px-2 py-3 text-left transition-colors hover:bg-paper-dim"
              >
                <span
                  className={`w-6 shrink-0 text-sm tabular-nums ${
                    isActive ? 'text-accent' : 'text-ink-soft'
                  }`}
                >
                  {chapter.chapter_number}
                </span>
                <span
                  className={`flex-1 truncate text-sm ${
                    isActive
                      ? 'font-medium text-accent'
                      : inProgress
                        ? 'text-accent'
                        : listened
                          ? 'text-ink-soft'
                          : 'text-ink'
                  }`}
                >
                  {chapter.title}
                </span>
                {chapter.duration_seconds && (
                  <span className="shrink-0 pr-2 text-xs text-ink-soft">
                    {formatDuration(chapter.duration_seconds)}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ol>

      {activeChapter && (
        <div className="fixed inset-x-0 bottom-0 border-t border-line bg-paper px-5 py-3">
          <div className="mx-auto max-w-3xl">
            <AudioPlayer
              key={activeChapter.id}
              src={getAudioUrl(activeChapter.audio_path)}
              title={`${activeChapter.chapter_number}. ${activeChapter.title}`}
              startAt={startAt}
              hasPrevious={activeIndex > 0}
              hasNext={activeIndex < chapters.length - 1}
              onPrevious={() => switchTo(activeIndex - 1)}
              onNext={() => switchTo(activeIndex + 1)}
              onProgress={(t) => {
                lastPositionRef.current = t
              }}
              onPause={(t) => {
                lastPositionRef.current = t
                if (activeChapter) saveProgress(activeChapter.id, t)
              }}
              onEnded={handleEnded}
            />
          </div>
        </div>
      )}
    </div>
  )
}
