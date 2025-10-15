import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, decimal, json, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("customer"), // admin, staff, customer
  fullName: text("full_name"),
  permissions: json("permissions").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameVi: text("name_vi"),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
});

export const menuItems = pgTable("menu_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameVi: text("name_vi"),
  description: text("description").notNull(),
  descriptionVi: text("description_vi"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  categoryId: varchar("category_id").references(() => categories.id),
  isAvailable: boolean("is_available").default(true),
  isPinned: boolean("is_pinned").default(false),
  pinnedAt: timestamp("pinned_at"),
  tags: json("tags").$type<string[]>().default([]),
  customizationSchemaId: varchar("customization_schema_id"), // Legacy field for backward compatibility
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Join table for many-to-many relationship between menu items and customization schemas
export const menuItemCustomizationSchemas = pgTable("menu_item_customization_schemas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  menuItemId: varchar("menu_item_id").notNull().references(() => menuItems.id, { onDelete: "cascade" }),
  customizationSchemaId: varchar("customization_schema_id").notNull().references(() => customizationSchemas.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").default(0), // Order of schemas for this menu item
  isRequired: boolean("is_required").default(false), // Whether this customization is required
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  // Unique constraint to prevent duplicate associations
  unique: {
    columns: [table.menuItemId, table.customizationSchemaId],
    name: "menu_item_schema_unique"
  }
}));

export const reservations = pgTable("reservations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email"), // Optional field
  phone: text("phone").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  time: text("time").notNull(), // HH:MM format (24-hour format)
  guests: integer("guests").notNull(),
  specialRequests: text("special_requests"),
  status: text("status").notNull().default("pending"), // pending, confirmed, cancelled
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reservationsArchive = pgTable("reservations_archive", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  originalId: varchar("original_id").notNull(), // Reference to original reservation ID
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  guests: integer("guests").notNull(),
  specialRequests: text("special_requests"),
  status: text("status").notNull(),
  originalCreatedAt: timestamp("original_created_at").notNull(), // Original creation date
  archivedAt: timestamp("archived_at").notNull().defaultNow(), // When it was archived
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerAddress: text("customer_address"), // Optional address field
  items: json("items").$type<Array<{id: string, name: string, price: number, quantity: number}>>().notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, confirmed, preparing, ready, delivered, cancelled
  orderType: text("order_type").notNull(), // dine-in, takeout, delivery
  paymentMethod: text("payment_method").notNull().default("cash"), // cash, transfer
  specialInstructions: text("special_instructions"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const ordersArchive = pgTable("orders_archive", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  originalId: varchar("original_id").notNull(), // Reference to original order ID
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerAddress: text("customer_address"), // Optional address field
  items: json("items").$type<Array<{id: string, name: string, price: number, quantity: number}>>().notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(),
  orderType: text("order_type").notNull(),
  paymentMethod: text("payment_method").notNull(),
  specialInstructions: text("special_instructions"),
  originalCreatedAt: timestamp("original_created_at").notNull(), // Original creation date
  archivedAt: timestamp("archived_at").notNull().defaultNow(), // When it was archived
});

export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  titleVi: text("title_vi"),
  excerpt: text("excerpt").notNull(),
  excerptVi: text("excerpt_vi"),
  content: text("content").notNull(),
  contentVi: text("content_vi"),
  imageUrl: text("image_url"), // Thumbnail for cards
  coverImageUrl: text("cover_image_url"), // Cover image for article content
  published: boolean("published").default(false),
  pinned: boolean("pinned").default(false),
  pinOrder: integer("pin_order").default(0), // Order of pinned posts (0 = first, 1 = second, etc.)
  // SEO fields
  metaTitle: text("meta_title"),
  metaTitleVi: text("meta_title_vi"),
  metaDescription: text("meta_description"),
  metaDescriptionVi: text("meta_description_vi"),
  slug: text("slug"),
  slugVi: text("slug_vi"),
  keywords: text("keywords"), // comma-separated keywords
  keywordsVi: text("keywords_vi"),
  canonicalUrl: text("canonical_url"),
  ogImageUrl: text("og_image_url"), // Social media sharing image
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const contactMessages = pgTable("contact_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(), // Required phone number
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"), // new, replied, archived
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Third-party booking integrations
export const thirdPartyBookings = pgTable("third_party_bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platform: text("platform").notNull(), // opentable, resy, yelp, etc.
  externalId: text("external_id").notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  date: text("date").notNull(),
  time: text("time").notNull(),
  guests: integer("guests").notNull(),
  specialRequests: text("special_requests"),
  status: text("status").notNull().default("pending"),
  syncedAt: timestamp("synced_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// API integration settings
export const integrationSettings = pgTable("integration_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platform: text("platform").notNull().unique(), // opentable, resy, etc.
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  webhookUrl: text("webhook_url"),
  isActive: boolean("is_active").default(false),
  settings: json("settings").$type<Record<string, any>>().default({}),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const customerReviews = pgTable("customer_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerName: text("customer_name").notNull(),
  customerNameVi: text("customer_name_vi"),
  customerTitle: text("customer_title").notNull(), // "Khách hàng", "Food Blogger", etc.
  customerTitleVi: text("customer_title_vi"),
  rating: integer("rating").notNull(), // 1-5 stars
  review: text("review").notNull(),
  reviewVi: text("review_vi"),
  avatarUrl: text("avatar_url"),
  isPublished: boolean("is_published").notNull().default(false),
  isPinned: boolean("is_pinned").notNull().default(false),
  pinnedAt: timestamp("pinned_at"),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Customization Schema for menu items
export const customizationSchemas = pgTable("customization_schemas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // "Half & Half Pizza", "Pizza Chicago Size"
  nameVi: text("name_vi"),
  type: text("type").notNull(), // "half_and_half", "size_selection", "toppings", etc.
  description: text("description"),
  descriptionVi: text("description_vi"),
  config: json("config").$type<Record<string, any>>().default({}),
  pricingConfig: json("pricing_config").$type<Record<string, any>>().default({}), // Pricing configuration for options
  baseSchemaId: varchar("base_schema_id"), // Reference to base schema for clones
  isBaseSchema: boolean("is_base_schema").default(false), // Is this a base schema that cannot be deleted
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Relations
export const categoriesRelations = relations(categories, ({ many }) => ({
  menuItems: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  category: one(categories, {
    fields: [menuItems.categoryId],
    references: [categories.id],
  }),
  customizationSchema: one(customizationSchemas, {
    fields: [menuItems.customizationSchemaId],
    references: [customizationSchemas.id],
  }),
  customizationSchemas: many(menuItemCustomizationSchemas),
}));

export const menuItemCustomizationSchemasRelations = relations(menuItemCustomizationSchemas, ({ one }) => ({
  menuItem: one(menuItems, {
    fields: [menuItemCustomizationSchemas.menuItemId],
    references: [menuItems.id],
  }),
  customizationSchema: one(customizationSchemas, {
    fields: [menuItemCustomizationSchemas.customizationSchemaId],
    references: [customizationSchemas.id],
  }),
}));

export const customizationSchemasRelations = relations(customizationSchemas, ({ many }) => ({
  menuItems: many(menuItems),
  menuItemCustomizationSchemas: many(menuItemCustomizationSchemas),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export const insertMenuItemSchema = createInsertSchema(menuItems).omit({
  id: true,
  createdAt: true,
});

export const insertMenuItemCustomizationSchemaSchema = createInsertSchema(menuItemCustomizationSchemas).omit({
  id: true,
  createdAt: true,
});

export const insertReservationSchema = createInsertSchema(reservations).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  status: true,
}).refine((data) => {
  // Require customerAddress for delivery orders
  if (data.orderType === 'delivery' && (!data.customerAddress || data.customerAddress.trim().length < 5)) {
    return false;
  }
  return true;
}, {
  message: "Address is required for delivery orders and must be at least 5 characters long",
  path: ["customerAddress"],
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertThirdPartyBookingSchema = createInsertSchema(thirdPartyBookings).omit({
  id: true,
  createdAt: true,
  syncedAt: true,
});

export const insertIntegrationSettingSchema = createInsertSchema(integrationSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSyncAt: true,
});

export const insertCustomerReviewSchema = createInsertSchema(customerReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  pinnedAt: true,
});

export const insertCustomizationSchemaSchema = createInsertSchema(customizationSchemas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;

export type Reservation = typeof reservations.$inferSelect;
export type InsertReservation = z.infer<typeof insertReservationSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;

export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;

export type ThirdPartyBooking = typeof thirdPartyBookings.$inferSelect;
export type InsertThirdPartyBooking = z.infer<typeof insertThirdPartyBookingSchema>;

export type IntegrationSetting = typeof integrationSettings.$inferSelect;
export type InsertIntegrationSetting = z.infer<typeof insertIntegrationSettingSchema>;

export type CustomerReview = typeof customerReviews.$inferSelect;
export type InsertCustomerReview = z.infer<typeof insertCustomerReviewSchema>;

export type CustomizationSchema = typeof customizationSchemas.$inferSelect;
export type InsertCustomizationSchema = z.infer<typeof insertCustomizationSchemaSchema>;

// About Us content table
export const aboutContent = pgTable("about_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Hero section
  heroTitle: text("hero_title").notNull(),
  heroTitleVi: text("hero_title_vi").notNull(),
  heroSubtitle: text("hero_subtitle").notNull(),
  heroSubtitleVi: text("hero_subtitle_vi").notNull(),
  
  // Story section
  storyTitle: text("story_title").notNull(),
  storyTitleVi: text("story_title_vi").notNull(),
  storyContent: text("story_content").notNull(),
  storyContentVi: text("story_content_vi").notNull(),
  storyImageUrl: text("story_image_url"),
  storyImageUrl2: text("story_image_url_2"),
  
  // Statistics
  statsRecipes: text("stats_recipes").default("10+"),
  statsServed: text("stats_served").default("5K+"),
  statsFresh: text("stats_fresh").default("100%"),
  statsSatisfaction: text("stats_satisfaction").default("95%"),
  statsRecipesLabel: text("stats_recipes_label").notNull(),
  statsRecipesLabelVi: text("stats_recipes_label_vi").notNull(),
  statsServedLabel: text("stats_served_label").notNull(),
  statsServedLabelVi: text("stats_served_label_vi").notNull(),
  statsFreshLabel: text("stats_fresh_label").notNull(),
  statsFreshLabelVi: text("stats_fresh_label_vi").notNull(),
  statsSatisfactionLabel: text("stats_satisfaction_label").notNull(),
  statsSatisfactionLabelVi: text("stats_satisfaction_label_vi").notNull(),
  
  // Philosophy section
  visionTitle: text("vision_title").notNull(),
  visionTitleVi: text("vision_title_vi").notNull(),
  visionContent: text("vision_content").notNull(),
  visionContentVi: text("vision_content_vi").notNull(),
  
  missionTitle: text("mission_title").notNull(),
  missionTitleVi: text("mission_title_vi").notNull(),
  missionContent: text("mission_content").notNull(),
  missionContentVi: text("mission_content_vi").notNull(),
  
  valuesTitle: text("values_title").notNull(),
  valuesTitleVi: text("values_title_vi").notNull(),
  valuesContent: text("values_content").notNull(),
  valuesContentVi: text("values_content_vi").notNull(),
  
  // Team section
  teamTitle: text("team_title").notNull(),
  teamTitleVi: text("team_title_vi").notNull(),
  
  // Team members
  member1Name: text("member1_name").notNull(),
  member1Title: text("member1_title").notNull(),
  member1TitleVi: text("member1_title_vi").notNull(),
  member1Description: text("member1_description").notNull(),
  member1DescriptionVi: text("member1_description_vi").notNull(),
  member1ImageUrl: text("member1_image_url"),
  
  member2Name: text("member2_name").notNull(),
  member2Title: text("member2_title").notNull(),
  member2TitleVi: text("member2_title_vi").notNull(),
  member2Description: text("member2_description").notNull(),
  member2DescriptionVi: text("member2_description_vi").notNull(),
  member2ImageUrl: text("member2_image_url"),
  
  member3Name: text("member3_name").notNull(),
  member3Title: text("member3_title").notNull(),
  member3TitleVi: text("member3_title_vi").notNull(),
  member3Description: text("member3_description").notNull(),
  member3DescriptionVi: text("member3_description_vi").notNull(),
  member3ImageUrl: text("member3_image_url"),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAboutContentSchema = createInsertSchema(aboutContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type AboutContent = typeof aboutContent.$inferSelect;
export type InsertAboutContent = z.infer<typeof insertAboutContentSchema>;

// Home page content table
export const homeContent = pgTable("home_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Hero section titles
  heroTitle: text("hero_title").notNull(),
  heroTitleVi: text("hero_title_vi").notNull(),
  
  // Featured dishes section titles
  featuredTitle: text("featured_title").notNull(),
  featuredTitleVi: text("featured_title_vi").notNull(),
  featuredSubtitle: text("featured_subtitle").notNull(),
  featuredSubtitleVi: text("featured_subtitle_vi").notNull(),
  
  // Reservation experience section titles
  reservationTitle: text("reservation_title").notNull(),
  reservationTitleVi: text("reservation_title_vi").notNull(),
  reservationSubtitle: text("reservation_subtitle").notNull(),
  reservationSubtitleVi: text("reservation_subtitle_vi").notNull(),
  
  // Customer reviews section titles
  reviewsTitle: text("reviews_title").notNull(),
  reviewsTitleVi: text("reviews_title_vi").notNull(),
  reviewsSubtitle: text("reviews_subtitle").notNull(),
  reviewsSubtitleVi: text("reviews_subtitle_vi").notNull(),
  
  // Latest blog section titles
  blogTitle: text("blog_title").notNull(),
  blogTitleVi: text("blog_title_vi").notNull(),
  blogSubtitle: text("blog_subtitle").notNull(),
  blogSubtitleVi: text("blog_subtitle_vi").notNull(),

  // Pending video URLs from object storage (before committing to attached_assets)
  pendingHeroVideoUrl: text("pending_hero_video_url"),
  pendingReservationVideoUrl: text("pending_reservation_video_url"),

  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertHomeContentSchema = createInsertSchema(homeContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Notifications for dashboard
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // "order", "reservation", "contact", "website_update"
  title: text("title").notNull(),
  titleVi: text("title_vi"),
  content: text("content").notNull(),
  contentVi: text("content_vi"),
  // Customer info (for customer-related notifications)
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  // Reference IDs (to link back to original data)
  referenceId: text("reference_id"), // order id, reservation id, etc.
  referenceType: text("reference_type"), // "order", "reservation", "contact_message"
  // Status tracking
  isRead: boolean("is_read").default(false),
  isVisible: boolean("is_visible").default(true),
  priority: text("priority").default("normal"), // "low", "normal", "high", "urgent"
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type HomeContent = typeof homeContent.$inferSelect;
export type InsertHomeContent = z.infer<typeof insertHomeContentSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Page SEO/Open Graph metadata table
export const pageSeo = pgTable("page_seo", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pageKey: text("page_key").notNull(), // home, menu, about, blog, contact, booking
  language: text("language").notNull(), // en, vi
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  keywords: text("keywords"), // comma-separated keywords
  canonicalUrl: text("canonical_url"),
  ogTitle: text("og_title"),
  ogDescription: text("og_description"),
  ogImageUrl: text("og_image_url"),
  ogType: text("og_type").default("website"), // website, article, profile, product
  ogUrl: text("og_url"), // optional override
  noIndex: boolean("no_index").default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  // Unique constraint for pageKey + language combination
  pageKeyLanguageUnique: uniqueIndex("page_seo_unique").on(table.pageKey, table.language),
}));

export const insertPageSeoSchema = createInsertSchema(pageSeo).omit({
  id: true,
  updatedAt: true,
});

export type PageSeo = typeof pageSeo.$inferSelect;
export type InsertPageSeo = z.infer<typeof insertPageSeoSchema>;
