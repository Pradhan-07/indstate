-- ==============================================================================
-- INDSTATE REAL ESTATE — COMPLETE PRODUCTION DATABASE & STORAGE SCHEMA
-- Execute this entire script in your Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. PROFILES TABLE (User Profile Database)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  state TEXT NOT NULL,
  city TEXT,
  phone TEXT,
  role TEXT DEFAULT 'Buyer' CHECK (role IN ('Buyer', 'Owner', 'Agent', 'Builder', 'Admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT profiles_user_id_key UNIQUE (user_id)
);

-- Profiles Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_state ON public.profiles(state);

-- Enable Row Level Security (RLS) on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies: User can view, insert, and update ONLY their own profile data
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 2. PROPERTIES TABLE (Realtime Multi-User Property Backend)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  property_type TEXT NOT NULL DEFAULT 'Apartment',
  listing_type TEXT NOT NULL DEFAULT 'Buy',
  price NUMERIC NOT NULL CHECK (price > 0),
  price_per_sqft NUMERIC,
  maintenance_charges NUMERIC DEFAULT 0,
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  locality TEXT,
  district TEXT,
  pin_code TEXT,
  address TEXT,
  bedrooms INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 1,
  balconies INTEGER DEFAULT 0,
  area NUMERIC DEFAULT 0,
  super_built_up_area NUMERIC DEFAULT 0,
  furnishing TEXT DEFAULT 'Semi-Furnished',
  facing TEXT DEFAULT 'East (Vastu Compliant)',
  possession_status TEXT DEFAULT 'Ready to Move',
  possession_date TEXT DEFAULT 'Immediate',
  floor TEXT,
  parking TEXT,
  rera_number TEXT,
  is_rera_verified BOOLEAN DEFAULT false,
  latitude NUMERIC,
  longitude NUMERIC,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
  floor_plans JSONB NOT NULL DEFAULT '[]'::jsonb,
  nearby JSONB NOT NULL DEFAULT '[]'::jsonb,
  agent JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Properties High-Performance Indexes
CREATE INDEX IF NOT EXISTS idx_properties_state ON public.properties(state);
CREATE INDEX IF NOT EXISTS idx_properties_city ON public.properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON public.properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON public.properties(created_at DESC);

-- Enable Row Level Security (RLS) on Properties
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Properties RLS Policies:
-- 1. Public users can view approved/pending properties (or owners viewing their own)
DROP POLICY IF EXISTS "Public properties are viewable by everyone" ON public.properties;
CREATE POLICY "Public properties are viewable by everyone"
ON public.properties
FOR SELECT
USING (status IN ('approved', 'pending') OR auth.uid() = owner_id);

-- 2. Authenticated users can insert properties with their own user ID
DROP POLICY IF EXISTS "Authenticated users can insert property" ON public.properties;
CREATE POLICY "Authenticated users can insert property"
ON public.properties
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- 3. Authenticated property owners can update ONLY their own properties
DROP POLICY IF EXISTS "Users can update own property" ON public.properties;
CREATE POLICY "Users can update own property"
ON public.properties
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- 4. Authenticated property owners can delete ONLY their own properties
DROP POLICY IF EXISTS "Users can delete own property" ON public.properties;
CREATE POLICY "Users can delete own property"
ON public.properties
FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);

-- ==============================================================================
-- 3. AUTOMATIC TIMESTAMPS TRIGGER FUNCTION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on profiles
DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger on properties
DROP TRIGGER IF EXISTS on_properties_updated ON public.properties;
CREATE TRIGGER on_properties_updated
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 4. GOOGLE OAUTH AUTOMATIC USER PROFILE TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_oauth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, state, city, phone, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'state', ''), -- If empty, frontend modal prompts compulsory State selection
    COALESCE(NEW.raw_user_meta_data->>'city', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_oauth_user();

-- ==============================================================================
-- 5. REALTIME REPLICATION CONFIGURATION (Supabase Realtime)
-- ==============================================================================
-- Enable Full Replica Identity for PostgreSQL CDC (Change Data Capture)
ALTER TABLE public.properties REPLICA IDENTITY FULL;

-- Add properties table to supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'properties'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.properties;
  END IF;
END $$;

-- ==============================================================================
-- 6. SUPABASE STORAGE BUCKET: property-images
-- ==============================================================================
-- Insert the public bucket for permanent property images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  true,
  10485760, -- 10MB file limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

-- Storage RLS Policies for property-images
DROP POLICY IF EXISTS "Public can view property images" ON storage.objects;
CREATE POLICY "Public can view property images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'property-images');

DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
CREATE POLICY "Authenticated users can upload property images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property-images');

DROP POLICY IF EXISTS "Users can update own property images" ON storage.objects;
CREATE POLICY "Users can update own property images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete own property images" ON storage.objects;
CREATE POLICY "Users can delete own property images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);
