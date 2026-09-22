import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'audiotheque:listened-chapters'

function readStoredIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    // localStorage indisponible ou contenu corrompu : on repart de zéro
    // plutôt que de casser l'affichage.
    return new Set()
  }
}

function writeStoredIds(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
  } catch {
    // Stockage plein ou indisponible (navigation privée, etc.) : on
    // n'interrompt pas l'appli pour autant, le marquage ne sera juste
    // pas conservé.
  }
}

// Suivi des chapitres déjà écoutés, gardé uniquement dans ce navigateur
// (pas de synchronisation entre appareils).
export function useListenedChapters() {
  const [listenedIds, setListenedIds] = useState(() => readStoredIds())

  useEffect(() => {
    writeStoredIds(listenedIds)
  }, [listenedIds])

  const isListened = useCallback(
    (chapterId) => listenedIds.has(chapterId),
    [listenedIds]
  )

  const setListened = useCallback((chapterId, value) => {
    setListenedIds((prev) => {
      const next = new Set(prev)
      if (value) {
        next.add(chapterId)
      } else {
        next.delete(chapterId)
      }
      return next
    })
  }, [])

  const toggleListened = useCallback((chapterId) => {
    setListenedIds((prev) => {
      const next = new Set(prev)
      if (next.has(chapterId)) {
        next.delete(chapterId)
      } else {
        next.add(chapterId)
      }
      return next
    })
  }, [])

  return { isListened, setListened, toggleListened }
}