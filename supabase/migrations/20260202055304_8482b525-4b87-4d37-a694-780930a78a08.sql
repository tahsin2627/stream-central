-- Drop existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view their own custom streams" ON public.custom_streams;

-- Create public SELECT policy - anyone can view custom streams
CREATE POLICY "Anyone can view custom streams"
ON public.custom_streams
FOR SELECT
USING (true);

-- Keep existing INSERT/UPDATE/DELETE policies for authenticated users only
-- (already exist from previous migration)