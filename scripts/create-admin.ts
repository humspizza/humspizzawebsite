import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function createAdminUser() {
  console.log("🔐 Creating admin user...");

  try {
    // Check if admin already exists
    const existingAdmin = await db.select().from(users).where(eq(users.username, "admin"));
    
    if (existingAdmin.length > 0) {
      console.log("✅ Admin user already exists");
      console.log("Username: admin");
      console.log("Password: admin123");
      return;
    }

    // Create admin user with simple password (for demo purposes)
    const adminUser = {
      username: "admin",
      email: "admin@noirecuisine.com",
      password: "admin123", // In production, this should be hashed
      role: "admin"
    };

    const [newAdmin] = await db.insert(users).values(adminUser).returning();
    
    console.log("✅ Admin user created successfully!");
    console.log("Username: admin");
    console.log("Password: admin123");
    console.log("Email: admin@noirecuisine.com");
    console.log("\n🌐 You can now access the dashboard at: /admin/login");

  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    throw error;
  }
}

// Run the function
createAdminUser()
  .then(() => {
    console.log("Admin creation completed, exiting...");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Admin creation failed:", error);
    process.exit(1);
  });