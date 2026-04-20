-- 1) Type d'examen
DO $$ BEGIN
  CREATE TYPE public.examen_type AS ENUM ('composition','devoir_surveille','examen_blanc','bac_blanc');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2) Fonction : l'utilisateur peut-il enseigner cette matière dans cette classe ?
CREATE OR REPLACE FUNCTION public.peut_enseigner(_classe_id uuid, _matiere_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.enseignements
    WHERE classe_id = _classe_id
      AND matiere_id = _matiere_id
      AND enseignant_id = auth.uid()
  )
$$;

-- 3) Politiques évaluations : enseignants assignés
CREATE POLICY "Teachers manage their evaluations"
ON public.evaluations
FOR ALL
TO authenticated
USING (public.peut_enseigner(classe_id, matiere_id))
WITH CHECK (public.peut_enseigner(classe_id, matiere_id));

-- 4) Politiques notes : enseignants assignés (via l'évaluation)
CREATE POLICY "Teachers manage notes of their evaluations"
ON public.notes
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.evaluations ev
  WHERE ev.id = notes.evaluation_id
    AND public.peut_enseigner(ev.classe_id, ev.matiere_id)
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.evaluations ev
  WHERE ev.id = notes.evaluation_id
    AND public.peut_enseigner(ev.classe_id, ev.matiere_id)
));

-- 5) Table EXAMENS
CREATE TABLE IF NOT EXISTS public.examens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  type public.examen_type NOT NULL DEFAULT 'composition',
  classe_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  matiere_id uuid NOT NULL REFERENCES public.matieres(id) ON DELETE CASCADE,
  evaluation_id uuid REFERENCES public.evaluations(id) ON DELETE SET NULL,
  date_debut timestamptz NOT NULL,
  duree_minutes integer NOT NULL DEFAULT 120,
  salle text,
  surveillant_id uuid,
  surveillant_nom text,
  instructions text,
  trimestre public.trimestre,
  annee_scolaire text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.examens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage examens" ON public.examens
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Teachers manage their examens" ON public.examens
  FOR ALL TO authenticated
  USING (public.peut_enseigner(classe_id, matiere_id))
  WITH CHECK (public.peut_enseigner(classe_id, matiere_id));

CREATE POLICY "Staff read examens" ON public.examens
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.has_role(auth.uid(),'enseignant')
    OR public.has_role(auth.uid(),'educateur')
    OR public.has_role(auth.uid(),'comptable')
  );

CREATE POLICY "Parents read examens of their children classes" ON public.examens
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.eleves e
    WHERE e.classe_id = examens.classe_id
      AND e.parent_id = auth.uid()
  ));

CREATE TRIGGER trg_examens_updated
BEFORE UPDATE ON public.examens
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_examens_date ON public.examens(date_debut);
CREATE INDEX IF NOT EXISTS idx_examens_classe ON public.examens(classe_id);