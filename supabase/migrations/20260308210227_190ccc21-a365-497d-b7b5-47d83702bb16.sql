
-- Fix comments policies: drop RESTRICTIVE, recreate as PERMISSIVE
DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;

CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Fix post_likes policies
DROP POLICY IF EXISTS "Anyone can view likes" ON public.post_likes;
DROP POLICY IF EXISTS "Users can like posts" ON public.post_likes;
DROP POLICY IF EXISTS "Users can remove their own likes" ON public.post_likes;

CREATE POLICY "Anyone can view likes" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their own likes" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

-- Fix posts policies
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;

CREATE POLICY "Anyone can view posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- Fix profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Partners can view shared profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Partners can view shared profiles" ON public.profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM partner_shares
    WHERE partner_shares.user_id = profiles.id
    AND partner_shares.partner_user_id = auth.uid()
    AND partner_shares.status = 'accepted'
  )
);

-- Fix cycles policies
DROP POLICY IF EXISTS "Users can view their own cycles" ON public.cycles;
DROP POLICY IF EXISTS "Users can insert their own cycles" ON public.cycles;
DROP POLICY IF EXISTS "Users can update their own cycles" ON public.cycles;
DROP POLICY IF EXISTS "Users can delete their own cycles" ON public.cycles;
DROP POLICY IF EXISTS "Partners can view shared cycles" ON public.cycles;

CREATE POLICY "Users can view their own cycles" ON public.cycles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own cycles" ON public.cycles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cycles" ON public.cycles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cycles" ON public.cycles FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Partners can view shared cycles" ON public.cycles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM partner_shares
    WHERE partner_shares.user_id = cycles.user_id
    AND partner_shares.partner_user_id = auth.uid()
    AND partner_shares.status = 'accepted'
    AND (partner_shares.permissions->>'view_cycles')::boolean = true
  )
);

-- Fix symptoms policies
DROP POLICY IF EXISTS "Users can view their own symptoms" ON public.symptoms;
DROP POLICY IF EXISTS "Users can insert their own symptoms" ON public.symptoms;
DROP POLICY IF EXISTS "Users can update their own symptoms" ON public.symptoms;
DROP POLICY IF EXISTS "Users can delete their own symptoms" ON public.symptoms;
DROP POLICY IF EXISTS "Partners can view shared symptoms" ON public.symptoms;

CREATE POLICY "Users can view their own symptoms" ON public.symptoms FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own symptoms" ON public.symptoms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own symptoms" ON public.symptoms FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own symptoms" ON public.symptoms FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Partners can view shared symptoms" ON public.symptoms FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM partner_shares
    WHERE partner_shares.user_id = symptoms.user_id
    AND partner_shares.partner_user_id = auth.uid()
    AND partner_shares.status = 'accepted'
    AND (partner_shares.permissions->>'view_symptoms')::boolean = true
  )
);

-- Fix daily_checkins policies
DROP POLICY IF EXISTS "Users can view their own daily check-ins" ON public.daily_checkins;
DROP POLICY IF EXISTS "Users can insert their own daily check-ins" ON public.daily_checkins;
DROP POLICY IF EXISTS "Users can update their own daily check-ins" ON public.daily_checkins;
DROP POLICY IF EXISTS "Users can delete their own daily check-ins" ON public.daily_checkins;
DROP POLICY IF EXISTS "Partners can view shared check-ins" ON public.daily_checkins;

CREATE POLICY "Users can view their own daily check-ins" ON public.daily_checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own daily check-ins" ON public.daily_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own daily check-ins" ON public.daily_checkins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own daily check-ins" ON public.daily_checkins FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Partners can view shared check-ins" ON public.daily_checkins FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM partner_shares
    WHERE partner_shares.user_id = daily_checkins.user_id
    AND partner_shares.partner_user_id = auth.uid()
    AND partner_shares.status = 'accepted'
    AND (partner_shares.permissions->>'view_symptoms')::boolean = true
  )
);

-- Fix bbt_logs policies
DROP POLICY IF EXISTS "Users can view their own BBT logs" ON public.bbt_logs;
DROP POLICY IF EXISTS "Users can insert their own BBT logs" ON public.bbt_logs;
DROP POLICY IF EXISTS "Users can update their own BBT logs" ON public.bbt_logs;
DROP POLICY IF EXISTS "Users can delete their own BBT logs" ON public.bbt_logs;

CREATE POLICY "Users can view their own BBT logs" ON public.bbt_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own BBT logs" ON public.bbt_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own BBT logs" ON public.bbt_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own BBT logs" ON public.bbt_logs FOR DELETE USING (auth.uid() = user_id);

-- Fix medications policies
DROP POLICY IF EXISTS "Users can view their own medications" ON public.medications;
DROP POLICY IF EXISTS "Users can insert their own medications" ON public.medications;
DROP POLICY IF EXISTS "Users can update their own medications" ON public.medications;
DROP POLICY IF EXISTS "Users can delete their own medications" ON public.medications;

CREATE POLICY "Users can view their own medications" ON public.medications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own medications" ON public.medications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own medications" ON public.medications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own medications" ON public.medications FOR DELETE USING (auth.uid() = user_id);

-- Fix medication_logs policies
DROP POLICY IF EXISTS "Users can view their own medication logs" ON public.medication_logs;
DROP POLICY IF EXISTS "Users can insert their own medication logs" ON public.medication_logs;
DROP POLICY IF EXISTS "Users can update their own medication logs" ON public.medication_logs;
DROP POLICY IF EXISTS "Users can delete their own medication logs" ON public.medication_logs;

CREATE POLICY "Users can view their own medication logs" ON public.medication_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own medication logs" ON public.medication_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own medication logs" ON public.medication_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own medication logs" ON public.medication_logs FOR DELETE USING (auth.uid() = user_id);

-- Fix cervical_mucus_logs policies
DROP POLICY IF EXISTS "Users can view their own cervical mucus logs" ON public.cervical_mucus_logs;
DROP POLICY IF EXISTS "Users can insert their own cervical mucus logs" ON public.cervical_mucus_logs;
DROP POLICY IF EXISTS "Users can update their own cervical mucus logs" ON public.cervical_mucus_logs;
DROP POLICY IF EXISTS "Users can delete their own cervical mucus logs" ON public.cervical_mucus_logs;

CREATE POLICY "Users can view their own cervical mucus logs" ON public.cervical_mucus_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own cervical mucus logs" ON public.cervical_mucus_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cervical mucus logs" ON public.cervical_mucus_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cervical mucus logs" ON public.cervical_mucus_logs FOR DELETE USING (auth.uid() = user_id);

-- Fix partner_shares policies
DROP POLICY IF EXISTS "Users can view their own shares and incoming shares" ON public.partner_shares;
DROP POLICY IF EXISTS "Users can create their own shares" ON public.partner_shares;
DROP POLICY IF EXISTS "Users can update their shares" ON public.partner_shares;
DROP POLICY IF EXISTS "Users can delete their own shares" ON public.partner_shares;

CREATE POLICY "Users can view their own shares and incoming shares" ON public.partner_shares FOR SELECT USING (
  auth.uid() = user_id OR auth.uid() = partner_user_id OR (auth.email() = partner_email AND status = 'pending')
);
CREATE POLICY "Users can create their own shares" ON public.partner_shares FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their shares" ON public.partner_shares FOR UPDATE USING (
  auth.uid() = user_id OR (auth.uid() = partner_user_id AND status = 'pending') OR (auth.email() = partner_email AND status = 'pending')
);
CREATE POLICY "Users can delete their own shares" ON public.partner_shares FOR DELETE USING (auth.uid() = user_id);
