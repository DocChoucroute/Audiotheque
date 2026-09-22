import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Erreur volontairement explicite : évite de chercher pendant 20 minutes
  // pourquoi rien ne se charge alors qu'il manque juste le fichier .env
  console.error(
    "Configuration Supabase manquante. Vérifie que VITE_SUPABASE_URL et " +
      "VITE_SUPABASE_ANON_KEY sont bien définis dans ton fichier .env " +
      '(voir .env.example).'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Email technique associé au compte admin unique (voir README).
// L'utilisateur ne voit jamais cet email : l'écran de connexion admin ne
// demande qu'un mot de passe.
export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL
