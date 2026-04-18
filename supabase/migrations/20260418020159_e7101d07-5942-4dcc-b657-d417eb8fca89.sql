-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'enseignant', 'comptable', 'parent', 'eleve');
CREATE TYPE public.niveau_scolaire AS ENUM ('6e','5e','4e','3e','2nde','1ere','Tle');
CREATE TYPE public.serie_scolaire AS ENUM ('Aucune','A','C','D','G');
CREATE TYPE public.sexe_eleve AS ENUM ('M','F');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper: is staff (admin/super_admin)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','super_admin')
  )
$$;

-- ============ CLASSES ============
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  niveau niveau_scolaire NOT NULL,
  serie serie_scolaire NOT NULL DEFAULT 'Aucune',
  salle TEXT,
  capacite INT NOT NULL DEFAULT 40,
  annee_scolaire TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(nom, annee_scolaire)
);
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- ============ ELEVES ============
CREATE TABLE public.eleves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  matricule TEXT NOT NULL UNIQUE,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  date_naissance DATE NOT NULL,
  lieu_naissance TEXT,
  sexe sexe_eleve NOT NULL,
  photo_url TEXT,
  parent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  classe_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  statut TEXT NOT NULL DEFAULT 'en_attente', -- en_attente | actif | sortant
  adresse TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.eleves ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_eleves_parent ON public.eleves(parent_id);
CREATE INDEX idx_eleves_classe ON public.eleves(classe_id);

-- Matricule auto: ED-YYYY-XXXX
CREATE SEQUENCE IF NOT EXISTS public.matricule_seq START 1;
CREATE OR REPLACE FUNCTION public.generate_matricule()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.matricule IS NULL OR NEW.matricule = '' THEN
    NEW.matricule := 'ED-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.matricule_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_eleves_matricule
BEFORE INSERT ON public.eleves
FOR EACH ROW EXECUTE FUNCTION public.generate_matricule();

-- ============ TIMESTAMPS TRIGGER ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_classes_updated BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_eleves_updated BEFORE UPDATE ON public.eleves FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ NEW USER TRIGGER (auto profile + parent role) ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'phone'
  );
  -- Default role: parent (admins are promoted manually)
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'parent');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ RLS POLICIES ============

-- profiles
CREATE POLICY "Users view own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins update any profile"
ON public.profiles FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Profile insert by trigger"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- user_roles
CREATE POLICY "Users view own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins manage roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- classes
CREATE POLICY "Authenticated read classes"
ON public.classes FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins manage classes"
ON public.classes FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- eleves
CREATE POLICY "Admins/staff view all eleves"
ON public.eleves FOR SELECT TO authenticated
USING (
  public.is_admin(auth.uid())
  OR public.has_role(auth.uid(), 'enseignant')
  OR public.has_role(auth.uid(), 'comptable')
);

CREATE POLICY "Parents view own children"
ON public.eleves FOR SELECT TO authenticated
USING (parent_id = auth.uid());

CREATE POLICY "Parents insert own children"
ON public.eleves FOR INSERT TO authenticated
WITH CHECK (parent_id = auth.uid() AND public.has_role(auth.uid(), 'parent'));

CREATE POLICY "Parents update own children (limited)"
ON public.eleves FOR UPDATE TO authenticated
USING (parent_id = auth.uid());

CREATE POLICY "Admins manage all eleves"
ON public.eleves FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));