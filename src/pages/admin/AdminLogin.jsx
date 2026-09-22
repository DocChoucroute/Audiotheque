import { useState } from 'react'
import { useAdminAuth } from '../../hooks/useAdminAuth'

export default function AdminLogin() {
  const { login } = useAdminAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await login(password)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-8">
      <h1 className="mb-6 text-center text-xl font-semibold text-ink">
        Espace admin
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-accent"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting || !password}
          className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark disabled:opacity-50"
        >
          {isSubmitting ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}
