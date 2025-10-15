import { 
  users, categories, menuItems, menuItemCustomizationSchemas, reservations, orders, blogPosts, contactMessages,
  thirdPartyBookings, integrationSettings, customerReviews, customizationSchemas, aboutContent, homeContent,
  ordersArchive, reservationsArchive, notifications, pageSeo,
  type User, type InsertUser, type Category, type InsertCategory, 
  type MenuItem, type InsertMenuItem, type Reservation, type InsertReservation,
  type Order, type InsertOrder, type BlogPost, type InsertBlogPost,
  type ContactMessage, type InsertContactMessage, type ThirdPartyBooking,
  type InsertThirdPartyBooking, type IntegrationSetting, type InsertIntegrationSetting,
  type CustomerReview, type InsertCustomerReview, type CustomizationSchema, type InsertCustomizationSchema,
  type AboutContent, type InsertAboutContent, type HomeContent, type InsertHomeContent,
  type Notification, type InsertNotification, type PageSeo, type InsertPageSeo
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, like, or, lt, ne, sql, inArray, count } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, updateData: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;

  // Menu Items
  getMenuItems(includeUnavailable?: boolean, categoryId?: string): Promise<MenuItem[]>;
  getMenuItem(id: string): Promise<MenuItem | undefined>;
  searchMenuItems(query: string): Promise<MenuItem[]>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: string, updates: Partial<InsertMenuItem>): Promise<MenuItem>;
  getMenuItemCustomizationSchemas(menuItemId: string): Promise<CustomizationSchema[]>;
  updateMenuItemCustomizationSchemas(menuItemId: string, schemaIds: string[]): Promise<CustomizationSchema[]>;
  
  // Reservations
  createReservation(reservation: InsertReservation): Promise<Reservation>;
  getReservations(): Promise<Reservation[]>;
  updateReservationStatus(id: string, status: string): Promise<Reservation>;
  updateReservation(id: string, updates: Partial<InsertReservation>): Promise<Reservation>;

  // Orders
  createOrder(order: InsertOrder): Promise<Order>;
  getOrders(): Promise<Order[]>;
  updateOrderStatus(id: string, status: string): Promise<Order>;
  updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order>;

  // Blog Posts
  getBlogPosts(published?: boolean): Promise<BlogPost[]>;
  getBlogPost(id: string): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: string, updates: Partial<InsertBlogPost>): Promise<BlogPost>;
  toggleBlogPostPin(id: string): Promise<BlogPost>;
  getPinnedBlogPosts(): Promise<BlogPost[]>;

  // Contact Messages
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  getContactMessages(): Promise<ContactMessage[]>;

  // Customer Reviews
  getCustomerReviews(published?: boolean): Promise<CustomerReview[]>;
  getCustomerReview(id: string): Promise<CustomerReview | undefined>;
  createCustomerReview(review: InsertCustomerReview): Promise<CustomerReview>;
  updateCustomerReview(id: string, updates: Partial<InsertCustomerReview>): Promise<CustomerReview>;
  deleteCustomerReview(id: string): Promise<void>;
  toggleReviewPin(id: string): Promise<CustomerReview>;
  getPublishedReviews(): Promise<CustomerReview[]>;

  // Customization Schemas
  getCustomizationSchemas(): Promise<CustomizationSchema[]>;
  getCustomizationSchema(id: string): Promise<CustomizationSchema | undefined>;
  createCustomizationSchema(schema: InsertCustomizationSchema): Promise<CustomizationSchema>;
  updateCustomizationSchema(id: string, updates: Partial<InsertCustomizationSchema>): Promise<CustomizationSchema>;
  deleteCustomizationSchema(id: string): Promise<void>;

  // About Content methods
  getAboutContent(): Promise<AboutContent | undefined>;
  createAboutContent(content: InsertAboutContent): Promise<AboutContent>;
  updateAboutContent(updates: Partial<InsertAboutContent>): Promise<AboutContent>;

  // Data Management
  archiveOldData(period: string): Promise<{ orders: number; reservations: number }>;
  getDataStatistics(): Promise<{
    totalOrders: number;
    oldOrders: number;
    totalReservations: number;
    oldReservations: number;
    estimatedSize: number;
  }>;
  
  // Backup & Restore
  createBackup(): Promise<any>;
  restoreFromBackup(backupData: any): Promise<void>;
  getBackupStats(): Promise<{
    totalTables: number;
    totalRecords: number;
    backupSize: number;
    createdAt: Date;
  }>;

  // Notifications
  getNotifications(isRead?: boolean): Promise<Notification[]>;
  getNotification(id: string): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<Notification>;
  markAllNotificationsAsRead(): Promise<void>;
  deleteNotification(id: string): Promise<void>;
  deleteAllNotifications(): Promise<void>;
  getUnreadNotificationCount(): Promise<number>;
  
  // Page SEO & Open Graph
  getPageSeo(pageKey: string, language: string): Promise<PageSeo | undefined>;
  getPageSeoWithFallback(pageKey: string, language: string): Promise<PageSeo | undefined>;
  listPageSeo(): Promise<PageSeo[]>;
  upsertPageSeo(pageSeo: InsertPageSeo): Promise<PageSeo>;
  updatePageSeo(pageKey: string, language: string, updates: Partial<InsertPageSeo>): Promise<PageSeo>;
  deletePageSeo(pageKey: string, language: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const updateData = { ...updates, updatedAt: new Date() };
    // Handle permissions array type properly
    if (updateData.permissions && Array.isArray(updateData.permissions)) {
      updateData.permissions = updateData.permissions.filter((p): p is string => typeof p === 'string');
    }
    const [user] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.sortOrder);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: string, updateData: Partial<InsertCategory>): Promise<Category> {
    const [updatedCategory] = await db.update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<void> {
    // Check if any menu items are using this category
    const menuItemsInCategory = await db.select().from(menuItems).where(eq(menuItems.categoryId, id));
    
    if (menuItemsInCategory.length > 0) {
      // Set categoryId to null for all items in this category
      // They will only appear in "All Items" view
      await db.update(menuItems)
        .set({ categoryId: null })
        .where(eq(menuItems.categoryId, id));
    }
    
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Menu Items
  async getMenuItems(includeUnavailable?: boolean, categoryId?: string): Promise<any[]> {
    let query = db.select({
      menu_items: menuItems,
      category: categories
    }).from(menuItems).leftJoin(categories, eq(menuItems.categoryId, categories.id));
    
    const conditions = [];
    
    if (!includeUnavailable) {
      conditions.push(eq(menuItems.isAvailable, true));
    }
    
    if (categoryId) {
      conditions.push(eq(menuItems.categoryId, categoryId));
    }
    
    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions)) as any;
    }
    
    return await query;
  }

  async getMenuItem(id: string): Promise<MenuItem | undefined> {
    const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id));
    return item || undefined;
  }

  async searchMenuItems(query: string): Promise<MenuItem[]> {
    const searchTerm = `%${query}%`;
    return await db.select().from(menuItems)
      .where(
        and(
          eq(menuItems.isAvailable, true),
          or(
            like(menuItems.name, searchTerm),
            like(menuItems.description, searchTerm),
            like(menuItems.nameVi, searchTerm),
            like(menuItems.descriptionVi, searchTerm)
          )
        )
      );
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    const [newItem] = await db.insert(menuItems).values(item).returning();
    return newItem;
  }

  async updateMenuItem(id: string, updates: Partial<InsertMenuItem>): Promise<MenuItem> {
    const [updatedItem] = await db.update(menuItems)
      .set(updates as any)
      .where(eq(menuItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteMenuItem(id: string): Promise<void> {
    await db.delete(menuItems).where(eq(menuItems.id, id));
  }

  async toggleMenuItemPin(id: string): Promise<MenuItem> {
    const item = await this.getMenuItem(id);
    if (!item) throw new Error('Menu item not found');
    
    const [updated] = await db.update(menuItems)
      .set({ 
        isPinned: !item.isPinned,
        pinnedAt: !item.isPinned ? new Date() : null,
      })
      .where(eq(menuItems.id, id))
      .returning();
    return updated;
  }

  async getPinnedMenuItems(): Promise<any[]> {
    return await db.select({
        menu_items: menuItems,
        categories: categories
      })
      .from(menuItems)
      .leftJoin(categories, eq(menuItems.categoryId, categories.id))
      .where(eq(menuItems.isPinned, true))
      .orderBy(desc(menuItems.pinnedAt));
  }

  async getMenuItemCustomizationSchemas(menuItemId: string): Promise<CustomizationSchema[]> {
    const schemas = await db.select({
        schema: customizationSchemas
      })
      .from(menuItemCustomizationSchemas)
      .innerJoin(customizationSchemas, eq(menuItemCustomizationSchemas.customizationSchemaId, customizationSchemas.id))
      .where(eq(menuItemCustomizationSchemas.menuItemId, menuItemId))
      .orderBy(menuItemCustomizationSchemas.sortOrder);
    
    return schemas.map(s => s.schema);
  }

  async updateMenuItemCustomizationSchemas(menuItemId: string, schemaIds: string[]): Promise<CustomizationSchema[]> {
    return await db.transaction(async (tx) => {
      // Validate that all schema IDs exist before proceeding
      if (schemaIds.length > 0) {
        const existingSchemas = await tx.select({ id: customizationSchemas.id })
          .from(customizationSchemas)
          .where(inArray(customizationSchemas.id, schemaIds));
        
        const existingIds = existingSchemas.map(s => s.id);
        const invalidIds = schemaIds.filter(id => !existingIds.includes(id));
        
        if (invalidIds.length > 0) {
          throw new Error(`invalid schema IDs: ${invalidIds.join(', ')}`);
        }
      }
      
      // Delete existing associations within transaction
      await tx.delete(menuItemCustomizationSchemas)
        .where(eq(menuItemCustomizationSchemas.menuItemId, menuItemId));
      
      // Insert new associations within transaction
      if (schemaIds.length > 0) {
        const associations = schemaIds.map((schemaId, index) => ({
          menuItemId,
          customizationSchemaId: schemaId,
          sortOrder: index,
          isRequired: false
        }));
        
        await tx.insert(menuItemCustomizationSchemas).values(associations);
      }
      
      // Clear legacy field when using multiple schemas
      if (schemaIds.length > 1) {
        await tx.update(menuItems)
          .set({ customizationSchemaId: null })
          .where(eq(menuItems.id, menuItemId));
      } else if (schemaIds.length === 1) {
        // Keep legacy field in sync for backward compatibility
        await tx.update(menuItems)
          .set({ customizationSchemaId: schemaIds[0] })
          .where(eq(menuItems.id, menuItemId));
      } else {
        // Clear legacy field when no schemas
        await tx.update(menuItems)
          .set({ customizationSchemaId: null })
          .where(eq(menuItems.id, menuItemId));
      }
      
      // Return updated schemas within transaction context
      const schemas = await tx.select({
          schema: customizationSchemas
        })
        .from(menuItemCustomizationSchemas)
        .innerJoin(customizationSchemas, eq(menuItemCustomizationSchemas.customizationSchemaId, customizationSchemas.id))
        .where(eq(menuItemCustomizationSchemas.menuItemId, menuItemId))
        .orderBy(menuItemCustomizationSchemas.sortOrder);
      
      return schemas.map(s => s.schema);
    });
  }

  // Reservations
  async createReservation(reservation: InsertReservation): Promise<Reservation> {
    const [newReservation] = await db.insert(reservations).values(reservation).returning();
    return newReservation;
  }

  async getReservations(): Promise<Reservation[]> {
    return await db.select().from(reservations).orderBy(desc(reservations.createdAt));
  }

  async updateReservationStatus(id: string, status: string): Promise<Reservation> {
    const [updatedReservation] = await db.update(reservations)
      .set({ status })
      .where(eq(reservations.id, id))
      .returning();
    return updatedReservation;
  }

  async updateReservation(id: string, updates: Partial<InsertReservation>): Promise<Reservation> {
    const [updatedReservation] = await db.update(reservations)
      .set(updates)
      .where(eq(reservations.id, id))
      .returning();
    return updatedReservation;
  }

  // Orders
  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const [updatedOrder] = await db.update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order> {
    // Handle items array type properly
    const updateData = { ...updates };
    if (updateData.items && Array.isArray(updateData.items)) {
      updateData.items = updateData.items as any;
    }
    const [updatedOrder] = await db.update(orders)
      .set(updateData as any)
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  // Blog Posts
  async getBlogPosts(published = true): Promise<BlogPost[]> {
    if (published !== undefined) {
      return await db.select().from(blogPosts)
        .where(eq(blogPosts.published, published))
        .orderBy(desc(blogPosts.createdAt));
    }
    return await db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
  }

  async getBlogPost(id: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return post || undefined;
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts)
      .where(or(eq(blogPosts.slug, slug), eq(blogPosts.slugVi, slug)));
    return post || undefined;
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const [newPost] = await db.insert(blogPosts).values([post]).returning();
    return newPost;
  }

  async updateBlogPost(id: string, updates: Partial<InsertBlogPost>): Promise<BlogPost> {
    const [updatedPost] = await db.update(blogPosts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(blogPosts.id, id))
      .returning();
    return updatedPost;
  }

  async deleteBlogPost(id: string): Promise<void> {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
  }

  async toggleBlogPostPin(id: string): Promise<BlogPost> {
    const post = await this.getBlogPost(id);
    if (!post) throw new Error('Blog post not found');
    
    const newPinnedStatus = !post.pinned;
    let updateData: any = { 
      pinned: newPinnedStatus,
      updatedAt: new Date(),
    };

    // If pinning a post, find the first available pin_order slot (1-4)
    if (newPinnedStatus) {
      const pinnedPosts = await this.getPinnedBlogPosts();
      const usedOrders = pinnedPosts.map(p => p.pinOrder).filter((order): order is number => order != null).sort((a, b) => a - b);
      
      // Find first available slot from 1-4
      let nextOrder = 1;
      for (let i = 1; i <= 4; i++) {
        if (!usedOrders.includes(i)) {
          nextOrder = i;
          break;
        }
      }
      
      updateData.pinOrder = nextOrder;
    } else {
      // If unpinning, reset pin_order to 0 
      updateData.pinOrder = 0;
    }
    
    const [updated] = await db.update(blogPosts)
      .set(updateData)
      .where(eq(blogPosts.id, id))
      .returning();
    return updated;
  }

  async getPinnedBlogPosts(): Promise<BlogPost[]> {
    return await db.select().from(blogPosts)
      .where(eq(blogPosts.pinned, true))
      .orderBy(desc(blogPosts.updatedAt));
  }

  // User authentication and management
  async authenticateUser(username: string, password: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    if (user && user.password === password) {
      return user;
    }
    return undefined;
  }

  async createStaffUser(userData: Partial<InsertUser>): Promise<User> {
    const userValues = {
      ...userData,
      role: 'staff' as const,
      isActive: true,
    } as InsertUser;
    const [user] = await db.insert(users).values(userValues).returning();
    return user;
  }

  async updateUserStatus(id: string, isActive: boolean): Promise<User> {
    const [user] = await db.update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Third-party booking integrations
  async getThirdPartyBookings(): Promise<ThirdPartyBooking[]> {
    return await db.select().from(thirdPartyBookings).orderBy(desc(thirdPartyBookings.createdAt));
  }

  async createThirdPartyBooking(booking: InsertThirdPartyBooking): Promise<ThirdPartyBooking> {
    const [newBooking] = await db.insert(thirdPartyBookings).values(booking).returning();
    return newBooking;
  }

  async syncThirdPartyBookings(platform: string, settings: IntegrationSetting): Promise<number> {
    // This would integrate with actual third-party APIs
    // For now, return a mock count
    return 0;
  }

  // Integration settings
  async getIntegrationSettings(platform: string): Promise<IntegrationSetting | undefined> {
    const [setting] = await db.select().from(integrationSettings).where(eq(integrationSettings.platform, platform));
    return setting;
  }

  async getAllIntegrationSettings(): Promise<IntegrationSetting[]> {
    return await db.select().from(integrationSettings);
  }

  async createIntegrationSetting(setting: InsertIntegrationSetting): Promise<IntegrationSetting> {
    const [newSetting] = await db.insert(integrationSettings).values(setting).returning();
    return newSetting;
  }

  async updateIntegrationSetting(platform: string, updates: Partial<InsertIntegrationSetting>): Promise<IntegrationSetting> {
    const [setting] = await db.update(integrationSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(integrationSettings.platform, platform))
      .returning();
    return setting;
  }

  // Contact Messages
  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const [newMessage] = await db.insert(contactMessages).values([message]).returning();
    return newMessage;
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    return await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
  }

  async updateContactMessageStatus(id: string, status: string): Promise<ContactMessage> {
    const [updatedMessage] = await db
      .update(contactMessages)
      .set({ status })
      .where(eq(contactMessages.id, id))
      .returning();
    
    if (!updatedMessage) {
      throw new Error("Contact message not found");
    }
    
    return updatedMessage;
  }

  async deleteContactMessage(id: string): Promise<void> {
    const result = await db.delete(contactMessages).where(eq(contactMessages.id, id));
    if (result.rowCount === 0) {
      throw new Error("Contact message not found");
    }
  }

  async deleteOrder(id: string): Promise<void> {
    const result = await db.delete(orders).where(eq(orders.id, id));
    if (result.rowCount === 0) {
      throw new Error("Order not found");
    }
  }

  async deleteReservation(id: string): Promise<void> {
    const result = await db.delete(reservations).where(eq(reservations.id, id));
    if (result.rowCount === 0) {
      throw new Error("Reservation not found");
    }
  }

  async cleanupOldContactMessages(): Promise<number> {
    // Delete messages older than 3 months that are not archived
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const result = await db
      .delete(contactMessages)
      .where(
        and(
          lt(contactMessages.createdAt, threeMonthsAgo),
          ne(contactMessages.status, 'archived')
        )
      );
    
    return result.rowCount || 0;
  }

  // Customer Reviews
  async getCustomerReviews(published?: boolean): Promise<CustomerReview[]> {
    const query = db.select().from(customerReviews);
    if (published !== undefined) {
      query.where(eq(customerReviews.isPublished, published));
    }
    return await query.orderBy(desc(customerReviews.isPinned), customerReviews.displayOrder, desc(customerReviews.createdAt));
  }

  async getCustomerReview(id: string): Promise<CustomerReview | undefined> {
    const [review] = await db.select().from(customerReviews).where(eq(customerReviews.id, id));
    return review || undefined;
  }

  async createCustomerReview(review: InsertCustomerReview): Promise<CustomerReview> {
    const [newReview] = await db.insert(customerReviews).values(review).returning();
    return newReview;
  }

  async updateCustomerReview(id: string, updates: Partial<InsertCustomerReview>): Promise<CustomerReview> {
    const [review] = await db.update(customerReviews)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(customerReviews.id, id))
      .returning();
    return review;
  }

  async deleteCustomerReview(id: string): Promise<void> {
    await db.delete(customerReviews).where(eq(customerReviews.id, id));
  }

  async toggleReviewPin(id: string): Promise<CustomerReview> {
    const review = await this.getCustomerReview(id);
    if (!review) throw new Error("Review not found");
    
    const [updatedReview] = await db.update(customerReviews)
      .set({ 
        isPinned: !review.isPinned,
        pinnedAt: !review.isPinned ? new Date() : null,
        updatedAt: new Date()
      })
      .where(eq(customerReviews.id, id))
      .returning();
    return updatedReview;
  }

  async getPublishedReviews(): Promise<CustomerReview[]> {
    return await db.select().from(customerReviews)
      .where(eq(customerReviews.isPublished, true))
      .orderBy(desc(customerReviews.isPinned), customerReviews.displayOrder, desc(customerReviews.createdAt));
  }

  // Data Management Methods
  async archiveOldData(period: string = '3months'): Promise<{ orders: number; reservations: number }> {
    const cutoffDate = new Date();
    
    switch (period) {
      case '3months':
        cutoffDate.setMonth(cutoffDate.getMonth() - 3);
        break;
      case '6months':
        cutoffDate.setMonth(cutoffDate.getMonth() - 6);
        break;
      case '1year':
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
        break;
      case '2years':
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 2);
        break;
      default:
        cutoffDate.setMonth(cutoffDate.getMonth() - 3);
    }

    // Find old completed records to archive
    const oldOrders = await db.select().from(orders).where(
      and(
        eq(orders.status, 'completed'),
        lt(orders.createdAt, cutoffDate)
      )
    );

    const oldReservations = await db.select().from(reservations).where(
      and(
        eq(reservations.status, 'completed'),
        lt(reservations.createdAt, cutoffDate)
      )
    );

    // Archive old orders
    for (const order of oldOrders) {
      // Copy to archive table
      await db.insert(ordersArchive).values({
        originalId: order.id,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        customerAddress: order.customerAddress,
        items: order.items,
        totalAmount: order.totalAmount,
        status: order.status,
        orderType: order.orderType,
        paymentMethod: order.paymentMethod,
        specialInstructions: order.specialInstructions,
        originalCreatedAt: order.createdAt,
      });
      
      // Delete from main table
      await db.delete(orders).where(eq(orders.id, order.id));
    }

    // Archive old reservations
    for (const reservation of oldReservations) {
      // Copy to archive table
      await db.insert(reservationsArchive).values({
        originalId: reservation.id,
        name: reservation.name,
        email: reservation.email,
        phone: reservation.phone,
        date: reservation.date,
        time: reservation.time,
        guests: reservation.guests,
        specialRequests: reservation.specialRequests,
        status: reservation.status,
        originalCreatedAt: reservation.createdAt,
      });
      
      // Delete from main table
      await db.delete(reservations).where(eq(reservations.id, reservation.id));
    }

    return {
      orders: oldOrders.length,
      reservations: oldReservations.length
    };
  }

  async getDataStatistics(): Promise<{
    totalOrders: number;
    oldOrders: number; 
    totalReservations: number;
    oldReservations: number;
    estimatedSize: number;
  }> {
    const allOrders = await db.select().from(orders);
    const allReservations = await db.select().from(reservations);

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const oldOrders = allOrders.filter(order => 
      new Date(order.createdAt) < threeMonthsAgo
    );

    const oldReservations = allReservations.filter(reservation => 
      new Date(reservation.createdAt) < threeMonthsAgo
    );

    // Rough estimation of database size
    const avgOrderSize = 2; // KB per order
    const avgReservationSize = 1.5; // KB per reservation
    const estimatedSize = (allOrders.length * avgOrderSize + allReservations.length * avgReservationSize) / 1024; // MB

    return {
      totalOrders: allOrders.length,
      oldOrders: oldOrders.length,
      totalReservations: allReservations.length,
      oldReservations: oldReservations.length,
      estimatedSize
    };
  }

  // Customization Schema methods
  async getCustomizationSchemas(): Promise<CustomizationSchema[]> {
    return db.select().from(customizationSchemas).orderBy(desc(customizationSchemas.createdAt));
  }

  async getCustomizationSchema(id: string): Promise<CustomizationSchema | undefined> {
    const result = await db.select().from(customizationSchemas).where(eq(customizationSchemas.id, id));
    return result[0];
  }

  async cloneCustomizationSchema(id: string): Promise<CustomizationSchema> {
    // Get the original schema
    const original = await this.getCustomizationSchema(id);
    if (!original) {
      throw new Error("Schema not found");
    }

    // Create a new schema with cloned data
    const cloneData = {
      name: `${original.name} (Copy)`,
      nameVi: original.nameVi ? `${original.nameVi} (Bản sao)` : undefined,
      type: original.type,
      description: original.description,
      descriptionVi: original.descriptionVi,
      config: original.config,
      pricingConfig: original.pricingConfig,
      baseSchemaId: original.isBaseSchema ? original.id : original.baseSchemaId,
      isBaseSchema: false,
      isActive: original.isActive,
    };

    const [clonedSchema] = await db.insert(customizationSchemas).values(cloneData).returning();
    return clonedSchema;
  }

  async deleteCustomizationSchema(id: string): Promise<void> {
    // Check if this is a base schema
    const schema = await this.getCustomizationSchema(id);
    if (!schema) {
      throw new Error("Schema not found");
    }

    if (schema.isBaseSchema) {
      throw new Error("Cannot delete base schema. Base schemas are protected.");
    }

    // Check if any menu items are using this schema
    const menuItemsUsingSchema = await db.select().from(menuItems).where(eq(menuItems.customizationSchemaId, id));
    if (menuItemsUsingSchema.length > 0) {
      throw new Error("Cannot delete schema that is being used by menu items");
    }

    await db.delete(customizationSchemas).where(eq(customizationSchemas.id, id));
  }

  async createCustomizationSchema(schema: InsertCustomizationSchema): Promise<CustomizationSchema> {
    const result = await db.insert(customizationSchemas).values(schema).returning();
    return result[0];
  }

  async updateCustomizationSchema(id: string, updates: Partial<InsertCustomizationSchema>): Promise<CustomizationSchema> {
    const result = await db.update(customizationSchemas).set({
      ...updates,
      updatedAt: new Date()
    }).where(eq(customizationSchemas.id, id)).returning();
    return result[0];
  }

  // About Content methods
  async getAboutContent(): Promise<AboutContent | undefined> {
    const result = await db.select().from(aboutContent).where(eq(aboutContent.isActive, true)).limit(1);
    return result[0];
  }

  async createAboutContent(content: InsertAboutContent): Promise<AboutContent> {
    // Deactivate any existing content
    await db.update(aboutContent).set({ isActive: false });
    
    const [newContent] = await db.insert(aboutContent).values(content).returning();
    return newContent;
  }

  async updateAboutContent(updates: Partial<InsertAboutContent>): Promise<AboutContent> {
    // Update active content or create new one if none exists
    const existing = await this.getAboutContent();
    if (existing) {
      const result = await db.update(aboutContent).set({
        ...updates,
        updatedAt: new Date()
      }).where(eq(aboutContent.id, existing.id)).returning();
      return result[0];
    } else {
      // Create new if none exists
      const content: InsertAboutContent = {
        ...updates as InsertAboutContent,
        isActive: true
      };
      return await this.createAboutContent(content);
    }
  }

  // Home Content Methods
  async getHomeContent(): Promise<HomeContent | undefined> {
    const result = await db.select().from(homeContent).where(eq(homeContent.isActive, true)).limit(1);
    return result[0];
  }

  async createHomeContent(content: InsertHomeContent): Promise<HomeContent> {
    // Deactivate any existing content
    await db.update(homeContent).set({ isActive: false });
    
    const [newContent] = await db.insert(homeContent).values(content).returning();
    return newContent;
  }

  async updateHomeContent(updates: Partial<InsertHomeContent>): Promise<HomeContent> {
    // Update active content or create new one if none exists
    const existing = await this.getHomeContent();
    if (existing) {
      const result = await db.update(homeContent).set({
        ...updates,
        updatedAt: new Date()
      }).where(eq(homeContent.id, existing.id)).returning();
      return result[0];
    } else {
      // Create new if none exists
      const content: InsertHomeContent = {
        ...updates as InsertHomeContent,
        isActive: true
      };
      return await this.createHomeContent(content);
    }
  }

  // Backup & Restore Implementation
  async createBackup(): Promise<any> {
    try {
      console.log('🔄 Starting database backup...');
      
      const backup = {
        metadata: {
          version: '1.0',
          createdAt: new Date().toISOString(),
          source: 'Hum\'s Pizza Restaurant System'
        },
        data: {
          users: await db.select().from(users),
          categories: await db.select().from(categories),
          menuItems: await db.select().from(menuItems),
          reservations: await db.select().from(reservations),
          reservationsArchive: await db.select().from(reservationsArchive),
          orders: await db.select().from(orders),
          ordersArchive: await db.select().from(ordersArchive),
          blogPosts: await db.select().from(blogPosts),
          contactMessages: await db.select().from(contactMessages),
          customerReviews: await db.select().from(customerReviews),
          customizationSchemas: await db.select().from(customizationSchemas),
          aboutContent: await db.select().from(aboutContent),
          homeContent: await db.select().from(homeContent),
          thirdPartyBookings: await db.select().from(thirdPartyBookings),
          integrationSettings: await db.select().from(integrationSettings)
        }
      };
      
      console.log('✅ Database backup completed successfully');
      return backup;
    } catch (error) {
      console.error('❌ Backup failed:', error);
      throw new Error('Failed to create backup: ' + error);
    }
  }

  async restoreFromBackup(backupData: any): Promise<void> {
    try {
      console.log('🔄 Starting database restore...');
      
      if (!backupData.data) {
        throw new Error('Invalid backup format: missing data section');
      }

      const { data } = backupData;
      
      // Clear existing data (except users for safety)
      console.log('🗑️ Clearing existing data...');
      await db.delete(contactMessages);
      await db.delete(ordersArchive);
      await db.delete(orders);
      await db.delete(reservationsArchive);
      await db.delete(reservations);
      await db.delete(blogPosts);
      await db.delete(customerReviews);
      await db.delete(customizationSchemas);
      await db.delete(menuItems);
      await db.delete(categories);
      await db.delete(aboutContent);
      await db.delete(homeContent);
      await db.delete(thirdPartyBookings);
      await db.delete(integrationSettings);
      
      // Restore data in correct order (dependencies)
      console.log('📥 Restoring data...');
      
      if (data.categories?.length) {
        await db.insert(categories).values(data.categories);
      }
      
      if (data.customizationSchemas?.length) {
        await db.insert(customizationSchemas).values(data.customizationSchemas);
      }
      
      if (data.menuItems?.length) {
        await db.insert(menuItems).values(data.menuItems);
      }
      
      if (data.reservations?.length) {
        await db.insert(reservations).values(data.reservations);
      }
      
      if (data.reservationsArchive?.length) {
        await db.insert(reservationsArchive).values(data.reservationsArchive);
      }
      
      if (data.orders?.length) {
        await db.insert(orders).values(data.orders);
      }
      
      if (data.ordersArchive?.length) {
        await db.insert(ordersArchive).values(data.ordersArchive);
      }
      
      if (data.blogPosts?.length) {
        await db.insert(blogPosts).values(data.blogPosts);
      }
      
      if (data.contactMessages?.length) {
        await db.insert(contactMessages).values(data.contactMessages);
      }
      
      if (data.customerReviews?.length) {
        await db.insert(customerReviews).values(data.customerReviews);
      }
      
      if (data.aboutContent?.length) {
        await db.insert(aboutContent).values(data.aboutContent);
      }
      
      if (data.homeContent?.length) {
        await db.insert(homeContent).values(data.homeContent);
      }
      
      if (data.thirdPartyBookings?.length) {
        await db.insert(thirdPartyBookings).values(data.thirdPartyBookings);
      }
      
      if (data.integrationSettings?.length) {
        await db.insert(integrationSettings).values(data.integrationSettings);
      }
      
      console.log('✅ Database restore completed successfully');
    } catch (error) {
      console.error('❌ Restore failed:', error);
      throw new Error('Failed to restore backup: ' + error);
    }
  }

  async getBackupStats(): Promise<{
    totalTables: number;
    totalRecords: number;
    backupSize: number;
    createdAt: Date;
  }> {
    try {
      const stats = await Promise.all([
        db.select().from(users),
        db.select().from(categories),
        db.select().from(menuItems),
        db.select().from(reservations),
        db.select().from(reservationsArchive),
        db.select().from(orders),
        db.select().from(ordersArchive),
        db.select().from(blogPosts),
        db.select().from(contactMessages),
        db.select().from(customerReviews),
        db.select().from(customizationSchemas),
        db.select().from(aboutContent),
        db.select().from(homeContent),
        db.select().from(thirdPartyBookings),
        db.select().from(integrationSettings)
      ]);
      
      const totalRecords = stats.reduce((sum, table) => sum + table.length, 0);
      const estimatedSize = totalRecords * 2; // Rough estimate in KB
      
      return {
        totalTables: 15,
        totalRecords,
        backupSize: estimatedSize,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error getting backup stats:', error);
      throw new Error('Failed to get backup statistics');
    }
  }

  // Notifications
  async getNotifications(isRead?: boolean): Promise<Notification[]> {
    const conditions = [eq(notifications.isVisible, true)];
    
    if (isRead !== undefined) {
      conditions.push(eq(notifications.isRead, isRead));
    }
    
    return await db.select().from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt));
  }

  async getNotification(id: string): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification || undefined;
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(insertNotification).returning();
    return notification;
  }

  async markNotificationAsRead(id: string): Promise<Notification> {
    const [notification] = await db.update(notifications)
      .set({ isRead: true, updatedAt: new Date() })
      .where(eq(notifications.id, id))
      .returning();
    return notification;
  }

  async markAllNotificationsAsRead(): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true, updatedAt: new Date() })
      .where(eq(notifications.isRead, false));
  }

  async deleteNotification(id: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  async deleteAllNotifications(): Promise<void> {
    console.log('🔥🔥🔥 STARTING DELETE ALL NOTIFICATIONS 🔥🔥🔥');
    
    // Simple Drizzle syntax - delete all rows
    await db.delete(notifications);
    
    console.log('🎉🎉🎉 DELETE ALL COMPLETED 🎉🎉🎉');
  }

  async getUnreadNotificationCount(): Promise<number> {
    const result = await db.select({ count: count() }).from(notifications)
      .where(and(eq(notifications.isRead, false), eq(notifications.isVisible, true)));
    return result[0]?.count || 0;
  }

  // Page SEO & Open Graph methods
  async getPageSeo(pageKey: string, language: string): Promise<PageSeo | undefined> {
    const [pageSeoData] = await db.select().from(pageSeo)
      .where(and(eq(pageSeo.pageKey, pageKey), eq(pageSeo.language, language)));
    return pageSeoData || undefined;
  }

  async getPageSeoWithFallback(pageKey: string, language: string): Promise<PageSeo | undefined> {
    // Try to get the requested language first
    let pageSeoData = await this.getPageSeo(pageKey, language);
    
    // If not found and language is not 'en', fallback to English
    if (!pageSeoData && language !== 'en') {
      pageSeoData = await this.getPageSeo(pageKey, 'en');
    }
    
    return pageSeoData;
  }

  async listPageSeo(): Promise<PageSeo[]> {
    return await db.select().from(pageSeo).orderBy(pageSeo.pageKey, pageSeo.language);
  }

  async upsertPageSeo(pageSeoData: InsertPageSeo): Promise<PageSeo> {
    const [upsertedPageSeo] = await db.insert(pageSeo)
      .values({
        ...pageSeoData,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: [pageSeo.pageKey, pageSeo.language],
        set: {
          ...pageSeoData,
          updatedAt: new Date()
        }
      })
      .returning();
    return upsertedPageSeo;
  }

  async updatePageSeo(pageKey: string, language: string, updates: Partial<InsertPageSeo>): Promise<PageSeo> {
    const [updatedPageSeo] = await db.update(pageSeo)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(eq(pageSeo.pageKey, pageKey), eq(pageSeo.language, language)))
      .returning();
    
    if (!updatedPageSeo) {
      throw new Error(`Page SEO not found for pageKey: ${pageKey}, language: ${language}`);
    }
    
    return updatedPageSeo;
  }

  async deletePageSeo(pageKey: string, language: string): Promise<void> {
    const result = await db.delete(pageSeo)
      .where(and(eq(pageSeo.pageKey, pageKey), eq(pageSeo.language, language)));
    
    if (result.rowCount === 0) {
      throw new Error(`Page SEO not found for pageKey: ${pageKey}, language: ${language}`);
    }
  }

}

export const storage = new DatabaseStorage();
