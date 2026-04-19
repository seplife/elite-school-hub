-- 1) Ajout du rôle educateur à l'enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'educateur';

-- 2) Contrainte de validation sur statut élèves
ALTER TABLE public.eleves DROP CONSTRAINT IF EXISTS eleves_statut_check;
ALTER TABLE public.eleves ADD CONSTRAINT eleves_statut_check
  CHECK (statut IN ('en_attente','actif','rejete','diplome','transfere'));

-- 3) Politique DELETE pour admins sur élèves
DROP POLICY IF EXISTS "Admins delete eleves" ON public.eleves;
CREATE POLICY "Admins delete eleves" ON public.eleves
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- 4) Seed des 35 classes pour l'année 2025-2026
-- 6e à 3e : 5 classes/niveau, série Aucune
-- 2nde : 5 classes, série Aucune
-- 1ere et Tle : 5 classes (A, C, D, D, D pour varier — on met A, C, D et 2 répliques D)
DO $$
DECLARE
  v_annee text := '2025-2026';
BEGIN
  -- Niveaux collège & 2nde (séries Aucune)
  INSERT INTO public.classes (nom, niveau, serie, annee_scolaire, capacite)
  SELECT n.niveau || sub.suffix, n.niveau::niveau_scolaire, 'Aucune'::serie_scolaire, v_annee, 40
  FROM (VALUES ('6e'), ('5e'), ('4e'), ('3e'), ('2nde')) AS n(niveau)
  CROSS JOIN (VALUES (' A'), (' B'), (' C'), (' D'), (' E')) AS sub(suffix)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.nom = n.niveau || sub.suffix AND c.annee_scolaire = v_annee
  );

  -- 1ere : 5 classes réparties en séries A, C, D
  INSERT INTO public.classes (nom, niveau, serie, annee_scolaire, capacite)
  SELECT '1ere ' || s.serie || s.idx, '1ere'::niveau_scolaire, s.serie::serie_scolaire, v_annee, 40
  FROM (VALUES ('A','1'), ('A','2'), ('C','1'), ('D','1'), ('D','2')) AS s(serie, idx)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.nom = '1ere ' || s.serie || s.idx AND c.annee_scolaire = v_annee
  );

  -- Tle : 5 classes réparties en séries A, C, D
  INSERT INTO public.classes (nom, niveau, serie, annee_scolaire, capacite)
  SELECT 'Tle ' || s.serie || s.idx, 'Tle'::niveau_scolaire, s.serie::serie_scolaire, v_annee, 40
  FROM (VALUES ('A','1'), ('A','2'), ('C','1'), ('D','1'), ('D','2')) AS s(serie, idx)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.nom = 'Tle ' || s.serie || s.idx AND c.annee_scolaire = v_annee
  );
END $$;