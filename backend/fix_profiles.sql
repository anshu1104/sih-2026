-- 1. Create a function to automatically insert a profile for every new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    'citizen' -- Default role, they can change it if needed
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- 2. Create a trigger that calls the function whenever a user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Just in case you already have users who are missing profiles (like your current account),
-- let's backfill them right now so you don't even have to create a new account!
INSERT INTO public.profiles (id, email, full_name, role)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', ''), 'citizen'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);
