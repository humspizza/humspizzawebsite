import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedUsers() {
  try {
    // Check if admin user exists
    const existingAdmin = await db.select().from(users).where(eq(users.username, 'admin')).limit(1);
    
    if (existingAdmin.length === 0) {
      // Create admin user
      await db.insert(users).values({
        username: 'admin',
        email: 'admin@humpizza.com',
        password: 'admin123',
        role: 'admin',
        fullName: 'Quản Trị Viên',
        permissions: ['all'],
        isActive: true
      });
      console.log('✓ Admin user created');
    }

    // Check if staff user exists
    const existingStaff = await db.select().from(users).where(eq(users.username, 'staff')).limit(1);
    
    if (existingStaff.length === 0) {
      // Create staff user
      await db.insert(users).values({
        username: 'staff',
        email: 'staff@humpizza.com',
        password: 'staff123',
        role: 'staff',
        fullName: 'Nhân Viên',
        permissions: ['orders', 'reservations', 'menu', 'contact'],
        isActive: true
      });
      console.log('✓ Staff user created');
    }

    console.log('✓ User seeding completed');
  } catch (error) {
    console.error('Error seeding users:', error);
  }
}

// This function is called from index.ts
// No need for require.main check in ES modules