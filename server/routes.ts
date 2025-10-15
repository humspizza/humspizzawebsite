import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { sql } from "drizzle-orm";
import express from "express";
import path from "path";
import archiver from "archiver";
import fs from "fs";
import { 
  insertReservationSchema, insertOrderSchema, insertContactMessageSchema,
  insertCategorySchema, insertMenuItemSchema, insertBlogPostSchema, insertCustomizationSchemaSchema,
  insertAboutContentSchema, insertNotificationSchema, insertPageSeoSchema, insertCustomerReviewSchema
} from "@shared/schema";
import { z } from "zod";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";

// Utility function to generate URL-friendly slugs
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/-+/g, '-') // Replace multiple dashes with single dash
    .replace(/^-|-$/g, ''); // Remove leading/trailing dashes
}

// Auth middleware
function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Debug endpoint to check users
  app.get("/api/debug/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json({ 
        count: users.length,
        users: users.map(u => ({ id: u.id, username: u.username, role: u.role }))
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set session for admin/staff users
      if (user.role === 'admin' || user.role === 'staff') {
        req.session.userId = user.id;
        req.session.userRole = user.role;
      }

      res.json({ 
        success: true, 
        user: { 
          id: user.id, 
          username: user.username, 
          role: user.role,
          fullName: user.fullName,
          permissions: user.permissions
        } 
      });
    } catch (error: any) {
      res.status(500).json({ message: "Login failed: " + error.message });
    }
  });

  // Get current admin user
  app.get("/api/admin/me", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        permissions: user.permissions,
        email: user.email
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get current staff user  
  app.get("/api/staff/me", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'staff') {
        return res.status(403).json({ message: "Staff access required" });
      }

      res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        permissions: user.permissions,
        email: user.email
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin logout
  app.post("/api/admin/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Staff logout
  app.post("/api/staff/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // User Management APIs (Admin only)
  function requireAdmin(req: any, res: any, next: any) {
    if (!req.session?.userId || req.session?.userRole !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  }

  // Update admin profile
  app.patch("/api/admin/profile", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { fullName, email, currentPassword, newPassword } = req.body;
      
      if (!email || !currentPassword) {
        return res.status(400).json({ message: "Email and current password are required" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.password !== currentPassword) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      const updateData: any = { 
        fullName: fullName || user.fullName, 
        email 
      };
      
      if (newPassword && newPassword.trim().length > 0) {
        updateData.password = newPassword;
      }

      await storage.updateUser(userId, updateData);
      res.json({ success: true, message: "Profile updated successfully" });
    } catch (error: any) {
      console.error("Profile update error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get all users (Admin only)
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create new user (Admin only)
  app.post("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const { username, email, fullName, password, role, permissions, isActive } = req.body;
      
      if (!username || !email || !fullName || !password || !role) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const userData = {
        username,
        email,
        fullName,
        password,
        role,
        permissions: permissions || [],
        isActive: isActive !== undefined ? isActive : true
      };

      const newUser = await storage.createUser(userData);
      res.status(201).json(newUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update user (Admin only)
  app.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      const updateData = req.body;

      // Don't allow admin to update their own role
      if (userId === req.session.userId && updateData.role) {
        return res.status(400).json({ message: "Cannot change your own role" });
      }

      const updatedUser = await storage.updateUser(userId, updateData);
      res.json(updatedUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Delete user (Admin only)
  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = req.params.id;

      // Don't allow admin to delete themselves
      if (userId === req.session.userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      await storage.deleteUser(userId);
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const category = insertCategorySchema.parse(req.body);
      const newCategory = await storage.createCategory(category);
      res.status(201).json(newCategory);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/categories/:id", async (req, res) => {
    try {
      const updatedCategory = await storage.updateCategory(req.params.id, req.body);
      res.json(updatedCategory);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      await storage.deleteCategory(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Data Management & Archive System
  app.post("/api/admin/archive-data", requireAuth, async (req, res) => {
    try {
      const { period } = req.body;
      const result = await storage.archiveOldData(period);
      res.json({ success: true, archived: result });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/data-stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getDataStatistics();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Contact message cleanup - automatically delete non-archived messages older than 3 months
  app.post("/api/contact/cleanup", requireAuth, async (req, res) => {
    try {
      const deletedCount = await storage.cleanupOldContactMessages();
      res.json({ 
        message: `Successfully deleted ${deletedCount} old contact messages`,
        deletedCount
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Menu Items
  app.get("/api/menu-items", async (req, res) => {
    try {
      const includeUnavailable = req.query.includeUnavailable === 'true';
      const categoryId = req.query.categoryId as string;
      const menuItems = await storage.getMenuItems(includeUnavailable, categoryId);
      res.json(menuItems);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin menu items endpoint with trailing slash (always include unavailable for admin)
  app.get("/api/menu-items/", async (req, res) => {
    try {
      const includeUnavailable = req.query.includeUnavailable !== 'false'; // Default to true for admin
      const categoryId = req.query.categoryId as string;
      const menuItems = await storage.getMenuItems(includeUnavailable, categoryId);
      res.json(menuItems);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get pinned menu items for homepage - must be before :id route
  app.get("/api/menu-items/pinned", async (req, res) => {
    try {
      const pinnedItems = await storage.getPinnedMenuItems();
      res.json(pinnedItems);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/menu-items/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const menuItems = await storage.searchMenuItems(query);
      res.json(menuItems);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/menu-items/:id", async (req, res) => {
    try {
      const menuItem = await storage.getMenuItem(req.params.id);
      if (!menuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      res.json(menuItem);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/menu-items", async (req, res) => {
    try {
      const menuItem = insertMenuItemSchema.parse(req.body);
      const newMenuItem = await storage.createMenuItem(menuItem);
      res.status(201).json(newMenuItem);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/menu-items/:id", async (req, res) => {
    try {
      const updatedMenuItem = await storage.updateMenuItem(req.params.id, req.body);
      res.json(updatedMenuItem);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/menu-items/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteMenuItem(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get customization schemas for a specific menu item  
  app.get("/api/menu-items/:id/customization-schemas", async (req, res) => {
    try {
      const schemas = await storage.getMenuItemCustomizationSchemas(req.params.id);
      res.json(schemas);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update customization schemas for a specific menu item (Admin only)
  app.patch("/api/menu-items/:id/customization-schemas", requireAdmin, async (req, res) => {
    try {
      const { schemaIds } = req.body;
      
      // Validate input
      if (!Array.isArray(schemaIds)) {
        return res.status(400).json({ message: "schemaIds must be an array" });
      }
      
      // Validate each schemaId is a non-empty string and unique
      if (!schemaIds.every(id => typeof id === 'string' && id.trim().length > 0)) {
        return res.status(400).json({ message: "All schemaIds must be non-empty strings" });
      }
      
      if (new Set(schemaIds).size !== schemaIds.length) {
        return res.status(400).json({ message: "Duplicate schemaIds are not allowed" });
      }
      
      // Verify menu item exists
      const menuItem = await storage.getMenuItem(req.params.id);
      if (!menuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      
      const updatedSchemas = await storage.updateMenuItemCustomizationSchemas(req.params.id, schemaIds);
      res.json(updatedSchemas);
    } catch (error: any) {
      if (error.message.includes('invalid schema')) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Toggle pin status of menu item (Admin only)
  app.patch("/api/menu-items/:id/pin", requireAdmin, async (req, res) => {
    try {
      // Check current pinned count before allowing pin
      const pinnedItems = await storage.getPinnedMenuItems();
      const item = await storage.getMenuItem(req.params.id);
      
      if (!item) {
        return res.status(404).json({ message: "Menu item not found" });
      }

      // If trying to pin and already have 4 pinned items, prevent it
      if (!item.isPinned && pinnedItems.length >= 4) {
        return res.status(400).json({ 
          message: "Đã đạt giới hạn ghim! Bạn chỉ được ghim tối đa 4 món ăn. Vui lòng bỏ ghim món khác trước khi ghim món mới." 
        });
      }

      const updatedItem = await storage.toggleMenuItemPin(req.params.id);
      res.json(updatedItem);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Reservations
  app.post("/api/reservations", async (req, res) => {
    try {
      const reservation = insertReservationSchema.parse(req.body);
      const newReservation = await storage.createReservation(reservation);
      
      // Create notification for new reservation
      await storage.createNotification({
        type: 'reservation',
        title: 'New Table Reservation',
        titleVi: 'Đặt bàn mới',
        content: `Table reservation for ${reservation.guests} guests by ${reservation.name}`,
        contentVi: `Đặt bàn cho ${reservation.guests} khách bởi ${reservation.name}`,
        customerName: reservation.name,
        customerPhone: reservation.phone,
        referenceId: newReservation.id,
        referenceType: 'reservation',
        priority: 'normal'
      });
      
      res.status(201).json(newReservation);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/reservations", async (req, res) => {
    try {
      const reservations = await storage.getReservations();
      res.json(reservations);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/reservations/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const reservation = await storage.updateReservationStatus(req.params.id, status);
      res.json(reservation);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Full reservation update
  app.patch("/api/reservations/:id", async (req, res) => {
    try {
      const updatedReservation = await storage.updateReservation(req.params.id, req.body);
      res.json(updatedReservation);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Orders
  app.post("/api/orders", async (req, res) => {
    try {
      const order = insertOrderSchema.parse(req.body);
      const newOrder = await storage.createOrder(order);
      
      // Create notification for new order
      await storage.createNotification({
        type: 'order',
        title: 'New Order Received',
        titleVi: 'Đơn hàng mới',
        content: `Order #${newOrder.id} from ${order.customerName}`,
        contentVi: `Đơn hàng #${newOrder.id} từ ${order.customerName}`,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        referenceId: newOrder.id,
        referenceType: 'order',
        priority: 'high'
      });
      
      res.status(201).json(newOrder);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const order = await storage.updateOrderStatus(req.params.id, status);
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Full order update
  app.patch("/api/orders/:id", async (req, res) => {
    try {
      const updatedOrder = await storage.updateOrder(req.params.id, req.body);
      res.json(updatedOrder);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Image upload for news posts
  app.post("/api/news-images/upload", requireAuth, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getImageUploadURL();
      res.json({ uploadURL });
    } catch (error: any) {
      console.error("Error getting news image upload URL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Open Graph image upload endpoint
  app.post("/api/og-images/upload", requireAuth, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getImageUploadURL();
      res.json({ uploadURL });
    } catch (error: any) {
      console.error("Error getting OG image upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Set Open Graph image metadata after upload
  app.put("/api/og-images", requireAuth, async (req, res) => {
    if (!req.body.imageURL) {
      return res.status(400).json({ error: "imageURL is required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(
        req.body.imageURL,
      );

      // For Open Graph images, make them publicly accessible
      res.status(200).json({
        objectPath: objectPath,
        publicURL: `${req.protocol}://${req.get('host')}${objectPath}`,
      });
    } catch (error: any) {
      console.error("Error setting OG image:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Serve news images
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        // This is normal when news post doesn't have an image - no need to log as error
        return res.sendStatus(404);
      }
      console.error("Error serving news image:", error);
      return res.sendStatus(500);
    }
  });

  // Blog Posts
  app.get("/api/blog-posts", async (req, res) => {
    try {
      let published = undefined;
      if (req.query.all === "true") {
        published = undefined; // Get all posts regardless of status
      } else {
        published = req.query.published !== undefined ? req.query.published === 'true' : true;
      }
      const blogPosts = await storage.getBlogPosts(published);
      res.json(blogPosts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get blog post by slug or ID
  app.get("/api/blog-posts/slug/:slug", async (req, res) => {
    try {
      // Disable caching to ensure fresh data after updates
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      const blogPost = await storage.getBlogPostBySlug(req.params.slug);
      if (!blogPost) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      
      res.json(blogPost);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/blog-posts/:id", async (req, res) => {
    try {
      const blogPost = await storage.getBlogPost(req.params.id);
      if (!blogPost) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.json(blogPost);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/blog-posts", requireAuth, async (req, res) => {
    try {
      const blogPostData = insertBlogPostSchema.parse(req.body);
      
      // Generate slugs if missing
      if (blogPostData.title && (!blogPostData.slug || blogPostData.slug === 'undefined')) {
        blogPostData.slug = generateSlug(blogPostData.title);
      }
      
      if (blogPostData.titleVi && (!blogPostData.slugVi || blogPostData.slugVi === 'undefined')) {
        blogPostData.slugVi = generateSlug(blogPostData.titleVi);
      }
      
      const newBlogPost = await storage.createBlogPost(blogPostData);
      res.status(201).json(newBlogPost);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/blog-posts/:id", requireAuth, async (req, res) => {
    try {
      // Generate slugs if missing
      const processedData = { ...req.body };
      
      if (processedData.title && (!processedData.slug || processedData.slug === 'undefined')) {
        processedData.slug = generateSlug(processedData.title);
      }
      
      if (processedData.titleVi && (!processedData.slugVi || processedData.slugVi === 'undefined')) {
        processedData.slugVi = generateSlug(processedData.titleVi);
      }
      
      const updatedBlogPost = await storage.updateBlogPost(req.params.id, processedData);
      
      res.json(updatedBlogPost);
    } catch (error: any) {
      console.error('❌ Blog post update error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/blog-posts/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteBlogPost(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Toggle pin status of blog post (Admin only)
  app.patch("/api/blog-posts/:id/pin", requireAuth, async (req, res) => {
    try {
      // Check current pinned count before allowing pin
      const pinnedPosts = await storage.getPinnedBlogPosts();
      const post = await storage.getBlogPost(req.params.id);
      
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }

      // If trying to pin and already have 4 pinned posts, prevent it
      if (!post.pinned && pinnedPosts.length >= 4) {
        return res.status(400).json({ 
          message: "Đã đạt giới hạn ghim! Bạn chỉ được ghim tối đa 4 tin tức. Vui lòng bỏ ghim tin tức khác trước khi ghim tin mới." 
        });
      }

      const updatedPost = await storage.toggleBlogPostPin(req.params.id);
      res.json(updatedPost);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Contact Messages
  app.post("/api/contact", async (req, res) => {
    try {
      const message = insertContactMessageSchema.parse(req.body);
      const newMessage = await storage.createContactMessage(message);
      
      // Create notification for new contact message
      await storage.createNotification({
        type: 'contact',
        title: 'New Contact Message',
        titleVi: 'Tin nhắn liên hệ mới',
        content: `New message from ${message.name}: ${message.message.substring(0, 50)}...`,
        contentVi: `Tin nhắn mới từ ${message.name}: ${message.message.substring(0, 50)}...`,
        customerName: message.name,
        customerPhone: message.phone,
        referenceId: newMessage.id,
        referenceType: 'contact',
        priority: 'normal'
      });
      
      res.status(201).json(newMessage);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/contact", requireAuth, async (req, res) => {
    try {
      const contactMessages = await storage.getContactMessages();
      res.json(contactMessages);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/contact/:id/status", requireAuth, async (req, res) => {
    try {
      const { status } = req.body;
      const contactMessage = await storage.updateContactMessageStatus(req.params.id, status);
      res.json(contactMessage);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/contact/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteContactMessage(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/orders/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteOrder(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/reservations/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteReservation(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // About Content Routes
  app.get("/api/about-content", async (req, res) => {
    try {
      const aboutContent = await storage.getAboutContent();
      res.json(aboutContent);
    } catch (error) {
      console.error('Get about content error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/about-content", requireAuth, requireAdmin, async (req, res) => {
    try {
      const updates = req.body;
      const updatedContent = await storage.updateAboutContent(updates);
      res.json(updatedContent);
    } catch (error) {
      console.error('Update about content error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Home Content Routes
  app.get("/api/home-content", async (req, res) => {
    try {
      const homeContent = await storage.getHomeContent();
      res.json(homeContent);
    } catch (error) {
      console.error('Get home content error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/home-content", requireAuth, requireAdmin, async (req, res) => {
    try {
      const updates = req.body;
      
      // Only commit pending videos if explicitly requested
      const currentContent = await storage.getHomeContent();
      
      // Check if this update request includes video commit flag
      if (updates.commitPendingVideos === true) {
        // Process pending hero video
        if (currentContent?.pendingHeroVideoUrl) {
          await commitVideoToAttachedAssets(currentContent.pendingHeroVideoUrl, 'hero');
          updates.pendingHeroVideoUrl = null; // Clear pending URL
        }
        
        // Process pending reservation video  
        if (currentContent?.pendingReservationVideoUrl) {
          await commitVideoToAttachedAssets(currentContent.pendingReservationVideoUrl, 'reservation');
          updates.pendingReservationVideoUrl = null; // Clear pending URL
        }
        
        // Remove the flag from updates so it's not stored in DB
        delete updates.commitPendingVideos;
      }
      
      const updatedContent = await storage.updateHomeContent(updates);
      res.json(updatedContent);
    } catch (error) {
      console.error('Update home content error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Cancel pending videos - clear pending state without saving
  app.post("/api/cancel-pending-videos", requireAuth, requireAdmin, async (req, res) => {
    try {
      const currentContent = await storage.getHomeContent();
      const updates = {
        ...currentContent,
        pendingHeroVideoUrl: null,
        pendingReservationVideoUrl: null,
      };
      
      await storage.updateHomeContent(updates);
      res.json({ success: true, message: "Pending videos cancelled" });
    } catch (error) {
      console.error('Cancel pending videos error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Helper function to commit video from object storage to attached_assets
  async function commitVideoToAttachedAssets(videoUrl: string, videoType: 'hero' | 'reservation') {
    try {
      const objectStorageService = new ObjectStorageService();
      
      // Determine file name based on video type
      const fileName = videoType === 'hero' ? 'hero.landingpage.mp4' : 'hero2.landingpage.mp4';
      
      // Get object path from URL
      const objectPath = objectStorageService.normalizeObjectEntityPath(videoUrl);
      
      // Get the file from object storage
      const file = await objectStorageService.getObjectEntityFile(objectPath);
      
      // Copy to attached_assets
      const localPath = path.join(process.cwd(), 'attached_assets', fileName);
      const writeStream = fs.createWriteStream(localPath);
      const readStream = file.createReadStream();
      
      await new Promise((resolve, reject) => {
        readStream.pipe(writeStream);
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });
      
      console.log(`Video ${videoType} committed to attached_assets: ${fileName}`);
    } catch (error) {
      console.error(`Error committing video ${videoType}:`, error);
      throw error;
    }
  }

  // Staff Authentication
  app.post("/api/auth/staff-login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.authenticateUser(username, password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (user.role !== 'staff' && user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: "Account is inactive" });
      }

      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          role: user.role,
          permissions: user.permissions,
          fullName: user.fullName 
        } 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Third-party booking integrations
  app.get("/api/third-party-bookings", async (req, res) => {
    try {
      const bookings = await storage.getThirdPartyBookings();
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/third-party-bookings/sync", async (req, res) => {
    try {
      const { platform } = req.body;
      const settings = await storage.getIntegrationSettings(platform);
      
      if (!settings || !settings.isActive) {
        return res.status(400).json({ message: "Integration not configured or inactive" });
      }

      // Here you would implement the actual API calls to third-party services
      // For now, we'll return a mock response
      const syncResult = await storage.syncThirdPartyBookings(platform, settings);
      res.json({ message: "Sync completed", synced: syncResult });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/integration-settings", async (req, res) => {
    try {
      const settings = await storage.getAllIntegrationSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/integration-settings", async (req, res) => {
    try {
      const setting = await storage.createIntegrationSetting(req.body);
      res.status(201).json(setting);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/integration-settings/:platform", async (req, res) => {
    try {
      const setting = await storage.updateIntegrationSetting(req.params.platform, req.body);
      res.json(setting);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/contact", async (req, res) => {
    try {
      const messages = await storage.getContactMessages();
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });




  // Object Storage endpoints - REMOVED (using local files only via /api/assets)
  // All files now served from attached_assets/ folder
  
  /*
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    // REMOVED - use /api/assets instead
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    // REMOVED - use /api/assets instead
  });

  app.post("/api/objects/upload", requireAuth, async (req, res) => {
    // REMOVED - files stored locally now
  });

  app.put("/api/menu-images", requireAuth, async (req, res) => {
    // REMOVED - not needed for local files
  });
  */
  
  // Note: All static assets now served via /api/assets route defined in server/index.ts

  // User management routes
  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const { username, email, fullName, password, role, permissions, isActive } = req.body;
      
      if (!username || !email || !fullName || !password || !role) {
        return res.status(400).json({ message: "All required fields must be provided" });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const userData = {
        username,
        email,
        fullName,
        password,
        role,
        permissions: permissions || [],
        isActive: isActive !== undefined ? isActive : true
      };

      const newUser = await storage.createUser(userData);
      res.json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Only admin can update other users, or user can update themselves
      if (req.session.userId !== id && req.session.userRole !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const updateData = req.body;

      // Remove empty password fields
      if (updateData.password === '') {
        delete updateData.password;
      }

      const updatedUser = await storage.updateUser(id, updateData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Prevent deleting yourself
      if (req.session.userId === id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      await storage.deleteUser(id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.patch("/api/users/:id/status", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const updatedUser = await storage.updateUserStatus(id, isActive);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  // Get current user info (Admin)
  app.get("/api/admin/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user is admin
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Don't send password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get current user info (Staff)
  app.get("/api/staff/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user is staff or admin
      if (user.role !== 'staff' && user.role !== 'admin') {
        return res.status(403).json({ message: "Staff access required" });
      }
      
      // Don't send password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Customer Reviews Routes
  app.get("/api/customer-reviews", async (req, res) => {
    try {
      // If no published query param, get all reviews for admin management
      const published = req.query.published === 'true' ? true : req.query.published === 'false' ? false : undefined;
      const reviews = await storage.getCustomerReviews(published);
      res.json(reviews);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/customer-reviews/published", async (req, res) => {
    try {
      const reviews = await storage.getPublishedReviews();
      res.json(reviews);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/customer-reviews/:id", async (req, res) => {
    try {
      const review = await storage.getCustomerReview(req.params.id);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }
      res.json(review);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/customer-reviews", requireAuth, async (req, res) => {
    try {
      // Check current review count before allowing creation
      const existingReviews = await storage.getCustomerReviews();
      
      if (existingReviews.length >= 8) {
        return res.status(400).json({ 
          message: "Đã đạt giới hạn tối đa 8 đánh giá. Vui lòng xóa đánh giá cũ trước khi thêm mới." 
        });
      }

      const parsed = insertCustomerReviewSchema.parse(req.body);
      const review = await storage.createCustomerReview(parsed);
      res.json(review);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/customer-reviews/:id", requireAuth, async (req, res) => {
    try {
      const review = await storage.updateCustomerReview(req.params.id, req.body);
      res.json(review);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/customer-reviews/:id/pin", requireAuth, async (req, res) => {
    try {
      const review = await storage.toggleReviewPin(req.params.id);
      res.json(review);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/customer-reviews/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteCustomerReview(req.params.id);
      res.json({ message: "Review deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Media Management APIs
  app.get("/api/media/list", async (req, res) => {
    try {
      const files = [
        {
          name: "logo.humpizza.png",
          url: "/public-objects/materials/logo.humpizza.png",
          category: "logos",
          description: "Hum's Pizza Logo"
        },
        {
          name: "hero.landingpage.mp4",
          url: "/public-objects/materials/hero.landingpage.mp4",
          category: "videos",
          description: "Hero Landing Page Video"
        },
        {
          name: "favicon.png",
          url: "/public-objects/materials/favicon.png",
          category: "icons",
          description: "Website Favicon"
        }
      ];
      res.json(files);
    } catch (error: any) {
      console.error("Error listing media files:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/media/upload", requireAuth, async (req, res) => {
    try {
      const { fileName } = req.body;
      if (!fileName) {
        return res.status(400).json({ error: "fileName is required" });
      }
      
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getImageUploadURL();
      res.json({ uploadURL });
    } catch (error: any) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Upload hero video to object storage and then to attached_assets
  app.post("/api/upload-hero-video", requireAuth, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getImageUploadURL();
      res.json({ uploadURL });
    } catch (error: any) {
      console.error("Error getting video upload URL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Save uploaded video URL to pending state (not yet committed to attached_assets)
  app.post("/api/save-hero-video", requireAuth, async (req, res) => {
    try {
      const { videoUrl, videoType } = req.body; // videoType: 'hero' or 'reservation'
      if (!videoUrl || !videoType) {
        return res.status(400).json({ error: "videoUrl and videoType are required" });
      }

      // Save pending video URL to home content
      const homeContent = await storage.getHomeContent();
      const updateData = {
        ...homeContent,
        ...(videoType === 'hero' 
          ? { pendingHeroVideoUrl: videoUrl }
          : { pendingReservationVideoUrl: videoUrl }
        )
      };
      
      await storage.updateHomeContent(updateData);
      
      res.json({ 
        success: true, 
        videoType,
        videoUrl,
        message: `Video ${videoType} đã được lưu tạm và sẽ áp dụng khi bấm "Lưu thay đổi"!`
      });
    } catch (error: any) {
      console.error("Error saving hero video:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Check hero videos status (including pending videos)
  app.get("/api/hero-videos/status", async (req, res) => {
    try {
      // Get pending video URLs from home content
      const homeContent = await storage.getHomeContent();
      
      const videos = [
        { type: 'hero', fileName: 'hero.landingpage.mp4', displayName: 'Video Hero Chính' },
        { type: 'reservation', fileName: 'hero2.landingpage.mp4', displayName: 'Video Hero Phần Đặt Bàn' }
      ];
      
      const status = videos.map(video => {
        const filePath = path.join(process.cwd(), 'attached_assets', video.fileName);
        const exists = fs.existsSync(filePath);
        let fileSize = 0;
        let lastModified = null;
        let videoUrl = null;
        let isPending = false;
        
        // Check for pending video first
        const pendingUrl = video.type === 'hero' 
          ? homeContent?.pendingHeroVideoUrl 
          : homeContent?.pendingReservationVideoUrl;
          
        if (pendingUrl) {
          isPending = true;
          videoUrl = pendingUrl; // Use object storage URL for pending
          // Try to get file info from object storage if possible
          fileSize = 0; // Will be determined by frontend
          lastModified = new Date().toISOString(); // Current time as pending indicator
        } else if (exists) {
          const stats = fs.statSync(filePath);
          fileSize = Math.round(stats.size / 1024 / 1024 * 100) / 100; // MB with 2 decimals
          lastModified = stats.mtime.toISOString();
          videoUrl = `/api/assets/${video.fileName}`;
        }
        
        return {
          type: video.type,
          fileName: video.fileName,
          displayName: video.displayName,
          exists: exists || isPending,
          fileSize: fileSize > 0 ? `${fileSize} MB` : (isPending ? 'Đang chờ lưu...' : null),
          lastModified,
          url: videoUrl,
          isPending
        };
      });
      
      res.json(status);
    } catch (error: any) {
      console.error("Error checking hero videos status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Download video from object storage to attached_assets
  app.post("/api/restore-videos", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      
      const videoFiles = ['hero.landingpage.mp4', 'hero2.landingpage.mp4'];
      const results: any[] = [];
      
      for (const fileName of videoFiles) {
        try {
          const file = await objectStorageService.searchPublicObject(fileName);
          if (file) {
            const localPath = path.join(process.cwd(), 'attached_assets', fileName);
            const writeStream = fs.createWriteStream(localPath);
            const readStream = file.createReadStream();
            
            await new Promise((resolve, reject) => {
              readStream.pipe(writeStream);
              writeStream.on('finish', resolve);
              writeStream.on('error', reject);
            });
            
            results.push({ fileName, status: 'downloaded', path: localPath });
          } else {
            results.push({ fileName, status: 'not_found' });
          }
        } catch (error: any) {
          results.push({ fileName, status: 'error', error: error.message });
        }
      }
      
      res.json({ success: true, results });
    } catch (error: any) {
      console.error("Error restoring videos:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // News Images Upload API
  app.post("/api/news-images/upload", requireAuth, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getImageUploadURL();
      res.json({ uploadURL });
    } catch (error: any) {
      console.error("Error getting news image upload URL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Customization Schema APIs
  app.get("/api/customization-schemas", async (req, res) => {
    try {
      const schemas = await storage.getCustomizationSchemas();
      res.json(schemas);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/customization-schemas/:id", async (req, res) => {
    try {
      const schema = await storage.getCustomizationSchema(req.params.id);
      if (!schema) {
        return res.status(404).json({ message: "Schema not found" });
      }
      res.json(schema);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Custom validation for customization schema constraints
  const validateCustomizationSchemaConstraints = (data: any) => {
    const errors: string[] = [];
    
    // Validate single_choice_options constraints
    if (data.type === "single_choice_options") {
      // Ensure config exists
      if (!data.config) {
        data.config = {};
      }
      
      // Require maxSelections to be exactly 1
      if (data.config.maxSelections !== 1) {
        errors.push("single_choice_options must have maxSelections = 1");
        data.config.maxSelections = 1; // Normalize
      }
      
      // Require allowMultiple to be false
      if (data.config.allowMultiple !== false) {
        errors.push("single_choice_options must have allowMultiple = false");
        data.config.allowMultiple = false; // Normalize
      }
    }
    
    // Validate additional_toppings constraints
    if (data.type === "additional_toppings" && data.config) {
      const { minSelections, maxSelections, allowMultiple } = data.config;
      
      // Min/Max relationship validation
      if (minSelections !== undefined && maxSelections !== undefined) {
        if (minSelections > maxSelections) {
          errors.push("minSelections cannot be greater than maxSelections");
        }
      }
      
      // Range validation
      if (minSelections !== undefined && minSelections < 0) {
        errors.push("minSelections cannot be negative");
      }
      if (maxSelections !== undefined && maxSelections < 1) {
        errors.push("maxSelections must be at least 1");
      }
      
      // Logic consistency validation
      if (maxSelections === 1 && allowMultiple === true) {
        errors.push("allowMultiple cannot be true when maxSelections is 1");
      }
      if (allowMultiple === false && maxSelections !== undefined && maxSelections > 1) {
        errors.push("allowMultiple must be true when maxSelections > 1");
      }
    }
    
    return errors;
  };

  app.post("/api/customization-schemas", requireAuth, async (req, res) => {
    try {
      const validatedData = insertCustomizationSchemaSchema.parse(req.body);
      
      // Custom constraint validation
      const constraintErrors = validateCustomizationSchemaConstraints(validatedData);
      if (constraintErrors.length > 0) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: constraintErrors 
        });
      }
      
      const schema = await storage.createCustomizationSchema(validatedData);
      res.json(schema);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/customization-schemas/:id", requireAuth, async (req, res) => {
    try {
      const updateData = insertCustomizationSchemaSchema.partial().parse(req.body);
      
      // For updates, get the existing schema to validate the complete data
      if (updateData.type || updateData.config) {
        const existingSchema = await storage.getCustomizationSchema(req.params.id);
        if (!existingSchema) {
          return res.status(404).json({ message: "Schema not found" });
        }
        
        // Merge update with existing data for validation
        const mergedData = {
          ...existingSchema,
          ...updateData,
          // CRITICAL FIX: For additional_toppings, completely replace config instead of merging
          // This prevents old toppings from overwriting new toppings
          config: updateData.config ? updateData.config : (existingSchema.config || {})
        };
        
        // Custom constraint validation on merged data
        const constraintErrors = validateCustomizationSchemaConstraints(mergedData);
        if (constraintErrors.length > 0) {
          return res.status(400).json({ 
            message: "Validation failed", 
            errors: constraintErrors 
          });
        }
      }
      
      const schema = await storage.updateCustomizationSchema(req.params.id, updateData);
      
      res.json(schema);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/customization-schemas/:id/clone", requireAuth, async (req, res) => {
    try {
      const clonedSchema = await storage.cloneCustomizationSchema(req.params.id);
      res.json(clonedSchema);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/customization-schemas/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteCustomizationSchema(req.params.id);
      res.json({ message: "Schema deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Serve static assets from attached_assets directory with aggressive caching
  app.use('/api/assets', express.static(path.join(process.cwd(), 'attached_assets'), {
    maxAge: '365d', // Cache for 1 year
    immutable: true,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.mp4')) {
        res.set('Content-Type', 'video/mp4');
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        res.set('Accept-Ranges', 'bytes');
      } else if (filePath.endsWith('.webm')) {
        res.set('Content-Type', 'video/webm');
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        res.set('Accept-Ranges', 'bytes');
      }
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Expires', new Date(Date.now() + 31536000000).toUTCString());
    }
  }));

  // Blog Post SEO Routes - Server-side rendering for SEO
  // Server-side rendering for SEO - support both slug and ID
  app.get("/news/:slug", async (req, res, next) => {
    const userAgent = req.get('User-Agent') || '';
    const isBot = /bot|crawler|spider|crawling|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|slackbot|vkShare|W3C_Validator/i.test(userAgent);
    
    if (!isBot) {
      // This is a real user - let client-side routing handle it
      return next();
    }
    
    // This is a bot - serve SEO content
    try {
      const slug = req.params.slug;
      let post = await storage.getBlogPostBySlug(slug);
      if (!post) {
        post = await storage.getBlogPost(slug);
      }

      if (!post) {
        return next();
      }

      // Determine language based on slug
      let detectedLanguage = 'en';
      if (post) {
        if (slug === post.slugVi) {
          detectedLanguage = 'vi';
        } else if (slug === post.slug) {
          detectedLanguage = 'en';
        }
      }

      // Generate server-side HTML with SEO metadata based on detected language
      const seoTitle = detectedLanguage === 'vi' ? 
        (post.metaTitleVi || post.titleVi || post.metaTitle || post.title) :
        (post.metaTitle || post.title);
      const seoDescription = detectedLanguage === 'vi' ? 
        (post.metaDescriptionVi || post.excerptVi || post.metaDescription || post.excerpt || '') :
        (post.metaDescription || post.excerpt || '');
      const keywords = detectedLanguage === 'vi' ? 
        (post.keywordsVi || post.keywords || '') :
        (post.keywords || '');
      const canonicalUrl = post.canonicalUrl || `${req.protocol}://${req.get('host')}/news/${slug}`;
      
      // Simple HTML template with proper SEO metadata
      const html = `<!DOCTYPE html>
<html lang="${detectedLanguage}">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <link rel="icon" type="image/png" href="/public-objects/materials/favicon.png" />
    
    <!-- SEO Meta Tags -->
    <title>${seoTitle}</title>
    <meta name="description" content="${seoDescription}" />
    ${keywords ? `<meta name="keywords" content="${keywords}" />` : ''}
    
    <!-- Open Graph Tags -->
    <meta property="og:title" content="${seoTitle}" />
    <meta property="og:description" content="${seoDescription}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:site_name" content="Hum's Pizza" />
    ${post.imageUrl ? `<meta property="og:image" content="${post.imageUrl}" />` : ''}
    <meta property="article:published_time" content="${new Date(post.createdAt).toISOString()}" />
    <meta property="article:modified_time" content="${new Date(post.updatedAt).toISOString()}" />
    <meta property="article:author" content="Hum's Pizza Team" />
    
    <!-- Twitter Card Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${seoTitle}" />
    <meta name="twitter:description" content="${seoDescription}" />
    ${post.imageUrl ? `<meta name="twitter:image" content="${post.imageUrl}" />` : ''}
    
    <!-- Canonical URL -->
    <link rel="canonical" href="${canonicalUrl}" />
    
    <!-- JSON-LD Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": "${seoTitle}",
      "description": "${seoDescription}",
      "image": "${post.imageUrl || ''}",
      "author": {
        "@type": "Organization",
        "name": "Hum's Pizza Team"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Hum's Pizza",
        "logo": {
          "@type": "ImageObject",
          "url": "${req.protocol}://${req.get('host')}/public-objects/materials/logo.humpizza.png"
        }
      },
      "datePublished": "${new Date(post.createdAt).toISOString()}",
      "dateModified": "${new Date(post.updatedAt).toISOString()}",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "${canonicalUrl}"
      }
    }
    </script>
</head>
<body style="background: #000; color: #fff; font-family: 'DM Sans', sans-serif; padding: 2rem; text-align: center;">
    <h1>${post.title}</h1>
    <p>${post.excerpt || ''}</p>
    <p>Hum's Pizza | Connecting Hearts, Authentic Vietnamese Taste</p>
</body>
</html>`;

      res.set('Content-Type', 'text/html').send(html);
    } catch (error) {
      console.error('Blog SEO route error:', error);
      next();
    }
  });

  // About Content API (public read, admin write)
  app.get("/api/about-content", async (req, res) => {
    try {
      const content = await storage.getAboutContent();
      res.json(content);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/about-content", requireAdmin, async (req, res) => {
    try {
      const validation = insertAboutContentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: validation.error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message
          }))
        });
      }

      // Check if content exists, update or create
      const existingContent = await storage.getAboutContent();
      let result;
      
      if (existingContent) {
        result = await storage.updateAboutContent(validation.data);
      } else {
        result = await storage.createAboutContent(validation.data);
      }
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Backup & Restore API routes
  app.get("/api/backup/download", requireAdmin, async (req, res) => {
    try {
      console.log('📦 Creating backup for download...');
      const backup = await storage.createBackup();
      
      const fileName = `hums-pizza-backup-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Cache-Control', 'no-cache');
      
      res.json(backup);
      console.log('✅ Backup download completed');
    } catch (error: any) {
      console.error('❌ Backup download failed:', error);
      res.status(500).json({ message: 'Failed to create backup: ' + error.message });
    }
  });

  app.post("/api/backup/upload", requireAdmin, async (req, res) => {
    try {
      console.log('📥 Starting backup restore...');
      const backupData = req.body;
      
      if (!backupData.data) {
        return res.status(400).json({ message: 'Invalid backup format' });
      }
      
      await storage.restoreFromBackup(backupData);
      console.log('✅ Backup restore completed');
      res.json({ message: 'Backup restored successfully' });
    } catch (error: any) {
      console.error('❌ Backup restore failed:', error);
      res.status(500).json({ message: 'Failed to restore backup: ' + error.message });
    }
  });

  app.get("/api/backup/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getBackupStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to get backup stats: ' + error.message });
    }
  });

  // Complete project backup (Source Code + Database)
  app.get("/api/backup/complete", requireAdmin, async (req, res) => {
    try {
      console.log('🎯 Creating complete project backup...');
      
      // Create archive
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });
      
      const fileName = `hums-pizza-complete-backup-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.zip`;
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Cache-Control', 'no-cache');
      
      // Handle archive errors
      archive.on('error', (err: any) => {
        console.error('❌ Archive error:', err);
        res.status(500).json({ message: 'Archive creation failed' });
      });
      
      // Pipe archive to response
      archive.pipe(res);
      
      console.log('📁 Adding source code files...');
      
      // Add project files to archive
      const projectRoot = process.cwd();
      
      // Add frontend source code
      archive.directory(path.join(projectRoot, 'client'), 'client');
      
      // Add backend source code  
      archive.directory(path.join(projectRoot, 'server'), 'server');
      
      // Add shared schemas
      archive.directory(path.join(projectRoot, 'shared'), 'shared');
      
      // Add configuration files
      const configFiles = [
        'package.json',
        'package-lock.json',
        'vite.config.ts',
        'tailwind.config.ts',
        'tsconfig.json',
        'drizzle.config.ts',
        'postcss.config.js',
        '.env.example'
      ];
      
      for (const file of configFiles) {
        const filePath = path.join(projectRoot, file);
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: file });
        }
      }
      
      // Add assets if they exist
      const assetsPath = path.join(projectRoot, 'attached_assets');
      if (fs.existsSync(assetsPath)) {
        archive.directory(assetsPath, 'attached_assets');
      }
      
      console.log('📊 Adding database backup...');
      
      // Create and add database backup
      try {
        const dbBackup = await storage.createBackup();
        const backupFileName = `database-backup-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        archive.append(JSON.stringify(dbBackup, null, 2), { name: backupFileName });
      } catch (dbError) {
        console.error('⚠️ Database backup failed, continuing without it:', dbError);
        archive.append('Database backup failed: ' + dbError, { name: 'database-backup-error.txt' });
      }
      
      // Add README for the backup
      const readmeContent = `# Hum's Pizza Complete Backup

Backup created: ${new Date().toISOString()}

## Contents:
- client/ - Frontend React application
- server/ - Backend Express.js application  
- shared/ - Shared schemas and types
- database-backup-*.json - Complete database export
- Configuration files (package.json, vite.config.ts, etc.)

## How to restore:
1. Extract this ZIP file
2. Run: npm install
3. Set up environment variables (.env)
4. Restore database using the JSON backup file via API
5. Run: npm run dev

## Database Restore:
POST /api/backup/upload
Content-Type: application/json
Body: {contents of database-backup-*.json}

Generated by Hum's Pizza Backup System
`;
      
      archive.append(readmeContent, { name: 'README-BACKUP.md' });
      
      // Finalize the archive
      console.log('🏁 Finalizing backup archive...');
      archive.finalize();
      
      archive.on('end', () => {
        console.log('✅ Complete backup created successfully');
      });
      
    } catch (error: any) {
      console.error('❌ Complete backup failed:', error);
      res.status(500).json({ message: 'Failed to create complete backup: ' + error.message });
    }
  });

  // Backend-only backup (Server code + Config)
  app.get("/api/backup/backend", requireAdmin, async (req, res) => {
    try {
      console.log('🔧 Creating backend-only backup...');
      
      const archive = archiver('zip', { zlib: { level: 9 } });
      const fileName = `hums-pizza-backend-backup-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.zip`;
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Cache-Control', 'no-cache');
      
      archive.on('error', (err: any) => {
        console.error('❌ Backend archive error:', err);
        res.status(500).json({ message: 'Backend backup failed' });
      });
      
      archive.pipe(res);
      
      const projectRoot = process.cwd();
      
      // Add backend source code
      archive.directory(path.join(projectRoot, 'server'), 'server');
      
      // Add shared schemas
      archive.directory(path.join(projectRoot, 'shared'), 'shared');
      
      // Add backend config files
      const backendConfigFiles = [
        'package.json',
        'package-lock.json',
        'tsconfig.json',
        'drizzle.config.ts',
        '.env.example'
      ];
      
      for (const file of backendConfigFiles) {
        const filePath = path.join(projectRoot, file);
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: file });
        }
      }
      
      // Add README for backend
      const backendReadme = `# Hum's Pizza Backend Backup

Backup created: ${new Date().toISOString()}

## Contents:
- server/ - Express.js backend application
- shared/ - Database schemas and shared types
- Backend configuration files

## How to restore:
1. Extract this ZIP file
2. Run: npm install
3. Set up environment variables (.env)
4. Configure database connection
5. Run: npm run dev

Generated by Hum's Pizza Backend Backup System
`;
      archive.append(backendReadme, { name: 'README-BACKEND.md' });
      
      console.log('✅ Backend backup finalized');
      archive.finalize();
      
    } catch (error: any) {
      console.error('❌ Backend backup failed:', error);
      res.status(500).json({ message: 'Failed to create backend backup: ' + error.message });
    }
  });

  // Frontend-only backup (Client code + Assets)
  app.get("/api/backup/frontend", requireAdmin, async (req, res) => {
    try {
      console.log('🎨 Creating frontend-only backup...');
      
      const archive = archiver('zip', { zlib: { level: 9 } });
      const fileName = `hums-pizza-frontend-backup-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.zip`;
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Cache-Control', 'no-cache');
      
      archive.on('error', (err: any) => {
        console.error('❌ Frontend archive error:', err);
        res.status(500).json({ message: 'Frontend backup failed' });
      });
      
      archive.pipe(res);
      
      const projectRoot = process.cwd();
      
      // Add frontend source code
      archive.directory(path.join(projectRoot, 'client'), 'client');
      
      // Add assets if they exist
      const assetsPath = path.join(projectRoot, 'attached_assets');
      if (fs.existsSync(assetsPath)) {
        archive.directory(assetsPath, 'attached_assets');
      }
      
      // Add frontend config files
      const frontendConfigFiles = [
        'vite.config.ts',
        'tailwind.config.ts',
        'postcss.config.js',
        'package.json'
      ];
      
      for (const file of frontendConfigFiles) {
        const filePath = path.join(projectRoot, file);
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: file });
        }
      }
      
      // Add README for frontend
      const frontendReadme = `# Hum's Pizza Frontend Backup

Backup created: ${new Date().toISOString()}

## Contents:
- client/ - React frontend application
- attached_assets/ - Images, videos, static assets
- Frontend configuration files (Vite, Tailwind, etc.)

## How to restore:
1. Extract this ZIP file
2. Run: npm install
3. Set up environment variables if needed
4. Run: npm run dev

## Technologies:
- React + TypeScript
- Vite build tool
- Tailwind CSS
- Shadcn/ui components

Generated by Hum's Pizza Frontend Backup System
`;
      archive.append(frontendReadme, { name: 'README-FRONTEND.md' });
      
      console.log('✅ Frontend backup finalized');
      archive.finalize();
      
    } catch (error: any) {
      console.error('❌ Frontend backup failed:', error);
      res.status(500).json({ message: 'Failed to create frontend backup: ' + error.message });
    }
  });

  // Save backup to object storage
  app.post("/api/backup/save-to-storage", requireAdmin, async (req, res) => {
    try {
      console.log('💾 Saving backup to object storage...');
      
      // Create database backup
      const dbBackup = await storage.createBackup();
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      
      try {
        const objectStorageService = new ObjectStorageService();
        
        // Create backup data
        const backupData = {
          database: dbBackup,
          metadata: {
            version: '1.0',
            createdAt: new Date().toISOString(),
            type: 'database-only',
            source: 'Hum\'s Pizza Restaurant System'
          }
        };
        
        // Get upload URL from object storage
        const uploadURL = await objectStorageService.getObjectEntityUploadURL();
        
        // Upload backup to object storage
        const response = await fetch(uploadURL, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(backupData, null, 2)
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
        }
        
        // Set ACL policy for the uploaded backup
        const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
          uploadURL,
          {
            owner: req.session.userId,
            visibility: "private" // Keep backups private
          }
        );
        
        console.log('✅ Backup saved to object storage successfully');
        res.json({ 
          message: 'Backup saved to storage successfully',
          objectPath,
          timestamp,
          size: JSON.stringify(backupData).length
        });
        
      } catch (storageError) {
        console.error('❌ Object storage error:', storageError);
        res.status(500).json({ message: 'Failed to save to object storage: ' + storageError });
      }
      
    } catch (error: any) {
      console.error('❌ Backup to storage failed:', error);
      res.status(500).json({ message: 'Failed to create backup: ' + error.message });
    }
  });

  // Save backend backup to storage
  app.post("/api/backup/save-backend-to-storage", requireAdmin, async (req, res) => {
    try {
      console.log('🔧 Saving backend backup to object storage...');
      
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      
      // Create backend archive in memory
      const archive = archiver('zip', { zlib: { level: 9 } });
      const chunks: Buffer[] = [];
      
      archive.on('data', (chunk: any) => chunks.push(chunk));
      archive.on('end', async () => {
        try {
          const zipBuffer = Buffer.concat(chunks);
          
          // Upload to storage
          const response = await fetch(uploadURL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/zip' },
            body: zipBuffer
          });
          
          if (!response.ok) {
            throw new Error(`Upload failed: ${response.status}`);
          }
          
          const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
            uploadURL, { owner: req.session.userId, visibility: "private" }
          );
          
          res.json({ 
            message: 'Backend backup saved to storage successfully',
            objectPath,
            size: zipBuffer.length,
            type: 'backend'
          });
          
        } catch (uploadError) {
          console.error('❌ Backend upload error:', uploadError);
          res.status(500).json({ message: 'Failed to upload backend backup' });
        }
      });
      
      const projectRoot = process.cwd();
      archive.directory(path.join(projectRoot, 'server'), 'server');
      archive.directory(path.join(projectRoot, 'shared'), 'shared');
      
      const backendConfigFiles = ['package.json', 'tsconfig.json', 'drizzle.config.ts'];
      for (const file of backendConfigFiles) {
        const filePath = path.join(projectRoot, file);
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: file });
        }
      }
      
      archive.finalize();
      
    } catch (error: any) {
      console.error('❌ Backend backup to storage failed:', error);
      res.status(500).json({ message: 'Failed to save backend backup: ' + error.message });
    }
  });

  // Save frontend backup to storage  
  app.post("/api/backup/save-frontend-to-storage", requireAdmin, async (req, res) => {
    try {
      console.log('🎨 Saving frontend backup to object storage...');
      
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      
      // Create frontend archive in memory
      const archive = archiver('zip', { zlib: { level: 9 } });
      const chunks: Buffer[] = [];
      
      archive.on('data', (chunk: any) => chunks.push(chunk));
      archive.on('end', async () => {
        try {
          const zipBuffer = Buffer.concat(chunks);
          
          // Upload to storage
          const response = await fetch(uploadURL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/zip' },
            body: zipBuffer
          });
          
          if (!response.ok) {
            throw new Error(`Upload failed: ${response.status}`);
          }
          
          const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
            uploadURL, { owner: req.session.userId, visibility: "private" }
          );
          
          res.json({ 
            message: 'Frontend backup saved to storage successfully',
            objectPath,
            size: zipBuffer.length,
            type: 'frontend'
          });
          
        } catch (uploadError) {
          console.error('❌ Frontend upload error:', uploadError);
          res.status(500).json({ message: 'Failed to upload frontend backup' });
        }
      });
      
      const projectRoot = process.cwd();
      archive.directory(path.join(projectRoot, 'client'), 'client');
      
      const assetsPath = path.join(projectRoot, 'attached_assets');
      if (fs.existsSync(assetsPath)) {
        archive.directory(assetsPath, 'attached_assets');
      }
      
      const frontendConfigFiles = ['vite.config.ts', 'tailwind.config.ts', 'postcss.config.js'];
      for (const file of frontendConfigFiles) {
        const filePath = path.join(projectRoot, file);
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: file });
        }
      }
      
      archive.finalize();
      
    } catch (error: any) {
      console.error('❌ Frontend backup to storage failed:', error);
      res.status(500).json({ message: 'Failed to save frontend backup: ' + error.message });
    }
  });

  // Notifications endpoints
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const isRead = req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined;
      const notifications = await storage.getNotifications(isRead);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/notifications/unread-count", requireAuth, async (req, res) => {
    try {
      const count = await storage.getUnreadNotificationCount();
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/notifications/:id", requireAuth, async (req, res) => {
    try {
      const notification = await storage.getNotification(req.params.id);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json(notification);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/notifications", requireAuth, async (req, res) => {
    try {
      const notificationData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(notificationData);
      res.status(201).json(notification);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const notification = await storage.markNotificationAsRead(req.params.id);
      res.json(notification);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/notifications/mark-all-read", requireAuth, async (req, res) => {
    try {
      await storage.markAllNotificationsAsRead();
      res.json({ message: "All notifications marked as read" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/notifications/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteNotification(req.params.id);
      res.json({ message: "Notification deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/notifications/delete-all", requireAuth, async (req, res) => {
    try {
      // Direct database deletion using raw SQL
      await db.execute(sql`DELETE FROM notifications`);
      res.json({ message: "All notifications deleted successfully" });
    } catch (error: any) {
      console.error("Delete all notifications error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // List saved backups in storage
  app.get("/api/backup/list-storage", requireAdmin, async (req, res) => {
    try {
      // This is a simplified version - in production you'd have a proper index
      res.json({ 
        message: 'Backup listing from storage',
        note: 'Backups are stored in private object storage. Use the object storage panel to view files.'
      });
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to list backups: ' + error.message });
    }
  });

  // Page SEO & Open Graph Management
  // List all pages (admin only)
  app.get("/api/seo/pages", requireAdmin, async (req, res) => {
    try {
      const pageSeoData = await storage.listPageSeo();
      res.json(pageSeoData);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get specific page SEO data (public - used by pages for meta tags)
  app.get("/api/seo/pages/:pageKey/:language", async (req, res) => {
    try {
      const { pageKey, language } = req.params;
      const pageSeoData = await storage.getPageSeoWithFallback(pageKey, language);
      
      if (!pageSeoData) {
        return res.status(404).json({ message: "Page SEO data not found" });
      }
      
      res.json(pageSeoData);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/seo/pages", requireAdmin, async (req, res) => {
    try {
      const validation = insertPageSeoSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid page SEO data", 
          errors: validation.error.issues 
        });
      }

      const pageSeoData = await storage.upsertPageSeo(validation.data);
      res.json(pageSeoData);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/seo/pages/:pageKey/:language", requireAdmin, async (req, res) => {
    try {
      const { pageKey, language } = req.params;
      const updates = req.body;
      
      const pageSeoData = await storage.updatePageSeo(pageKey, language, updates);
      res.json(pageSeoData);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/seo/pages/:pageKey/:language", requireAdmin, async (req, res) => {
    try {
      const { pageKey, language } = req.params;
      await storage.deletePageSeo(pageKey, language);
      res.json({ message: "Page SEO data deleted successfully" });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // SEO Routes
  // Sitemap.xml - Dynamic sitemap generation
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const blogPosts = await storage.getBlogPosts();
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      const staticPages = [
        { url: '/', priority: '1.0', changefreq: 'daily' },
        { url: '/menu', priority: '0.9', changefreq: 'weekly' },
        { url: '/about', priority: '0.8', changefreq: 'monthly' },
        { url: '/contact', priority: '0.7', changefreq: 'monthly' },
        { url: '/booking', priority: '0.9', changefreq: 'weekly' },
        { url: '/news', priority: '0.8', changefreq: 'weekly' },
        { url: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
        { url: '/terms-of-service', priority: '0.3', changefreq: 'yearly' },
        { url: '/accessibility', priority: '0.3', changefreq: 'yearly' },
      ];

      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

      // Add static pages
      staticPages.forEach(page => {
        sitemap += `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
      });

      // Add blog posts
      blogPosts.forEach((post: any) => {
        const lastmod = new Date(post.updatedAt).toISOString().split('T')[0];
        sitemap += `
  <url>
    <loc>${baseUrl}/news/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
      });

      sitemap += `
</urlset>`;

      res.set('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('Sitemap generation error:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Robots.txt
  app.get("/robots.txt", (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    const robotsContent = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /staff/
Disallow: /login

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Allow search engines to index public content
Allow: /menu
Allow: /about  
Allow: /contact
Allow: /booking
Allow: /news/
Allow: /privacy-policy
Allow: /terms-of-service
Allow: /accessibility`;

    res.set('Content-Type', 'text/plain');
    res.send(robotsContent);
  });

  const httpServer = createServer(app);
  return httpServer;
}
