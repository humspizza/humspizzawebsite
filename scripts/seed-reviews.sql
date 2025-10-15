-- Insert sample customer reviews
INSERT INTO customer_reviews (
  id, customer_name, customer_name_vi, customer_title, customer_title_vi, 
  rating, review, review_vi, avatar_url, is_published, is_pinned, display_order
) VALUES 
(
  'review-1', 
  'Anh Minh Duc', 
  'Anh Minh Đức', 
  'Customer', 
  'Khách hàng',
  5,
  'Excellent service and authentic Vietnamese cuisine. The pho was perfect!',
  'Không gian sang trọng, món ăn tuyệt vời. Đặc biệt thích món phở bo kobe và bánh mì nướng muối ớt. Sẽ quay lại nhiều lần!',
  null,
  true,
  true,
  1
),
(
  'review-2',
  'Chi Lan Anh',
  'Chị Lan Anh', 
  'Food Blogger',
  'Khách hàng',
  5,
  'Amazing dining experience! Perfect for business dinner.',
  'Dịch vụ tận tâm, thức ăn ngon miệng. Món bánh cuốn nấm truffle rất độc đáo. Không gian yên tĩnh thích hợp cho business dinner.',
  null,
  true,
  true,
  2
),
(
  'review-3',
  'Anh Hoang Nam',
  'Anh Hoàng Nam',
  'Customer', 
  'Khách hàng',
  5,
  'First time trying Vietnamese fusion like this. Beef was incredible!',
  'Lần đầu ăn món Việt fusion kiểu này. Bún chả cá hỏi nướng ngon khong tả được. Đậu bếp rất có tài!',
  null,
  true,
  false,
  3
),
(
  'review-4',
  'Mrs. Sarah Johnson',
  null,
  'Travel Blogger',
  null,
  5,
  'Outstanding Vietnamese food. Staff very friendly and menu has great variety.',
  'Tuyệt vời! Lần đầu thường thức ẩm thức Việt Nam authentic như vậy. Staff rất thân thiện và menu có nhiều lựa chọn đa dạng.',
  null,
  true,
  false,
  4
),
(
  'review-5',
  'David Chen',
  null,
  'Food Enthusiast', 
  null,
  4,
  'Great atmosphere and delicious food. The spring rolls were fresh and flavorful.',
  'Đưa gia đình đến ăn cuối tuần. Cả nhà đều hài lòng, đặc biệt các cháu thích món chả thịch và cocktail đêu rất ấn tượng. Definitely returning!',
  null,
  true,
  false,
  5
);