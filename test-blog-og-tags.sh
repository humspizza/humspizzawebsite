#!/bin/bash

echo "==================================="
echo "Blog Post OG Tags Testing"
echo "==================================="
echo ""

# Test Vietnamese blog post
echo "📰 Testing Vietnamese blog post..."
echo "URL: /news/qua-tang-20-10-hums-pizza-danh-tang-phai-dep"
echo "-----------------------------------"
curl -s -A "facebookexternalhit/1.1" "http://localhost:5000/news/qua-tang-20-10-hums-pizza-danh-tang-phai-dep" | \
  grep -E "meta property=\"og:(title|description|image)\"" | \
  sed 's/^[ \t]*//'
echo ""

# Test English blog post
echo "📰 Testing English blog post..."
echo "URL: /news/october-20th-gift-hums-pizza-for-ladies"
echo "-----------------------------------"
curl -s -A "facebookexternalhit/1.1" "http://localhost:5000/news/october-20th-gift-hums-pizza-for-ladies" | \
  grep -E "meta property=\"og:(title|description|image)\"" | \
  sed 's/^[ \t]*//'
echo ""

# Compare with homepage
echo "🏠 Comparing with Homepage OG tags..."
echo "URL: /"
echo "-----------------------------------"
curl -s -A "facebookexternalhit/1.1" "http://localhost:5000/" | \
  grep -E "meta property=\"og:(title|description|image)\"" | \
  sed 's/^[ \t]*//'
echo ""

echo "==================================="
echo "✅ Test Complete"
echo "==================================="
echo ""
echo "📌 Key Points:"
echo "   - Blog posts should have THEIR OWN OG tags"
echo "   - Vietnamese slug → Vietnamese meta tags"
echo "   - English slug → English meta tags"
echo "   - Blog OG image ≠ Homepage OG image"
echo ""
