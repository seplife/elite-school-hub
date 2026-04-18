CREATE OR REPLACE FUNCTION public.generate_matricule()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.matricule IS NULL OR NEW.matricule = '' THEN
    NEW.matricule := 'ED-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.matricule_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;