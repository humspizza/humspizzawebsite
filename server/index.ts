import 'dotenv/config';

import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { seedUsers } from "./seed";
import { seedAboutContent } from "./seed-about";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";

// Extend Express session interface
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    userRole?: string;
  }
}

const app = express();

// Trust proxy when behind reverse proxy (required for secure cookies in production)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Increase body parser limits for file uploads (avatars)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: false }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'noir-cuisine-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Enable secure cookies in production
    maxAge: 120 * 60 * 1000, // 2 hours (matches frontend timeout)
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Add caching headers and MIME types for video assets
app.use('/api/assets', (req, res, next) => {
  if (req.path.endsWith('.mp4')) {
    res.set('Content-Type', 'video/mp4');
    res.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.set('Expires', new Date(Date.now() + 3600000).toUTCString());
    res.set('Accept-Ranges', 'bytes');
    res.set('Access-Control-Allow-Origin', '*');
  } else if (req.path.endsWith('.webm')) {
    res.set('Content-Type', 'video/webm');
    res.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.set('Accept-Ranges', 'bytes');
    res.set('Access-Control-Allow-Origin', '*');
  } else if (req.path.endsWith('.mov')) {
    res.set('Content-Type', 'video/quicktime');
    res.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.set('Accept-Ranges', 'bytes');
    res.set('Access-Control-Allow-Origin', '*');
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Crawler meta tags injection for SEO - handles Facebook, Twitter, WhatsApp, etc.
app.use(async (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  
  // Detect social media crawlers
  const isCrawler = /facebookexternalhit|twitterbot|LinkedInBot|WhatsApp|TelegramBot|Slackbot/i.test(userAgent);
  
  // Only handle blog post URLs from crawlers
  if (isCrawler && req.path.startsWith('/news/') && !req.path.includes('.')) {
    const slug = req.path.replace('/news/', '').split('?')[0];
    
    if (slug && slug !== 'undefined') {
      try {
        const post = await storage.getBlogPostBySlug(slug);
        
        if (post) {
          const metaTitle = post.metaTitle || post.title;
          const metaDescription = post.metaDescription || post.excerpt;
          const ogImage = post.ogImageUrl || post.coverImageUrl || post.imageUrl;
          const fullImageUrl = ogImage?.startsWith('http') ? ogImage : `${req.protocol}://${req.get('host')}${ogImage}`;
          const canonicalUrl = post.canonicalUrl || `${req.protocol}://${req.get('host')}/news/${slug}`;
          
          // Return simple HTML with meta tags for crawlers
          const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${metaTitle}</title>
  <meta name="description" content="${metaDescription}" />
  
  <!-- Open Graph Meta Tags -->
  <meta property="og:title" content="${metaTitle}" />
  <meta property="og:description" content="${metaDescription}" />
  <meta property="og:image" content="${fullImageUrl}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Hum's Pizza" />
  
  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${metaTitle}" />
  <meta name="twitter:description" content="${metaDescription}" />
  <meta name="twitter:image" content="${fullImageUrl}" />
  
  <link rel="canonical" href="${canonicalUrl}" />
  <meta http-equiv="refresh" content="0;url=${canonicalUrl}" />
</head>
<body>
  <h1>${metaTitle}</h1>
  <p>${metaDescription}</p>
  <p>Redirecting to article...</p>
</body>
</html>`;
          
          return res.set('Content-Type', 'text/html').send(html);
        }
      } catch (error) {
        console.error('❌ Error fetching blog post for crawler:', error);
      }
    }
  }
  
  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Initialize seed data
  await seedUsers();
  await seedAboutContent();
  await seedHomeContent();
  
  // Initialize auto archive system
  await initAutoArchiveSystem();

async function seedHomeContent() {
  try {
    const existingHomeContent = await storage.getHomeContent();
    if (!existingHomeContent) {
      await storage.createHomeContent({
        heroTitle: "Connecting Hearts, Authentic Vietnamese Taste",
        heroTitleVi: "Gắn Kết Yêu Thương, Đậm Đà Vị Việt. Tạo nên những khoảnh khắc đáng nhớ cho mọi gia đình thông qua món ăn ngon và trải nghiệm ấm áp.",
        featuredTitle: "Featured Dishes",
        featuredTitleVi: "Các Món Đặc Trưng",
        featuredSubtitle: "Signature Delights",
        featuredSubtitleVi: "Món Ăn Đặc Sắc",
        reservationTitle: "Reserve Your Experience",
        reservationTitleVi: "Đặt Bàn Trải Nghiệm",
        reservationSubtitle: "Book your table for an unforgettable culinary journey",
        reservationSubtitleVi: "Đặt bàn và để chúng tôi tạo nên hành trình ẩm thực khó quên dành cho bạn",
        reviewsTitle: "What Our Customers Say",
        reviewsTitleVi: "Khách Hàng Nói Gì",
        reviewsSubtitle: "Authentic feedback from our valued customers",
        reviewsSubtitleVi: "Những phản hồi chân thật từ khách hàng về trải nghiệm pizza thủ công tại Hum's Pizza",
        blogTitle: "Latest Stories",
        blogTitleVi: "Câu Chuyện Mới Nhất",
        blogSubtitle: "Stay updated with our latest culinary adventures and restaurant news",
        blogSubtitleVi: "Cập nhật những cuộc phiêu lưu ẩm thực và tin tức nhà hàng",
        isActive: true
      });
      console.log("✓ Home content created");
    } else {
      console.log("✓ Home content already exists");
    }
  } catch (error) {
    console.error("Failed to check/create home content:", error);
  }
}

// Auto archive system - runs every 3 months to prevent database overload
async function initAutoArchiveSystem() {
  try {
    // Check if we need to run archiving on startup
    const stats = await storage.getDataStatistics();
    
    // If we have old data (3+ months), run archiving
    if (stats.oldOrders > 0 || stats.oldReservations > 0) {
      console.log(`🗂️ Auto-archiving detected: ${stats.oldOrders} old orders, ${stats.oldReservations} old reservations`);
      const result = await storage.archiveOldData('3months');
      console.log(`✓ Auto-archive completed: ${result.orders} orders, ${result.reservations} reservations archived`);
    }

    // Set up daily check for archiving (every 24 hours)
    const oneDayMs = 24 * 60 * 60 * 1000;
    setInterval(async () => {
      try {
        // Check if we have old data (3+ months) before archiving
        const stats = await storage.getDataStatistics();
        
        if (stats.oldOrders > 0 || stats.oldReservations > 0) {
          console.log("🗂️ Running scheduled data archiving...");
          const result = await storage.archiveOldData('3months');
          console.log(`✓ Scheduled archive completed: ${result.orders} orders, ${result.reservations} reservations archived`);
        }
        // Only log if there's data to archive to avoid spam
      } catch (error) {
        console.error("❌ Scheduled archiving failed:", error);
      }
    }, oneDayMs);

    console.log("✓ Auto-archive system initialized - data cleanup every 3 months");
  } catch (error) {
    console.error("Failed to initialize auto-archive system:", error);
  }
}

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  log("📋 About to setup Vite/Static middleware. Crawler middleware should be registered now.");
  if (app.get("env") === "development") {
    await setupVite(app, server);
    log("✅ Vite middleware registered");
  } else {
    serveStatic(app);
    log("✅ Static middleware registered");
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
