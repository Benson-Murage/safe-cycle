-- Create BBT logs table for basal body temperature tracking
CREATE TABLE public.bbt_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  temperature NUMERIC(4,2) NOT NULL,
  time_taken TIME,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cervical mucus logs table
CREATE TABLE public.cervical_mucus_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('dry', 'sticky', 'creamy', 'watery', 'egg_white')),
  amount TEXT CHECK (amount IN ('light', 'medium', 'heavy')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medications table for tracking medications/birth control
CREATE TABLE public.medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('birth_control', 'supplement', 'medication', 'other')),
  dosage TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'as_needed')),
  reminder_time TIME,
  reminder_enabled BOOLEAN NOT NULL DEFAULT true,
  custom_reminder_text TEXT,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medication logs table for tracking when medications are taken
CREATE TABLE public.medication_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_taken TIME,
  taken BOOLEAN NOT NULL DEFAULT true,
  skipped_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.bbt_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cervical_mucus_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;

-- BBT logs policies
CREATE POLICY "Users can view their own BBT logs" ON public.bbt_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own BBT logs" ON public.bbt_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own BBT logs" ON public.bbt_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own BBT logs" ON public.bbt_logs FOR DELETE USING (auth.uid() = user_id);

-- Cervical mucus logs policies
CREATE POLICY "Users can view their own cervical mucus logs" ON public.cervical_mucus_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own cervical mucus logs" ON public.cervical_mucus_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cervical mucus logs" ON public.cervical_mucus_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cervical mucus logs" ON public.cervical_mucus_logs FOR DELETE USING (auth.uid() = user_id);

-- Medications policies
CREATE POLICY "Users can view their own medications" ON public.medications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own medications" ON public.medications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own medications" ON public.medications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own medications" ON public.medications FOR DELETE USING (auth.uid() = user_id);

-- Medication logs policies
CREATE POLICY "Users can view their own medication logs" ON public.medication_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own medication logs" ON public.medication_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own medication logs" ON public.medication_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own medication logs" ON public.medication_logs FOR DELETE USING (auth.uid() = user_id);

-- Create unique constraints to prevent duplicate entries per day
CREATE UNIQUE INDEX bbt_logs_user_date_idx ON public.bbt_logs (user_id, date);
CREATE UNIQUE INDEX cervical_mucus_logs_user_date_idx ON public.cervical_mucus_logs (user_id, date);
CREATE UNIQUE INDEX medication_logs_user_med_date_idx ON public.medication_logs (user_id, medication_id, date);

-- Add trigger for medications updated_at
CREATE TRIGGER update_medications_updated_at
  BEFORE UPDATE ON public.medications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();