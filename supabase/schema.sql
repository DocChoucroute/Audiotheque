-- =========================================================================
-- Audiothèque — schéma Supabase
-- À exécuter une fois dans : Supabase Dashboard > SQL Editor > New query
-- =========================================================================

-- Extension nécessaire pour générer des UUID
create extension if not exists "pgcrypto";

-- -------------------------------------------------------------------------
-- Table des livres
-- -------------------------------------------------------------------------
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  description text,
  cover_url text,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------------------
-- Table des chapitres
-- Les colonnes transcript / transcript_segments ne sont pas utilisées
-- pour l'instant : elles sont prévues pour la future fonctionnalité de
-- suivi du texte en direct (prompteur), pour éviter une migration plus tard.
--   - transcript          : texte intégral du chapitre
--   - transcript_segments : tableau JSON [{ "start": 12.4, "end": 15.1, "text": "..." }, ...]
-- -------------------------------------------------------------------------
create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  chapter_number integer not null,
  title text not null,
  audio_path text not null,        -- chemin dans le bucket "audio-chapters"
  duration_seconds numeric,
  transcript text,
  transcript_segments jsonb,
  created_at timestamptz not null default now(),
  unique (book_id, chapter_number)
);

create index if not exists chapters_book_id_idx on public.chapters(book_id);

-- -------------------------------------------------------------------------
-- Row Level Security : lecture publique, écriture réservée à l'admin connecté
-- -------------------------------------------------------------------------
alter table public.books enable row level security;
alter table public.chapters enable row level security;

drop policy if exists "books_public_read" on public.books;
create policy "books_public_read"
  on public.books for select
  to anon, authenticated
  using (true);

drop policy if exists "books_admin_write" on public.books;
create policy "books_admin_write"
  on public.books for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "chapters_public_read" on public.chapters;
create policy "chapters_public_read"
  on public.chapters for select
  to anon, authenticated
  using (true);

drop policy if exists "chapters_admin_write" on public.chapters;
create policy "chapters_admin_write"
  on public.chapters for all
  to authenticated
  using (true)
  with check (true);

-- -------------------------------------------------------------------------
-- Storage : bucket pour les fichiers audio des chapitres
-- -------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('audio-chapters', 'audio-chapters', true)
on conflict (id) do nothing;

drop policy if exists "audio_public_read" on storage.objects;
create policy "audio_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'audio-chapters');

drop policy if exists "audio_admin_write" on storage.objects;
create policy "audio_admin_write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'audio-chapters');

drop policy if exists "audio_admin_update" on storage.objects;
create policy "audio_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'audio-chapters');

drop policy if exists "audio_admin_delete" on storage.objects;
create policy "audio_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'audio-chapters');

-- -------------------------------------------------------------------------
-- Livre de départ : Le Hobbit (les chapitres seront ajoutés depuis l'admin
-- au fur et à mesure des enregistrements)
-- -------------------------------------------------------------------------
insert into public.books (title, author, description)
values (
  'Le Hobbit',
  'J.R.R. Tolkien',
  'Bilbon Sacquet, hobbit casanier, est entraîné malgré lui dans une expédition à travers la Terre du Milieu pour aider un groupe de nains à reconquérir leur royaume perdu, gardé par le dragon Smaug.'
)
on conflict do nothing;
