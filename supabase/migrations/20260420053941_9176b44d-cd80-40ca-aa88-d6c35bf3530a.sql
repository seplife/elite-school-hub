-- Trimestre type
DO $$ BEGIN
  CREATE TYPE public.trimestre AS ENUM ('1','2','3');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.evaluation_type AS ENUM ('devoir','composition');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- MATIERES
CREATE TABLE IF NOT EXISTS public.matieres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL UNIQUE,
  code text,
  ordre integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.matieres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage matieres" ON public.matieres
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated read matieres" ON public.matieres
  FOR SELECT TO authenticated USING (true);

CREATE TRIGGER trg_matieres_updated
BEFORE UPDATE ON public.matieres
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ENSEIGNEMENTS (classe x matiere, avec coefficient et enseignant optionnel)
CREATE TABLE IF NOT EXISTS public.enseignements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classe_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  matiere_id uuid NOT NULL REFERENCES public.matieres(id) ON DELETE CASCADE,
  enseignant_id uuid,
  coefficient numeric(4,2) NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (classe_id, matiere_id)
);
ALTER TABLE public.enseignements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage enseignements" ON public.enseignements
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Staff read enseignements" ON public.enseignements
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.has_role(auth.uid(),'enseignant')
    OR public.has_role(auth.uid(),'educateur')
    OR public.has_role(auth.uid(),'comptable')
  );

CREATE TRIGGER trg_enseignements_updated
BEFORE UPDATE ON public.enseignements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- EVALUATIONS
CREATE TABLE IF NOT EXISTS public.evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classe_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  matiere_id uuid NOT NULL REFERENCES public.matieres(id) ON DELETE CASCADE,
  type public.evaluation_type NOT NULL DEFAULT 'devoir',
  titre text NOT NULL,
  trimestre public.trimestre NOT NULL,
  date_evaluation date,
  bareme numeric(5,2) NOT NULL DEFAULT 20,
  annee_scolaire text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage evaluations" ON public.evaluations
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Staff read evaluations" ON public.evaluations
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.has_role(auth.uid(),'enseignant')
    OR public.has_role(auth.uid(),'educateur')
  );

CREATE POLICY "Parents read evaluations of their children" ON public.evaluations
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.eleves e
    WHERE e.classe_id = evaluations.classe_id
      AND e.parent_id = auth.uid()
  ));

CREATE TRIGGER trg_evaluations_updated
BEFORE UPDATE ON public.evaluations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- NOTES
CREATE TABLE IF NOT EXISTS public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
  eleve_id uuid NOT NULL REFERENCES public.eleves(id) ON DELETE CASCADE,
  valeur numeric(5,2),
  appreciation text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (evaluation_id, eleve_id)
);
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage notes" ON public.notes
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Staff read notes" ON public.notes
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.has_role(auth.uid(),'enseignant')
    OR public.has_role(auth.uid(),'educateur')
  );

CREATE POLICY "Parents read notes of their children" ON public.notes
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.eleves e
    WHERE e.id = notes.eleve_id AND e.parent_id = auth.uid()
  ));

CREATE TRIGGER trg_notes_updated
BEFORE UPDATE ON public.notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PARAMETRES NOTATION (singleton)
CREATE TABLE IF NOT EXISTS public.parametres_notation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bareme numeric(5,2) NOT NULL DEFAULT 20,
  poids_composition numeric(4,2) NOT NULL DEFAULT 2,
  poids_devoir numeric(4,2) NOT NULL DEFAULT 1,
  afficher_rang boolean NOT NULL DEFAULT true,
  afficher_mention boolean NOT NULL DEFAULT true,
  seuil_excellent numeric(5,2) NOT NULL DEFAULT 16,
  seuil_bien numeric(5,2) NOT NULL DEFAULT 14,
  seuil_assez_bien numeric(5,2) NOT NULL DEFAULT 12,
  seuil_passable numeric(5,2) NOT NULL DEFAULT 10,
  nom_etablissement text NOT NULL DEFAULT 'École',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.parametres_notation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage parametres" ON public.parametres_notation
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated read parametres" ON public.parametres_notation
  FOR SELECT TO authenticated USING (true);

CREATE TRIGGER trg_parametres_updated
BEFORE UPDATE ON public.parametres_notation
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed matieres
INSERT INTO public.matieres (nom, code, ordre) VALUES
  ('Français','FR',1),
  ('Mathématiques','MATH',2),
  ('Anglais','ANG',3),
  ('Espagnol','ESP',4),
  ('Histoire-Géographie','HG',5),
  ('Sciences de la Vie et de la Terre','SVT',6),
  ('Physique-Chimie','PC',7),
  ('Philosophie','PHILO',8),
  ('Éducation Physique et Sportive','EPS',9),
  ('Arts Plastiques','ART',10),
  ('Musique','MUS',11),
  ('Éducation Civique et Morale','ECM',12)
ON CONFLICT (nom) DO NOTHING;

-- Seed parametres (singleton)
INSERT INTO public.parametres_notation (nom_etablissement)
SELECT 'École'
WHERE NOT EXISTS (SELECT 1 FROM public.parametres_notation);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_evaluations_classe_trimestre ON public.evaluations(classe_id, trimestre);
CREATE INDEX IF NOT EXISTS idx_notes_eleve ON public.notes(eleve_id);
CREATE INDEX IF NOT EXISTS idx_notes_evaluation ON public.notes(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_enseignements_classe ON public.enseignements(classe_id);