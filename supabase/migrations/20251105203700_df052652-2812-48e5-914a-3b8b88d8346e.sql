-- Create partner_shares table for managing partner access
CREATE TABLE public.partner_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_email TEXT NOT NULL,
  share_code TEXT NOT NULL UNIQUE,
  partner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
  permissions JSONB NOT NULL DEFAULT '{"view_cycles": true, "view_symptoms": true, "view_insights": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  UNIQUE(user_id, partner_email)
);

-- Enable RLS
ALTER TABLE public.partner_shares ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own shares and shares where they are the partner
CREATE POLICY "Users can view their own shares and incoming shares"
ON public.partner_shares
FOR SELECT
USING (
  auth.uid() = user_id 
  OR auth.uid() = partner_user_id
  OR (auth.email() = partner_email AND status = 'pending')
);

-- Policy: Users can create shares for themselves
CREATE POLICY "Users can create their own shares"
ON public.partner_shares
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own shares (to revoke) or accept invitations
CREATE POLICY "Users can update their shares"
ON public.partner_shares
FOR UPDATE
USING (
  auth.uid() = user_id 
  OR (auth.uid() = partner_user_id AND status = 'pending')
  OR (auth.email() = partner_email AND status = 'pending')
);

-- Policy: Users can delete their own shares
CREATE POLICY "Users can delete their own shares"
ON public.partner_shares
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_partner_shares_user_id ON public.partner_shares(user_id);
CREATE INDEX idx_partner_shares_partner_user_id ON public.partner_shares(partner_user_id);
CREATE INDEX idx_partner_shares_share_code ON public.partner_shares(share_code);
CREATE INDEX idx_partner_shares_status ON public.partner_shares(status);

-- Add RLS policies for partner access to user data

-- Partners can view shared user's cycles
CREATE POLICY "Partners can view shared cycles"
ON public.cycles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.partner_shares
    WHERE partner_shares.user_id = cycles.user_id
    AND partner_shares.partner_user_id = auth.uid()
    AND partner_shares.status = 'accepted'
    AND (partner_shares.permissions->>'view_cycles')::boolean = true
  )
);

-- Partners can view shared user's symptoms
CREATE POLICY "Partners can view shared symptoms"
ON public.symptoms
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.partner_shares
    WHERE partner_shares.user_id = symptoms.user_id
    AND partner_shares.partner_user_id = auth.uid()
    AND partner_shares.status = 'accepted'
    AND (partner_shares.permissions->>'view_symptoms')::boolean = true
  )
);

-- Partners can view shared user's daily check-ins
CREATE POLICY "Partners can view shared check-ins"
ON public.daily_checkins
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.partner_shares
    WHERE partner_shares.user_id = daily_checkins.user_id
    AND partner_shares.partner_user_id = auth.uid()
    AND partner_shares.status = 'accepted'
    AND (partner_shares.permissions->>'view_symptoms')::boolean = true
  )
);

-- Partners can view shared user's profile (limited info)
CREATE POLICY "Partners can view shared profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.partner_shares
    WHERE partner_shares.user_id = profiles.id
    AND partner_shares.partner_user_id = auth.uid()
    AND partner_shares.status = 'accepted'
  )
);

-- Function to generate unique share codes
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate a 12-character alphanumeric code
    code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 12));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.partner_shares WHERE share_code = code) INTO exists_check;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN code;
END;
$$;