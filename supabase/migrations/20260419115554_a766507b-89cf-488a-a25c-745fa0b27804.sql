-- Enum catégorie annonces
CREATE TYPE public.annonce_categorie AS ENUM ('generale', 'pedagogique', 'administrative', 'evenement', 'urgence');

-- Table annonces
CREATE TABLE public.annonces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titre TEXT NOT NULL,
  contenu TEXT NOT NULL,
  categorie public.annonce_categorie NOT NULL DEFAULT 'generale',
  image_url TEXT,
  epingle BOOLEAN NOT NULL DEFAULT false,
  publie BOOLEAN NOT NULL DEFAULT true,
  auteur_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.annonces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read published annonces"
ON public.annonces FOR SELECT TO authenticated
USING (publie = true OR public.is_admin(auth.uid()));

CREATE POLICY "Admins manage annonces"
ON public.annonces FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_annonces_updated_at
BEFORE UPDATE ON public.annonces
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_annonces_publie_created ON public.annonces(publie, created_at DESC);
CREATE INDEX idx_annonces_epingle ON public.annonces(epingle) WHERE epingle = true;

-- Table albums
CREATE TABLE public.albums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titre TEXT NOT NULL,
  description TEXT,
  date_evenement DATE,
  couverture_url TEXT,
  publie BOOLEAN NOT NULL DEFAULT true,
  auteur_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read published albums"
ON public.albums FOR SELECT TO authenticated
USING (publie = true OR public.is_admin(auth.uid()));

CREATE POLICY "Admins manage albums"
ON public.albums FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_albums_updated_at
BEFORE UPDATE ON public.albums
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_albums_publie_created ON public.albums(publie, created_at DESC);

-- Table photos
CREATE TABLE public.photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  legende TEXT,
  ordre INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read photos of published albums"
ON public.photos FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.albums a
    WHERE a.id = photos.album_id AND (a.publie = true OR public.is_admin(auth.uid()))
  )
);

CREATE POLICY "Admins manage photos"
ON public.photos FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX idx_photos_album_ordre ON public.photos(album_id, ordre);

-- Bucket public media-school
INSERT INTO storage.buckets (id, name, public)
VALUES ('media-school', 'media-school', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read media-school"
ON storage.objects FOR SELECT
USING (bucket_id = 'media-school');

CREATE POLICY "Admins upload media-school"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'media-school' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins update media-school"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'media-school' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins delete media-school"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'media-school' AND public.is_admin(auth.uid()));