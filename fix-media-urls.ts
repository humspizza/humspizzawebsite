import 'dotenv/config';
import { db } from './server/db';
import { homeContent, menuItems, blogPosts, pageSeo } from './shared/schema';
import { sql } from 'drizzle-orm';

async function fixMediaUrls() {
  console.log('🔧 Starting media URLs migration...\n');
  
  try {
    // Fix home_content table
    console.log('📝 Updating home_content URLs...');
    const result1 = await db.execute(sql`
      UPDATE home_content
      SET 
        hero_video_url = REPLACE(hero_video_url, '/api/assets/', '/dist/attached_assets/'),
        reservation_video_url = REPLACE(reservation_video_url, '/api/assets/', '/dist/attached_assets/'),
        pending_hero_video_url = REPLACE(pending_hero_video_url, '/api/assets/', '/dist/attached_assets/'),
        pending_reservation_video_url = REPLACE(pending_reservation_video_url, '/api/assets/', '/dist/attached_assets/')
      WHERE 
        hero_video_url LIKE '/api/assets/%' OR
        reservation_video_url LIKE '/api/assets/%' OR
        pending_hero_video_url LIKE '/api/assets/%' OR
        pending_reservation_video_url LIKE '/api/assets/%'
    `);
    console.log('  ✅ home_content updated');

    // Fix menu_items table
    console.log('📝 Updating menu_items URLs...');
    const result2 = await db.execute(sql`
      UPDATE menu_items
      SET image_url = REPLACE(image_url, '/api/assets/', '/dist/attached_assets/')
      WHERE image_url LIKE '/api/assets/%'
    `);
    console.log('  ✅ menu_items updated');

    // Fix blog_posts table
    console.log('📝 Updating blog_posts URLs...');
    const result3 = await db.execute(sql`
      UPDATE blog_posts
      SET image_url = REPLACE(image_url, '/api/assets/', '/dist/attached_assets/')
      WHERE image_url LIKE '/api/assets/%'
    `);
    console.log('  ✅ blog_posts updated');

    // Fix page_seo table
    console.log('📝 Updating page_seo URLs...');
    const result4 = await db.execute(sql`
      UPDATE page_seo
      SET og_image_url = REPLACE(og_image_url, '/api/assets/', '/dist/attached_assets/')
      WHERE og_image_url LIKE '/api/assets/%'
    `);
    console.log('  ✅ page_seo updated');

    console.log('\n✅ All media URLs have been migrated from /api/assets/ to /dist/attached_assets/');
    
    // Verify
    console.log('\n🔍 Verifying changes...');
    const check = await db.execute(sql`
      SELECT 
        (SELECT COUNT(*) FROM home_content WHERE hero_video_url LIKE '/api/assets/%') as home_old,
        (SELECT COUNT(*) FROM menu_items WHERE image_url LIKE '/api/assets/%') as menu_old,
        (SELECT COUNT(*) FROM blog_posts WHERE image_url LIKE '/api/assets/%') as blog_old,
        (SELECT COUNT(*) FROM page_seo WHERE og_image_url LIKE '/api/assets/%') as seo_old
    `);
    
    console.log('Remaining old URLs:', check.rows?.[0]);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
  
  process.exit(0);
}

fixMediaUrls();
