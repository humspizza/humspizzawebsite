import { db } from "./db";
import { aboutContent } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedAboutContent() {
  try {
    // Check if about content already exists
    const existing = await db.select().from(aboutContent).where(eq(aboutContent.isActive, true)).limit(1);
    
    if (existing.length === 0) {
      // Create default about content
      await db.insert(aboutContent).values({
        // Hero section
        heroTitle: "About Hum's Pizza",
        heroTitleVi: "Giới Thiệu Hum's Pizza", 
        heroSubtitle: "Where authentic Vietnamese flavors meet modern culinary artistry, creating memorable experiences for every family through exceptional food and warm service.",
        heroSubtitleVi: "Nơi pizza thủ công gặp gỡ linh hồn Việt Nam, tạo nên những kỷ niệm ấm áp cho mọi gia đình thông qua món ăn ngon và dịch vụ tận tâm.",
        
        // Story section
        storyTitle: "Our Story",
        storyTitleVi: "Câu Chuyện Của Chúng Tôi",
        storyContent: "Hum's Pizza began from a small shop in Binh Duong, where everything is built with passion and dedication to connecting hearts through authentic Vietnamese taste. Our team spent time researching traditional Vietnamese flavors and combining them with modern culinary techniques to create unique pizza experiences that resonate with Vietnamese palates.\n\nFrom the beginning, our team was committed to using high-quality ingredients so customers can feel the difference and easily distinguish the characteristics of each pizza. Never stopping at just one delicious pizza, Hum's Pizza aspires to become a place where every customer can enjoy a complete culinary experience.",
        storyContentVi: "Hum's Pizza bắt đầu từ một cửa hàng nhỏ tại Bình Dương, nơi mọi thứ được xây dựng từ sự đam mê và tình thần thủ công. Đội ngũ không chỉ học hỏi kỹ thuật làm pizza truyền thống từ Chicago hay Ý, mà còn dành thời gian nghiên cứu để điều chỉnh hương vị phù hợp với khẩu vị người Việt.\n\nTừ phần sốt, lớp nhân cho đến cách phục vụ đều được cân nhắc kỹ lưỡng để khách hàng cảm thấy gần gũi và dễ thưởng thức. Không dừng ở chỉ là một chiếc pizza ngon, Hum's Pizza còn mong muốn trở thành điểm dừng chân lý tưởng.",
        storyImageUrl: "https://images.unsplash.com/photo-1583394293214-28ded15ee548?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80",
        
        // Statistics
        statsRecipes: "10+",
        statsServed: "5K+", 
        statsFresh: "100%",
        statsSatisfaction: "95%",
        statsRecipesLabel: "Special Pizza Recipes",
        statsRecipesLabelVi: "Công Thức Pizza Đặc Biệt",
        statsServedLabel: "Vietnamese-Style Pizzas Served",
        statsServedLabelVi: "Pizza Thủ Công Đã Phục Vụ",
        statsFreshLabel: "Fresh Dough Daily",
        statsFreshLabelVi: "Bột Pizza Tươi Mỗi Ngày",
        statsSatisfactionLabel: "Customer Satisfaction",
        statsSatisfactionLabelVi: "Khách Hàng Hài Lòng",
        
        // Philosophy section
        visionTitle: "Vision",
        visionTitleVi: "Tầm Nhìn",
        visionContent: "Hum's Pizza wants to build a chain of Vietnamese pizza restaurants, achieving international standards but still maintaining the essence of traditional Vietnamese culture and cuisine.",
        visionContentVi: "Hum's Pizza muốn xây dựng một chuỗi nhà hàng pizza của người Việt, đạt tiêu chuẩn quốc tế nhưng vẫn giữ được tinh thần văn hóa vàẩm thực truyền thống rất riêng.",
        
        missionTitle: "Mission", 
        missionTitleVi: "Sứ Mệnh",
        missionContent: "Making pizza by hand with premium ingredients, stable flavors and seafood dishes and attentive service. Creating experiences from simple dishes, creating flavors, creating expectations that come from the simple taste experience of a piece of delicious pizza.",
        missionContentVi: "Làm pizza thủ công với chất lượng ôn định, hương vị hài hòa và phục vụ tận tâm. Tạo ra trải nghiệm từ mỗi hương vị, tạo ra sự kỳ vọng đến từ những điều đơn giản như một chiếc pizza ngon.",
        
        valuesTitle: "Core Values",
        valuesTitleVi: "Giá Trị Cốt Lõi", 
        valuesContent: "We believe in connecting hearts through authentic Vietnamese taste, dedication in every meal and creating memorable experiences that customers remember. Every dish we serve must bring smiles to our diners and create unforgettable moments through exceptional but delicious meals.",
        valuesContentVi: "Chúng tôi tin vào chất lượng thủ công, sự tận tâm trong từng món ăn và tạo ra không gian ấm cúng nơi mọi gia đình có thể cũng nhau nếm những khoảnh khắc đáng nhớ qua bữa ăn ngon.",
        
        // Team section
        teamTitle: "Meet the Team",
        teamTitleVi: "Gặp Gỡ Đội Ngũ",
        
        // Team members
        member1Name: "Hùng Nguyễn",
        member1Title: "Head Chef & Founder",
        member1TitleVi: "Bếp Trưởng & Người Sáng Lập",
        member1Description: "With over 10 years of pizza-making experience, Hùng has trained and perfected the craft to create authentic pizza recipes while preserving traditional techniques combined with Vietnamese tastes.",
        member1DescriptionVi: "Với hơn 10 năm kinh nghiệm làm pizza, Hùng đã nghiên cứu và điều chỉnh công thức để tạo ra những chiếc pizza vừa giữ được tính thủy truyền thống vừa phù hợp với khẩu vị Việt Nam.",
        member1ImageUrl: "https://images.unsplash.com/photo-1583394293214-28ded15ee548?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80",
        
        member2Name: "Mai Phương", 
        member2Title: "Restaurant Manager",
        member2TitleVi: "Quản Lý Nhà Hàng",
        member2Description: "Mai ensures every customer has a wonderful experience. She's always attentive to feedback and constantly improves service quality to create a cozy atmosphere for all families.",
        member2DescriptionVi: "Mai đảm bảo mỗi khách hàng đều có trải nghiệm tuyệt vời với nhà hàng. Cô luôn lắng nghe phản hồi và liên tục cải thiện chất lượng dịch vụ để tạo ra không gian ấm cúng cho mọi gia đình.",
        member2ImageUrl: "https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80",
        
        member3Name: "Tuấn Anh",
        member3Title: "Pizza Specialist", 
        member3TitleVi: "Chuyên Gia Bột Pizza",
        member3Description: "Tuấn takes responsibility for dough-making process daily. He ensures every pizza has a perfectly soft crust and distinct flavor characteristic of authentic Vietnamese-style pizza.",
        member3DescriptionVi: "Tuấn chịu trách nhiệm về quy trình làm bột và ủ bột hàng ngày. Anh đảm bảo mỗi chiếc pizza đều có độ giòn rùm, mềm mại và hương vị đặc trưng của pizza thủ công.",
        member3ImageUrl: "https://images.unsplash.com/photo-1607631568010-0666c8deb6b4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80",
        
        isActive: true
      });
      
      console.log('✓ About content seeded');
    } else {
      console.log('✓ About content already exists');
    }
  } catch (error) {
    console.error('Error seeding about content:', error);
  }
}