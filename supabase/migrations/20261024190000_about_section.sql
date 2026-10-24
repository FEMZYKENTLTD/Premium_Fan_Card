-- Add about-section columns to site_settings for admin-editable quote, portrait, and bio.

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS about_quote text NOT NULL DEFAULT 'I AM OKAY WITH BEING A ''LONER'' AND HAVING A SMALL CIRCLE. I ENJOY MY OWN COMPANY AND ONLY WANT TO BE AROUND PEOPLE WHO GENUINELY ENJOY ME',
  ADD COLUMN IF NOT EXISTS about_image_url text NOT NULL DEFAULT 'https://dala-prod-public-storage.s3.eu-west-1.amazonaws.com/attachments/9f85c535-e1dd-4d9a-93be-bdc0784ff8b3/1792865246951_keanu_reeves.jpg',
  ADD COLUMN IF NOT EXISTS about_bio text NOT NULL DEFAULT 'Renowned Canadian-American actor celebrated worldwide for iconic cinematic roles and exceptional philanthropy. Experience unprecedented exclusive access and private correspondence through official registry membership.';

-- Ensure the existing default row has the new columns populated.
UPDATE public.site_settings
  SET about_quote = 'I AM OKAY WITH BEING A ''LONER'' AND HAVING A SMALL CIRCLE. I ENJOY MY OWN COMPANY AND ONLY WANT TO BE AROUND PEOPLE WHO GENUINELY ENJOY ME',
      about_image_url = 'https://dala-prod-public-storage.s3.eu-west-1.amazonaws.com/attachments/9f85c535-e1dd-4d9a-93be-bdc0784ff8b3/1792865246951_keanu_reeves.jpg',
      about_bio = 'Renowned Canadian-American actor celebrated worldwide for iconic cinematic roles and exceptional philanthropy. Experience unprecedented exclusive access and private correspondence through official registry membership.'
  WHERE id = 'default' AND about_quote IS NULL;
