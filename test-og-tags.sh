#!/bin/bash

# Script to test Open Graph meta tags for all pages
# This simulates how Facebook/Twitter crawlers see your website

echo "🔍 Testing Open Graph Meta Tags"
echo "================================"
echo ""

# Test static pages
echo "📄 STATIC PAGES:"
echo "----------------"

echo ""
echo "1️⃣  HOME PAGE (/)"
curl -A "facebookexternalhit/1.1" http://localhost:5000/ 2>/dev/null | grep -E "(og:title|og:description)" | head -2
echo ""

echo "2️⃣  ABOUT PAGE (/about)"
curl -A "facebookexternalhit/1.1" http://localhost:5000/about 2>/dev/null | grep -E "(og:title|og:description)" | head -2
echo ""

echo "3️⃣  MENU PAGE (/menu)"
curl -A "facebookexternalhit/1.1" http://localhost:5000/menu 2>/dev/null | grep -E "(og:title|og:description)" | head -2
echo ""

echo "4️⃣  BOOKING PAGE (/booking)"
curl -A "facebookexternalhit/1.1" http://localhost:5000/booking 2>/dev/null | grep -E "(og:title|og:description)" | head -2
echo ""

echo "5️⃣  CONTACT PAGE (/contact)"
curl -A "facebookexternalhit/1.1" http://localhost:5000/contact 2>/dev/null | grep -E "(og:title|og:description)" | head -2
echo ""

# Test blog posts
echo ""
echo "📝 BLOG POSTS:"
echo "----------------"

echo ""
echo "6️⃣  Blog Post 1: Welcome Appetizer Set"
curl -A "facebookexternalhit/1.1" http://localhost:5000/news/welcome-appetizer-set-humspizza 2>/dev/null | grep -E "(og:title|og:description)" | head -2
echo ""

echo "7️⃣  Blog Post 2: September 2nd Offer"
curl -A "facebookexternalhit/1.1" http://localhost:5000/news/hums-pizza-welcome-set-september-2nd 2>/dev/null | grep -E "(og:title|og:description)" | head -2
echo ""

echo "8️⃣  Blog Post 3: Job Opening"
curl -A "facebookexternalhit/1.1" http://localhost:5000/news/hiring-pizza-chef-assistant-chef 2>/dev/null | grep -E "(og:title|og:description)" | head -2
echo ""

echo "================================"
echo "✅ Test completed!"
echo ""
echo "📌 NOTE: Each page should have UNIQUE og:title and og:description"
echo "📌 This is what Facebook, Twitter, LinkedIn see when you share links"
echo ""
echo "To test on production:"
echo "  1. Replace 'localhost:5000' with your production domain"
echo "  2. Use Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/"
echo "  3. Use Twitter Card Validator: https://cards-dev.twitter.com/validator"
echo ""
