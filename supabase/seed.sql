-- ==============================================================================
-- INDSTATE REAL ESTATE — OPTIONAL SEED DATA (Indian Properties Across States)
-- Run this AFTER running schema.sql if you want initial genuine properties.
-- Note: Replace '<YOUR_AUTH_USER_ID>' with an actual UUID from your auth.users table,
-- or use the placeholder if you want sample listings.
-- ==============================================================================

DO $$
DECLARE
  demo_user_id UUID;
BEGIN
  -- Look for an existing auth user or get the first user
  SELECT id INTO demo_user_id FROM auth.users LIMIT 1;
  
  -- If at least one user exists, insert sample properties under that owner
  IF demo_user_id IS NOT NULL THEN
    
    -- 1. Maharashtra Property (Mumbai)
    INSERT INTO public.properties (
      owner_id, title, description, property_type, listing_type, price, price_per_sqft,
      state, city, locality, bedrooms, bathrooms, area, super_built_up_area,
      rera_number, is_rera_verified, status, featured, images, amenities, agent
    ) VALUES (
      demo_user_id,
      'Lodha World View - Ultra Luxury Sea-Facing Residence',
      'Experience the pinnacle of luxury living in South Mumbai with unobstructed Arabian Sea and Mahalaxmi Racecourse views.',
      'Penthouse', 'Buy', 185000000, 48684,
      'Maharashtra', 'Mumbai', 'Worli', 4, 5, 3800, 4850,
      'P51900008345 (MahaRERA)', true, 'approved', true,
      '["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
      '["Infinity Sea-View Pool", "100% DG Power Backup", "Grand Clubhouse", "Vastu Compliant", "EV Charging Stations"]'::jsonb,
      '{"name": "Rajesh Singhania", "agency": "Apex India Luxury Realty", "phone": "+91 98201 54321", "rating": 4.9}'::jsonb
    );

    -- 2. Andhra Pradesh Property (Vijayawada) - Critical for Part 10 & 23 test scenario
    INSERT INTO public.properties (
      owner_id, title, description, property_type, listing_type, price, price_per_sqft,
      state, city, locality, bedrooms, bathrooms, area, super_built_up_area,
      rera_number, is_rera_verified, status, featured, images, amenities, agent
    ) VALUES (
      demo_user_id,
      'Amaravati Royal Palms - Premium 3BHK Gated Villa',
      'Exclusive vastu-compliant villa in Vijayawada near Capital City Expressway. Fully landscaped garden, high ceilings, and 24x7 gated security.',
      'Independent Villa', 'Buy', 14500000, 5800,
      'Andhra Pradesh', 'Vijayawada', 'Benz Circle', 3, 3, 2500, 3100,
      'APRERA/VJA/2026/0441', true, 'approved', true,
      '["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
      '["Clubhouse", "24x7 Security & CCTV", "Vastu Compliant", "Private Lawn", "Rainwater Harvesting"]'::jsonb,
      '{"name": "K. Venkat Rao", "agency": "Amaravati Prime Properties", "phone": "+91 98480 12345", "rating": 4.8}'::jsonb
    );

    -- 3. Karnataka Property (Bengaluru)
    INSERT INTO public.properties (
      owner_id, title, description, property_type, listing_type, price, price_per_sqft,
      state, city, locality, bedrooms, bathrooms, area, super_built_up_area,
      rera_number, is_rera_verified, status, featured, images, amenities, agent
    ) VALUES (
      demo_user_id,
      'Prestige Golfshire - Championship Golf Villa',
      'Situated at the foothills of Nandi Hills with an 18-hole championship golf course, Falcon Greens clubhouse, and private infinity plunge pool.',
      'Independent Villa', 'Buy', 125000000, 21258,
      'Karnataka', 'Bengaluru', 'Nandi Hills', 4, 5, 5880, 7200,
      'PRM/KA/RERA/1250/303/PR/171014/000205', true, 'approved', true,
      '["https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
      '["18-Hole Golf Course", "Private Plunge Pool", "Helipad Access", "Luxury Spa", "24x7 Concierge"]'::jsonb,
      '{"name": "Ananya Hegde", "agency": "Bangalore Prestige Estates", "phone": "+91 99000 44556", "rating": 4.9}'::jsonb
    );

    -- 4. Telangana Property (Hyderabad)
    INSERT INTO public.properties (
      owner_id, title, description, property_type, listing_type, price, price_per_sqft,
      state, city, locality, bedrooms, bathrooms, area, super_built_up_area,
      rera_number, is_rera_verified, status, featured, images, amenities, agent
    ) VALUES (
      demo_user_id,
      'My Home Bhooja - Ultra-Luxury High Rise',
      'Located in the heart of Hyderabad IT corridor Hitec City with sweeping views of the Bio-Diversity Park and Durgam Cheruvu cable bridge.',
      'Apartment', 'Buy', 42000000, 10319,
      'Telangana', 'Hyderabad', 'Hitec City', 3, 4, 4070, 4884,
      'P02400000288 (TSRERA)', true, 'approved', false,
      '["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
      '["Sky Lounge", "Olympic Size Lap Pool", "Tennis Courts", "100% Power Backup", "EV Charging Bay"]'::jsonb,
      '{"name": "Suresh Reddy", "agency": "Hyderabad Realty Hub", "phone": "+91 98490 99887", "rating": 4.8}'::jsonb
    );

    RAISE NOTICE 'Sample properties successfully seeded under user %', demo_user_id;
  ELSE
    RAISE NOTICE 'No auth user found yet. Sign up or register first, then rerun this seed script, or upload directly via the UI!';
  END IF;
END $$;
