-- Clinical and CMS table synchronization
-- This migration ensures all required tables exist and have correct RLS policies

-- 1. CMS Content
CREATE TABLE IF NOT EXISTS public.cms_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_key TEXT UNIQUE NOT NULL,
    content_json JSONB NOT NULL,
    updated_by UUID REFERENCES public.profiles(id),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.cms_content ADD COLUMN IF NOT EXISTS section_key TEXT;
ALTER TABLE public.cms_content ADD COLUMN IF NOT EXISTS content_json JSONB;

-- 2. Eye Screenings
CREATE TABLE IF NOT EXISTS public.eye_screenings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    screened_by UUID REFERENCES public.profiles(id),
    screening_date DATE DEFAULT CURRENT_DATE,
    va_right_eye TEXT,
    va_left_eye TEXT,
    iop_right DECIMAL,
    iop_left DECIMAL,
    colour_vision_result TEXT,
    contrast_sensitivity TEXT,
    external_exam_notes TEXT,
    diagnosis TEXT,
    recommended_followup TEXT,
    is_visible_to_patient BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.eye_screenings ADD COLUMN IF NOT EXISTS patient_id UUID;
ALTER TABLE public.eye_screenings ADD COLUMN IF NOT EXISTS diagnosis TEXT;
ALTER TABLE public.eye_screenings ADD COLUMN IF NOT EXISTS is_visible_to_patient BOOLEAN DEFAULT TRUE;

-- 3. Patient Medical History
CREATE TABLE IF NOT EXISTS public.patient_medical_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    ocular_history TEXT,
    systemic_conditions TEXT,
    current_medications TEXT,
    family_eye_history TEXT,
    allergies TEXT,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(patient_id)
);
ALTER TABLE public.patient_medical_history ADD COLUMN IF NOT EXISTS patient_id UUID;

-- 4. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type TEXT DEFAULT 'individual',
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS patient_id UUID;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'individual';

-- Enable RLS
ALTER TABLE public.cms_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eye_screenings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
    CREATE POLICY "Anyone can view CMS content" ON public.cms_content FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins manage CMS" ON public.cms_content FOR ALL USING (
        public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Users view own screenings" ON public.eye_screenings FOR SELECT USING (auth.uid() = patient_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Users view own history" ON public.patient_medical_history FOR SELECT USING (auth.uid() = patient_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = patient_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;
