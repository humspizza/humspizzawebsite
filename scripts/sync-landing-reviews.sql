-- Delete existing sample reviews first
DELETE FROM customer_reviews;

-- Insert reviews from landing page
INSERT INTO customer_reviews (
  id, customer_name, customer_name_vi, customer_title, customer_title_vi, 
  rating, review, review_vi, avatar_url, is_published, is_pinned, display_order
) VALUES 
(
  'review-landing-1',
  'Minh Duc', 
  'Anh Minh Đức',
  'Customer',
  'Khách hàng',
  5,
  'Luxurious atmosphere, excellent food. Especially loved the Kobe beef pho and grilled bread with chili salt. Will definitely return!',
  'Không gian sang trọng, món ăn tuyệt vời. Đặc biệt thích món phở bò kobe và bánh mì nướng muối ớt. Sẽ quay lại nhiều lần!',
  '👨🏻‍💼',
  true,
  true,
  1
),
(
  'review-landing-2',
  'Lan Anh',
  'Chị Lan Anh',
  'Customer',
  'Khách hàng', 
  5,
  'Attentive service, delicious food. The truffle mushroom rice rolls are very unique. Quiet atmosphere perfect for business dinners.',
  'Dịch vụ tận tâm, thức ăn ngon miệng. Món bánh cuốn nấm truffle rất độc đáo. Không gian yên tĩnh thích hợp cho business dinner.',
  '👩🏻‍💼',
  true,
  true,
  2
),
(
  'review-landing-3',
  'Hoang Nam',
  'Anh Hoàng Nam',
  'Customer',
  'Khách hàng',
  5,
  'First time having Vietnamese fusion like this. The grilled salmon noodle soup is indescribably delicious. Very talented chef!',
  'Lần đầu ăn món Việt fusion kiểu này. Bún chả cá hồi nướng ngon không tả được. Đầu bếp rất có tài!',
  '👨🏻',
  true,
  false,
  3
),
(
  'review-landing-4',
  'Ms. Sarah Johnson',
  'Ms. Sarah Johnson',
  'Customer',
  'Khách hàng',
  5,
  'Amazing! First time experiencing authentic Vietnamese cuisine like this. Very friendly staff and clear English menu.',
  'Tuyệt vời! Lần đầu thưởng thức ẩm thực Việt Nam authentic như vậy. Staff rất thân thiện và menu có tiếng Anh rõ ràng.',
  '👱🏼‍♀️',
  true,
  false,
  4
),
(
  'review-landing-5',
  'Tho Family',
  'Gia đình Thọ',
  'Customer',
  'Khách hàng',
  5,
  'Brought family for weekend dinner. Everyone was satisfied, especially the kids loved the Thang Long fish cakes. Will book again!',
  'Đưa gia đình đến ăn cuối tuần. Cả nhà đều hài lòng, đặc biệt các cháu thích món chả cá thăng long. Sẽ book lại!',
  '👨‍👩‍👧‍👦',
  true,
  false,
  5
),
(
  'review-landing-6',
  'David Chen',
  'Anh David Chen',
  'Customer',
  'Khách hàng',
  5,
  'Five-star service quality. The Nha Trang grilled spring rolls and cocktails were very impressive. Definitely recommend!',
  'Chất lượng phục vụ 5 sao. Món nem nướng Nha Trang và cocktail đều rất ấn tượng. Definitely recommend!',
  '👨🏻‍🦱',
  true,
  false,
  6
);