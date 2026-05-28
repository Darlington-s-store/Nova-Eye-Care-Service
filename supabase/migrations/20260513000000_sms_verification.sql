-- Table for storing SMS verification codes
CREATE TABLE IF NOT EXISTS public.verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code text NOT NULL,
  type text NOT NULL, -- 'signup', 'reset'
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Only service role can manage these codes directly (Edge Functions)
CREATE POLICY "Service role manages verification codes" ON public.verification_codes
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Create a profiles trigger to send welcome SMS if needed
-- (Actually we will do this in the edge function for better control)
