import { useEffect, useRef, useState } from 'react'

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function AudioPlayer({
  src,
  title,
  startAt,
  onEnded,
  onProgress,
  onPause,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
}) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Recharge et relance la lecture à chaque changement de chapitre
  useEffect(() => {
    setCurrentTime(0)
    setIsPlaying(false)
  }, [src])

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      audio.play()
      setIsPlaying(true)
    } else {
      audio.pause()
      setIsPlaying(false)
    }
  }

  function handleSeek(e) {
    const audio = audioRef.current
    if (!audio) return
    const value = Number(e.target.value)
    audio.currentTime = value
    setCurrentTime(value)
  }

  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime
          setCurrentTime(t)
          onProgress?.(t)
        }}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration)
          // Reprend la lecture là où elle s'était arrêtée, si on a un point
          // de reprise enregistré pour ce chapitre.
          if (startAt && startAt > 0) {
            e.currentTarget.currentTime = startAt
            setCurrentTime(startAt)
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={(e) => {
          setIsPlaying(false)
          onPause?.(e.currentTarget.currentTime)
        }}
        onEnded={() => {
          setIsPlaying(false)
          onEnded?.()
        }}
        className="hidden"
      />

      {title && (
        <p className="mb-3 truncate text-sm font-medium text-ink-soft">
          {title}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!hasPrevious}
          aria-label="Chapitre précédent"
          className="rounded-full p-2 text-ink-soft transition-colors hover:text-accent disabled:opacity-30 disabled:hover:text-ink-soft"
        >
          ⏮
        </button>

        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause' : 'Lecture'}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-lg text-white transition-colors hover:bg-accent-dark"
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          aria-label="Chapitre suivant"
          className="rounded-full p-2 text-ink-soft transition-colors hover:text-accent disabled:opacity-30 disabled:hover:text-ink-soft"
        >
          ⏭
        </button>

        <span className="w-10 shrink-0 text-right text-xs tabular-nums text-ink-soft">
          {formatTime(currentTime)}
        </span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="h-1 flex-1 cursor-pointer accent-accent"
        />
        <span className="w-10 shrink-0 text-xs tabular-nums text-ink-soft">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  )
}
