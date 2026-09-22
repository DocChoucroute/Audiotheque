import { supabase } from './supabase'

const BUCKET = 'audio-chapters'
const COVER_BUCKET = 'book-covers'

// ---------------------------------------------------------------------
// Livres
// ---------------------------------------------------------------------

export async function fetchBooks() {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function fetchBook(bookId) {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId)
    .single()
  if (error) throw error
  return data
}

export async function createBook({ title, author, description, cover_url }) {
  const { data, error } = await supabase
    .from('books')
    .insert({ title, author, description, cover_url })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateBook(bookId, patch) {
  const { data, error } = await supabase
    .from('books')
    .update(patch)
    .eq('id', bookId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteBook(bookId) {
  const { error } = await supabase.from('books').delete().eq('id', bookId)
  if (error) throw error
}

// Taille max pour une image de couverture. Bien plus permissif que pour
// l'audio (les images restent petites), surtout là pour éviter d'envoyer
// une photo en pleine résolution par erreur.
export const MAX_COVER_BYTES = 8 * 1024 * 1024

export async function uploadBookCover({ bookId, file }) {
  if (file.size > MAX_COVER_BYTES) {
    throw new Error(
      `Cette image fait ${(file.size / (1024 * 1024)).toFixed(1)} Mo, ` +
        `au-delà de la limite de 8 Mo. Réduis sa taille (par exemple en ` +
        `l'exportant en JPEG) avant de réessayer.`
    )
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${bookId}/${Date.now()}-${safeName}`

  const { error } = await supabase.storage
    .from(COVER_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw error

  const { data } = supabase.storage.from(COVER_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

// ---------------------------------------------------------------------
// Chapitres
// ---------------------------------------------------------------------

export async function fetchChapters(bookId) {
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('book_id', bookId)
    .order('chapter_number', { ascending: true })
  if (error) throw error
  return data
}

export async function fetchChapter(chapterId) {
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('id', chapterId)
    .single()
  if (error) throw error
  return data
}

// Taille max acceptée par le plan gratuit Supabase (par fichier). Vérifiée
// côté client pour donner un message clair avant l'upload plutôt qu'une
// erreur réseau obscure. À ajuster dans le README si le plan change.
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024

export async function uploadChapterAudio({ bookId, file, onProgress }) {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `Ce fichier fait ${(file.size / (1024 * 1024)).toFixed(1)} Mo, ` +
        `au-delà de la limite de 50 Mo par fichier du plan gratuit Supabase. ` +
        `Coupe le chapitre en deux parties ou réexporte-le dans un débit ` +
        `plus faible (ex : MP3 mono 64 kbps, largement suffisant pour de la voix).`
    )
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${bookId}/${Date.now()}-${safeName}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error

  // supabase-js v2 ne fournit pas nativement de progression d'upload pour
  // storage.upload ; onProgress est appelé une seule fois à la fin pour
  // garder l'appelant simple si on branche un jour un vrai suivi.
  onProgress?.(100)

  return path
}

export function getAudioUrl(path) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function createChapter({
  bookId,
  chapterNumber,
  title,
  audioPath,
  durationSeconds,
}) {
  const { data, error } = await supabase
    .from('chapters')
    .insert({
      book_id: bookId,
      chapter_number: chapterNumber,
      title,
      audio_path: audioPath,
      duration_seconds: durationSeconds ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateChapter(chapterId, patch) {
  const { data, error } = await supabase
    .from('chapters')
    .update(patch)
    .eq('id', chapterId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteChapter(chapterId) {
  const { data: chapter, error: fetchError } = await supabase
    .from('chapters')
    .select('audio_path')
    .eq('id', chapterId)
    .single()
  if (fetchError) throw fetchError

  const { error: deleteRowError } = await supabase
    .from('chapters')
    .delete()
    .eq('id', chapterId)
  if (deleteRowError) throw deleteRowError

  // On supprime aussi le fichier audio du storage pour ne pas laisser de
  // fichiers orphelins grignoter le quota gratuit. Une erreur ici n'est
  // pas bloquante : la ligne en base est déjà supprimée.
  if (chapter?.audio_path) {
    await supabase.storage.from(BUCKET).remove([chapter.audio_path])
  }
}

// Lit la durée d'un fichier audio côté navigateur avant l'upload, pour
// pouvoir l'afficher dans l'appli sans dépendre d'un traitement serveur.
export function readAudioDuration(file) {
  return new Promise((resolve) => {
    const audio = document.createElement('audio')
    audio.preload = 'metadata'
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(audio.src)
      resolve(Number.isFinite(audio.duration) ? audio.duration : null)
    }
    audio.onerror = () => resolve(null)
    audio.src = URL.createObjectURL(file)
  })
}