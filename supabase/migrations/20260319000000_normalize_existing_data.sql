-- Migration to normalize existing data casing and numerical formats
-- This script addresses: Accounts, Leads, Contacts, and Branches

-- 1. Helper function for Title Case with Portuguese exceptions
CREATE OR REPLACE FUNCTION public.normalize_casing(text_val TEXT) 
RETURNS TEXT AS $$
DECLARE
    words TEXT[];
    word TEXT;
    result TEXT[];
    particles TEXT[] := ARRAY['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'para', 'com'];
BEGIN
    IF text_val IS NULL OR text_val = '' THEN
        RETURN text_val;
    END IF;

    words := regexp_split_to_array(lower(trim(text_val)), '\s+');
    
    FOR i IN 1..array_length(words, 1) LOOP
        word := words[i];
        -- Capitalize if it's the first word, last word, or not a particle
        IF i = 1 OR i = array_length(words, 1) OR NOT (word = ANY(particles)) THEN
            word := initcap(word);
        END IF;
        result := array_append(result, word);
    END LOOP;

    RETURN array_to_string(result, ' ');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Update Accounts
UPDATE public.accounts
SET 
    name = public.normalize_casing(name),
    cnpj = CASE 
        WHEN length(regexp_replace(cnpj, '\D', '', 'g')) = 14 
        THEN regexp_replace(regexp_replace(cnpj, '\D', '', 'g'), '^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$', '\1.\2.\3/\4-\5')
        WHEN length(regexp_replace(cnpj, '\D', '', 'g')) = 11
        THEN regexp_replace(regexp_replace(cnpj, '\D', '', 'g'), '^(\d{3})(\d{3})(\d{3})(\d{2})$', '\1.\2.\3-\4')
        ELSE cnpj
    END,
    zip = CASE 
        WHEN length(regexp_replace(zip, '\D', '', 'g')) = 8
        THEN regexp_replace(regexp_replace(zip, '\D', '', 'g'), '^(\d{5})(\d{3})$', '\1-\2')
        ELSE zip
    END,
    street = public.normalize_casing(street),
    neighborhood = public.normalize_casing(neighborhood),
    city = public.normalize_casing(city),
    state = CASE WHEN length(trim(state)) = 2 THEN upper(trim(state)) ELSE public.normalize_casing(state) END;

-- 3. Update Leads
UPDATE public.leads
SET 
    company = public.normalize_casing(company),
    contact_name = public.normalize_casing(contact_name),
    cnpj = CASE 
        WHEN length(regexp_replace(cnpj, '\D', '', 'g')) = 14 
        THEN regexp_replace(regexp_replace(cnpj, '\D', '', 'g'), '^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$', '\1.\2.\3/\4-\5')
        WHEN length(regexp_replace(cnpj, '\D', '', 'g')) = 11
        THEN regexp_replace(regexp_replace(cnpj, '\D', '', 'g'), '^(\d{3})(\d{3})(\d{3})(\d{2})$', '\1.\2.\3-\4')
        ELSE cnpj
    END,
    phone = CASE 
        WHEN length(regexp_replace(phone, '\D', '', 'g')) = 11
        THEN regexp_replace(regexp_replace(phone, '\D', '', 'g'), '^(\d{2})(\d{5})(\d{4})$', '(\1) \2-\3')
        WHEN length(regexp_replace(phone, '\D', '', 'g')) = 10
        THEN regexp_replace(regexp_replace(phone, '\D', '', 'g'), '^(\d{2})(\d{4})(\d{4})$', '(\1) \2-\3')
        ELSE phone
    END,
    street = public.normalize_casing(street),
    neighborhood = public.normalize_casing(neighborhood),
    city = public.normalize_casing(city),
    state = CASE WHEN length(trim(state)) = 2 THEN upper(trim(state)) ELSE public.normalize_casing(state) END,
    zip = CASE 
        WHEN length(regexp_replace(zip, '\D', '', 'g')) = 8
        THEN regexp_replace(regexp_replace(zip, '\D', '', 'g'), '^(\d{5})(\d{3})$', '\1-\2')
        ELSE zip
    END;

-- 4. Update Account Contacts
UPDATE public.account_contacts
SET 
    name = public.normalize_casing(name),
    mobile_phone = CASE 
        WHEN length(regexp_replace(mobile_phone, '\D', '', 'g')) = 11
        THEN regexp_replace(regexp_replace(mobile_phone, '\D', '', 'g'), '^(\d{2})(\d{5})(\d{4})$', '(\1) \2-\3')
        WHEN length(regexp_replace(mobile_phone, '\D', '', 'g')) = 10
        THEN regexp_replace(regexp_replace(mobile_phone, '\D', '', 'g'), '^(\d{2})(\d{4})(\d{4})$', '(\1) \2-\3')
        ELSE mobile_phone
    END,
    landline_phone = CASE 
        WHEN length(regexp_replace(landline_phone, '\D', '', 'g')) = 10
        THEN regexp_replace(regexp_replace(landline_phone, '\D', '', 'g'), '^(\d{2})(\d{4})(\d{4})$', '(\1) \2-\3')
        ELSE landline_phone
    END;

-- 5. Update Account Branches
UPDATE public.account_branches
SET 
    name = public.normalize_casing(name),
    street = public.normalize_casing(street),
    neighborhood = public.normalize_casing(neighborhood),
    city = public.normalize_casing(city),
    state = CASE WHEN length(trim(state)) = 2 THEN upper(trim(state)) ELSE public.normalize_casing(state) END,
    zip = CASE 
        WHEN length(regexp_replace(zip, '\D', '', 'g')) = 8
        THEN regexp_replace(regexp_replace(zip, '\D', '', 'g'), '^(\d{5})(\d{3})$', '\1-\2')
        ELSE zip
    END;

-- 6. Update Deals
UPDATE public.deals
SET 
    title = public.normalize_casing(title),
    company = public.normalize_casing(company);

-- Clean up the temporary function (Optional, keeping it might be useful for future migrations)
-- DROP FUNCTION public.normalize_casing(TEXT);
