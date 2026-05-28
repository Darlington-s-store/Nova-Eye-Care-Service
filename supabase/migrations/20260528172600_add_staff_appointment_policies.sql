-- Ensure auth schema and auth.uid() function exist (compat layer for standard Postgres environments like Neon)
CREATE SCHEMA IF NOT EXISTS auth;
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid LANGUAGE sql STABLE
AS $$
  SELECT null::uuid;
$$;

-- Create helper function to check if a user is staff (admin, super_admin, optometrist, receptionist)
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF _user_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = _user_id 
    AND role IN ('super_admin', 'optometrist', 'receptionist')
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id 
    AND role = 'admin'
  );
END;
$$;

-- Drop old appointment policies (both user own and admin ones)
DROP POLICY IF EXISTS "Admins view all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins update all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins delete all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Guests or owner can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Anyone can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users delete own appointments" ON public.appointments;

-- Create new unified, staff-inclusive policies for appointments
CREATE POLICY "Staff or owner view appointments" 
ON public.appointments FOR SELECT 
USING (public.is_staff(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Staff or owner update appointments" 
ON public.appointments FOR UPDATE 
USING (public.is_staff(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Staff or owner delete appointments" 
ON public.appointments FOR DELETE 
USING (public.is_staff(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Guests, owners or staff can create appointments" 
ON public.appointments FOR INSERT 
WITH CHECK (user_id IS NULL OR auth.uid() = user_id OR public.is_staff(auth.uid()));
