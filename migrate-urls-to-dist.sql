-- Migration Script: Update Asset URLs from /api/assets/ to /dist/attached_assets/
-- Run this on production server after deploying new code

-- 1. Update home_content table
UPDATE home_content 
SET hero_video_url = REPLACE(hero_video_url, '/api/assets/', '/dist/attached_assets/')
WHERE hero_video_url LIKE '/api/assets/%';

UPDATE home_content 
SET reservation_video_url = REPLACE(reservation_video_url, '/api/assets/', '/dist/attached_assets/')
WHERE reservation_video_url LIKE '/api/assets/%';

-- 2. Update menu_items table
UPDATE menu_items 
SET image_url = REPLACE(image_url, '/api/assets/', '/dist/attached_assets/')
WHERE image_url LIKE '/api/assets/%';

-- 3. Update blog_posts table
UPDATE blog_posts 
SET image_url = REPLACE(image_url, '/api/assets/', '/dist/attached_assets/')
WHERE image_url LIKE '/api/assets/%';

UPDATE blog_posts 
SET cover_image_url = REPLACE(cover_image_url, '/api/assets/', '/dist/attached_assets/')
WHERE cover_image_url LIKE '/api/assets/%';

UPDATE blog_posts 
SET og_image_url = REPLACE(og_image_url, '/api/assets/', '/dist/attached_assets/')
WHERE og_image_url LIKE '/api/assets/%';

UPDATE blog_posts
SET content = REPLACE(content, '/api/assets/', '/dist/attached_assets/')
WHERE content LIKE '%/api/assets/%';

UPDATE blog_posts
SET content_vi = REPLACE(content_vi, '/api/assets/', '/dist/attached_assets/')
WHERE content_vi LIKE '%/api/assets/%';

-- 4. Verify results
SELECT 'home_content' as table_name, COUNT(*) as updated_count
FROM home_content 
WHERE hero_video_url LIKE '/dist/attached_assets/%' 
   OR reservation_video_url LIKE '/dist/attached_assets/%'

UNION ALL

SELECT 'menu_items', COUNT(*)
FROM menu_items 
WHERE image_url LIKE '/dist/attached_assets/%'

UNION ALL

SELECT 'blog_posts', COUNT(*)
FROM blog_posts 
WHERE image_url LIKE '/dist/attached_assets/%'
   OR cover_image_url LIKE '/dist/attached_assets/%'
   OR og_image_url LIKE '/dist/attached_assets/%';
