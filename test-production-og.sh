#!/bin/bash
echo "================================================"
echo "SCRIPT TEST OG META TAGS - PRODUCTION"
echo "================================================"
echo ""
echo "Sử dụng script này để kiểm tra OG meta tags trên production:"
echo ""
echo "Cách dùng:"
echo "  bash test-production-og.sh https://humspizza.com"
echo ""
echo "================================================"
echo ""

DOMAIN=${1:-"https://humspizza.com"}

echo "Testing: $DOMAIN"
echo ""

test_page() {
  local path=$1
  local page_name=$2
  
  echo "=== Testing $page_name ($path) ==="
  curl -s -A "facebookexternalhit/1.1" "$DOMAIN$path" | grep -A 1 "og:title" | head -3
  echo ""
}

test_page "/" "Home Page"
test_page "/menu" "Menu Page"
test_page "/about" "About Page"
test_page "/booking" "Booking Page"
test_page "/contact" "Contact Page"
test_page "/news" "Blog Page"

echo "================================================"
echo "Nếu tất cả các trang đều hiển thị cùng 1 title:"
echo "  ❌ Production đang serve static files"
echo "  ➜ Cần deploy Node.js server (xem DEPLOYMENT_GUIDE.md)"
echo ""
echo "Nếu mỗi trang có title khác nhau:"
echo "  ✅ Node.js server đang chạy đúng"
echo "  ➜ Chỉ cần clear social media cache"
echo "================================================"
