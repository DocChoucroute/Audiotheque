import { useCallback, useEffect, useState } from 'react'
import { ADMIN_EMAIL, supabase } from '../lib/supabase'

// Authentification admin : un unique compte Supabase Auth (email fixe,
// jamais montré à l'écran) sert de porte d'accès. Côté interface, l'admin
// ne voit qu'un champ mot de passe — le principe demandé — mais on garde
// la sécurité et les policies RLS d'un vrai compte Supabase Auth plutôt
// qu'un mot de passe vérifié côté client (facilement contournable).
export function useAdminAuth() {
  const [session, setSession] = useState(undefined) // undefined = chargement

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const login = useCallback(async (password) => {
    if (!ADMIN_EMAIL) {
      throw new Error(
        "VITE_ADMIN_EMAIL n'est pas défini. Vérifie ton fichier .env (voir README)."
      )
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password,
    })
    if (error) throw new Error('Mot de passe incorrect.')
  }, [])

  const logout = useCallback(() => supabase.auth.signOut(), [])

  return {
    isLoading: session === undefined,
    isAuthenticated: Boolean(session),
    login,
    logout,
  }
}
