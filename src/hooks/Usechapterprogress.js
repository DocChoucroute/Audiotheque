import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'audiotheque:chapter-progress'

// Seuil en dessous duquel on ne considère pas qu'un chapitre est "en
// cours" : évite de créer un marqueur si on ne fait qu'y jeter un œil.
const MIN_PROGRESS_SECONDS = 5

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // Stockage indisponible : le point de reprise ne sera pas conservé,
    // mais l'appli continue de fonctionner normalement.
  }
}

// Un seul chapitre "en cours" par livre, avec sa position en secondes,
// pour proposer une reprise de lecture. Gardé uniquement dans ce
// navigateur, comme le suivi des chapitres écoutés.
export function useChapterProgress(bookId) {
  const [store, setStore] = useState(() => readStore())

  useEffect(() => {
    writeStore(store)
  }, [store])

  const progress = bookId ? (store[bookId] ?? null) : null

  const saveProgress = useCallback(
    (chapterId, positionSeconds) => {
      if (!bookId || !chapterId) return
      if (!Number.isFinite(positionSeconds) || positionSeconds < MIN_PROGRESS_SECONDS) {
        return
      }
      setStore((prev) => {
        const existing = prev[bookId]
        if (
          existing &&
          existing.chapterId === chapterId &&
          Math.abs(existing.position - positionSeconds) < 1
        ) {
          return prev
        }
        return {
          ...prev,
          [bookId]: { chapterId, position: positionSeconds },
        }
      })
    },
    [bookId]
  )

  const clearProgress = useCallback(
    (chapterId) => {
      if (!bookId) return
      setStore((prev) => {
        const existing = prev[bookId]
        if (!existing) return prev
        // Si on précise un chapterId, on ne nettoie que si c'est bien lui
        // le chapitre marqué "en cours" (évite d'effacer par erreur le
        // marqueur d'un autre chapitre du même livre).
        if (chapterId && existing.chapterId !== chapterId) return prev
        const next = { ...prev }
        delete next[bookId]
        return next
      })
    },
    [bookId]
  )

  return { progress, saveProgress, clearProgress }
}