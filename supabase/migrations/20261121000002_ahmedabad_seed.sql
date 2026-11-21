-- ============================================================================
-- 002_ahmedabad_seed.sql
-- Ahmedabad, Gujarat Pilot Service Areas, Default Commission Rules & Initial Config
-- ============================================================================

-- 1. Insert Ahmedabad City
INSERT INTO cities (name, state, country, timezone, is_active)
VALUES ('Ahmedabad', 'Gujarat', 'India', 'Asia/Kolkata', true)
ON CONFLICT DO NOTHING;

-- 2. Insert Key Ahmedabad Mobility Hotspots / Pilot Areas
DO $$
DECLARE
  v_city_id uuid;
BEGIN
  SELECT id INTO v_city_id FROM cities WHERE name = 'Ahmedabad' LIMIT 1;

  IF v_city_id IS NOT NULL THEN
    -- Prahlad Nagar
    INSERT INTO service_areas (city_id, name, postal_codes, latitude, longitude, is_active)
    VALUES (v_city_id, 'Prahlad Nagar', ARRAY['380015'], 23.0124, 72.5085, true);

    -- SG Highway (Sindhu Bhavan Road junction)
    INSERT INTO service_areas (city_id, name, postal_codes, latitude, longitude, is_active)
    VALUES (v_city_id, 'Sindhu Bhavan Road / Bodakdev', ARRAY['380054'], 23.0450, 72.5080, true);

    -- Navrangpura (Near CG Road & University)
    INSERT INTO service_areas (city_id, name, postal_codes, latitude, longitude, is_active)
    VALUES (v_city_id, 'Navrangpura & CG Road', ARRAY['380009'], 23.0365, 72.5611, true);

    -- Ashram Road & Riverfront
    INSERT INTO service_areas (city_id, name, postal_codes, latitude, longitude, is_active)
    VALUES (v_city_id, 'Ashram Road & Sabarmati Riverfront', ARRAY['380006', '380014'], 23.0298, 72.5714, true);

    -- Vastrapur & IIM Ahmedabad
    INSERT INTO service_areas (city_id, name, postal_codes, latitude, longitude, is_active)
    VALUES (v_city_id, 'Vastrapur / IIM Ahmedabad', ARRAY['380015'], 23.0338, 72.5287, true);
  END IF;
END $$;

-- 3. Default Marketplace Commission Rule
INSERT INTO commission_rules (name, rate_percentage, tax_rate_percentage, is_active)
VALUES ('Default Standard Marketplace Commission', 15.00, 18.00, true)
ON CONFLICT DO NOTHING;
