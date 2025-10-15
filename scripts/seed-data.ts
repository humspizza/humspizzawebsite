import { db } from "../server/db";
import { categories, menuItems, blogPosts, users } from "../shared/schema";

async function seedData() {
  console.log("🌱 Seeding database with sample data...");

  try {
    // Clear existing data
    await db.delete(menuItems);
    await db.delete(blogPosts);
    await db.delete(categories);

    // Insert categories
    const categoryData = [
      {
        name: "Appetizers",
        nameVi: "Món Khai Vị",
        description: "Start your culinary journey with our exquisite appetizers",
        sortOrder: 1,
      },
      {
        name: "Main Courses",
        nameVi: "Món Chính",
        description: "Signature dishes that showcase Vietnamese culinary artistry",
        sortOrder: 2,
      },
      {
        name: "Desserts",
        nameVi: "Món Tráng Miệng",
        description: "Sweet endings to your dining experience",
        sortOrder: 3,
      },
      {
        name: "Tea Selection",
        nameVi: "Trà Cao Cấp",
        description: "Premium Vietnamese and international teas",
        sortOrder: 4,
      },
    ];

    const insertedCategories = await db.insert(categories).values(categoryData).returning();
    console.log("✅ Categories seeded successfully");

    // Insert menu items
    const menuItemsData = [
      // Appetizers
      {
        name: "Golden Spring Rolls",
        nameVi: "Chả Giò Vàng",
        description: "Crispy spring rolls filled with shrimp, pork, and vegetables, served with nuoc cham dipping sauce",
        descriptionVi: "Chả giò giòn tan với tôm, thịt heo và rau củ, kèm nước chấm truyền thống",
        price: "18.00",
        imageUrl: "https://images.unsplash.com/photo-1563379091339-03246963d675?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        categoryId: insertedCategories[0].id,
        isAvailable: true,
        tags: ["signature", "crispy", "traditional"],
      },
      {
        name: "Fresh Summer Rolls",
        nameVi: "Gỏi Cuốn Tươi",
        description: "Delicate rice paper rolls with prawns, herbs, and vermicelli, served with peanut dipping sauce",
        descriptionVi: "Bánh tráng cuốn tôm thịt với rau thơm tươi, kèm nước chấm đậu phộng",
        price: "16.00",
        imageUrl: "https://images.unsplash.com/photo-1559847844-d721426d6edc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        categoryId: insertedCategories[0].id,
        isAvailable: true,
        tags: ["fresh", "healthy", "gluten-free"],
      },
      {
        name: "Beef Carpaccio Vietnamese Style",
        nameVi: "Thịt Bò Tái Kiểu Việt",
        description: "Thinly sliced beef with Vietnamese herbs, peanuts, and lime dressing",
        descriptionVi: "Thịt bò thái mỏng với rau thơm Việt Nam, đậu phộng và nước mắm chanh",
        price: "22.00",
        imageUrl: "https://images.unsplash.com/photo-1559847844-5315695dadae?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        categoryId: insertedCategories[0].id,
        isAvailable: true,
        tags: ["premium", "raw", "herbs"],
      },

      // Main Courses
      {
        name: "Pho Bo Premium",
        nameVi: "Phở Bò Đặc Biệt",
        description: "Aromatic beef pho with wagyu slices, bone marrow, and 24-hour slow-cooked broth",
        descriptionVi: "Phở bò thơm nức với thịt wagyu, tủy xương và nước dùng ninh 24 tiếng",
        price: "28.00",
        imageUrl: "https://images.unsplash.com/photo-1583394838336-acd977736f90?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        categoryId: insertedCategories[1].id,
        isAvailable: true,
        tags: ["signature", "premium", "wagyu"],
      },
      {
        name: "Grilled Lemongrass Beef",
        nameVi: "Bò Nướng Sả",
        description: "Charcoal-grilled beef marinated in lemongrass and spices, served with jasmine rice",
        descriptionVi: "Thịt bò nướng than hoa ướp sả và gia vị, kèm cơm dẻo",
        price: "32.00",
        imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        categoryId: insertedCategories[1].id,
        isAvailable: true,
        tags: ["grilled", "aromatic", "traditional"],
      },
      {
        name: "Clay Pot Fish with Caramel Sauce",
        nameVi: "Cá Kho Tộ",
        description: "Fresh fish braised in clay pot with caramel sauce, galangal, and coconut water",
        descriptionVi: "Cá tươi kho tộ với nước màu, riềng và nước dừa thơm ngon",
        price: "26.00",
        imageUrl: "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        categoryId: insertedCategories[1].id,
        isAvailable: true,
        tags: ["clay-pot", "sweet-savory", "coconut"],
      },
      {
        name: "Whole Roasted Duck",
        nameVi: "Vịt Quay Nguyên Con",
        description: "Five-spice roasted duck served with pancakes, cucumber, and hoisin sauce",
        descriptionVi: "Vịt quay ngũ vị thơm, kèm bánh tráng, dưa chuột và tương đen",
        price: "45.00",
        imageUrl: "https://images.unsplash.com/photo-1551218808-94e220e084d2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        categoryId: insertedCategories[1].id,
        isAvailable: true,
        tags: ["premium", "whole-duck", "five-spice"],
      },

      // Desserts
      {
        name: "Vietnamese Coffee Tiramisu",
        nameVi: "Tiramisu Cà Phê Việt",
        description: "Classic tiramisu infused with Vietnamese drip coffee and condensed milk",
        descriptionVi: "Tiramisu truyền thống pha chế với cà phê phin Việt Nam và sữa đặc",
        price: "14.00",
        imageUrl: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        categoryId: insertedCategories[2].id,
        isAvailable: true,
        tags: ["coffee", "fusion", "creamy"],
      },
      {
        name: "Coconut Panna Cotta",
        nameVi: "Panna Cotta Dừa",
        description: "Silky coconut panna cotta with tropical fruit compote and toasted coconut flakes",
        descriptionVi: "Panna cotta dừa mịn màng với compote trái cây nhiệt đới và dừa nạo rang",
        price: "12.00",
        imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        categoryId: insertedCategories[2].id,
        isAvailable: true,
        tags: ["coconut", "silky", "tropical"],
      },

      // Tea Selection
      {
        name: "Premium Oolong Tea",
        nameVi: "Trà Ô Long Cao Cấp",
        description: "Finest Vietnamese oolong tea with complex floral notes and natural sweetness",
        descriptionVi: "Trà ô long Việt Nam cao cấp với hương hoa tinh tế và vị ngọt tự nhiên",
        price: "8.00",
        imageUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        categoryId: insertedCategories[3].id,
        isAvailable: true,
        tags: ["premium", "floral", "traditional"],
      },
      {
        name: "Jasmine Green Tea",
        nameVi: "Trà Xanh Hoa Nhài",
        description: "Delicate green tea scented with fresh jasmine flowers, served in traditional teapot",
        descriptionVi: "Trà xanh thơm nhẹ với hoa nhài tươi, phục vụ trong ấm trà truyền thống",
        price: "6.00",
        imageUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        categoryId: insertedCategories[3].id,
        isAvailable: true,
        tags: ["jasmine", "green-tea", "aromatic"],
      },
    ];

    await db.insert(menuItems).values(menuItemsData);
    console.log("✅ Menu items seeded successfully");

    // Insert blog posts
    const blogPostsData = [
      {
        title: "The Art of Vietnamese Pho: A Culinary Journey",
        titleVi: "Nghệ Thuật Nấu Phở Việt Nam: Hành Trình Ẩm Thực",
        excerpt: "Discover the secrets behind our signature pho, from selecting the finest bones to achieving the perfect balance of spices in our 24-hour broth.",
        excerptVi: "Khám phá bí mật đằng sau tô phở đặc trưng của chúng tôi, từ việc chọn xương tốt nhất đến cân bằng hoàn hảo các loại gia vị trong nước dùng 24 tiếng.",
        content: "The art of making authentic Vietnamese pho is a testament to patience, tradition, and culinary expertise. At Noir Cuisine, we honor this ancient craft while elevating it to new heights...",
        contentVi: "Nghệ thuật nấu phở Việt Nam chính gốc là minh chứng cho sự kiên nhẫn, truyền thống và chuyên môn ẩm thực. Tại Noir Cuisine, chúng tôi tôn vinh nghề thủ công cổ xưa này...",
        imageUrl: "https://images.unsplash.com/photo-1583394838336-acd977736f90?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
        published: true,
      },
      {
        title: "Seasonal Menu: Spring Harvest Collection",
        titleVi: "Thực Đơn Theo Mùa: Bộ Sưu Tập Mùa Xuân",
        excerpt: "Experience the freshness of spring with our new seasonal menu featuring the finest local ingredients and traditional Vietnamese cooking techniques.",
        excerptVi: "Trải nghiệm sự tươi mới của mùa xuân với thực đơn theo mùa mới của chúng tôi, với những nguyên liệu địa phương tốt nhất và kỹ thuật nấu ăn truyền thống Việt Nam.",
        content: "Spring brings renewal and fresh beginnings, and our kitchen celebrates this season with a carefully curated menu that showcases the best of Vietnamese cuisine...",
        contentVi: "Mùa xuân mang đến sự đổi mới và khởi đầu tươi mới, và nhà bếp của chúng tôi chào mừng mùa này với thực đơn được tuyển chọn kỹ lưỡng...",
        imageUrl: "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
        published: true,
      },
      {
        title: "Behind the Scenes: Meet Chef Minh's Culinary Philosophy",
        titleVi: "Hậu Trường: Gặp Gỡ Triết Lý Ẩm Thực Của Đầu Bếp Minh",
        excerpt: "Get an intimate look into the mind of our executive chef and discover how traditional Vietnamese values shape our modern culinary approach.",
        excerptVi: "Có cái nhìn sâu sắc về tâm hồn của đầu bếp trưởng và khám phá cách các giá trị truyền thống Việt Nam định hình phương pháp ẩm thực hiện đại của chúng tôi.",
        content: "Chef Minh's journey from the streets of Saigon to the refined dining rooms of Noir Cuisine is a story of passion, dedication, and unwavering commitment to culinary excellence...",
        contentVi: "Hành trình của Đầu bếp Minh từ những con phố Sài Gòn đến phòng ăn sang trọng của Noir Cuisine là câu chuyện về đam mê, sự cống hiến và cam kết không lay chuyển...",
        imageUrl: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
        published: true,
      },
    ];

    await db.insert(blogPosts).values(blogPostsData);
    console.log("✅ Blog posts seeded successfully");

    // Create admin and staff users (with conflict handling)
    try {
      await db.insert(users).values([
        {
          username: "admin",
          email: "admin@noircuisine.vn",
          password: "admin123", // In real app, this should be hashed
          role: "admin",
          fullName: "Administrator",
          isActive: true,
        },
        {
          username: "staff",
          email: "staff@noircuisine.vn",
          password: "staff123", // In real app, this should be hashed
          role: "staff",
          fullName: "Staff Member",
          permissions: ["view_orders", "view_reservations"],
          isActive: true,
        }
      ]);
      console.log("✅ Users seeded successfully");
    } catch (error: any) {
      if (error.code === '23505') {
        console.log("✅ Users already exist, skipping user creation");
      } else {
        throw error;
      }
    }

    console.log("🎉 Database seeding completed successfully!");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run the seed function
seedData()
  .then(() => {
    console.log("Seeding completed, exiting...");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });