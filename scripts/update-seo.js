const fs = require('fs');
const https = require('https');

async function fetchBlogPosts() {
  return new Promise((resolve, reject) => {
    const req = https.get('http://localhost:5000/api/blog-posts', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
  });
}

async function main() {
  try {
    const posts = await fetchBlogPosts();
    console.log(`Found ${posts.length} blog posts:`);
    
    posts.forEach((post, index) => {
      console.log(`\n${index + 1}. ${post.title}`);
      console.log(`   ID: ${post.id}`);
      console.log(`   Meta Title: ${post.metaTitle || 'MISSING'}`);
      console.log(`   Meta Description: ${post.metaDescription || 'MISSING'}`);
      console.log(`   Keywords: ${post.keywords || 'MISSING'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main();