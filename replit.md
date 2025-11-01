# Overview

Hum's Pizza is a full-stack web application for a Vietnamese pizza restaurant, aiming to provide an elegant digital presence. It features online menu browsing, table reservations, online ordering, a blog system, and customer reviews. The project emphasizes a warm dark theme with gold accents, reflecting a welcoming yet quality-focused brand. The business vision is to connect hearts with authentic Vietnamese taste, leveraging market potential through a comprehensive online platform.

# User Preferences

Preferred communication style: Simple, everyday language.
Interface preferences: Clean, minimal header - no redundant admin display in header since logout is available in dashboard.

# System Architecture

## Frontend Architecture
The frontend is built with React, TypeScript, and Vite. It uses a component-based architecture leveraging Wouter for routing, React Context API for cart management, and TanStack Query for server state. UI components are built with Shadcn/ui (based on Radix UI primitives), styled with Tailwind CSS, and forms are managed with React Hook Form and Zod validation.

## Backend Architecture
The backend is a REST API built with Express.js and TypeScript. It uses Drizzle ORM for type-safe database operations with PostgreSQL (Neon Database). Environment variables are managed through dotenv, loaded at application startup via `import 'dotenv/config'` to ensure configuration is available before module initialization. It provides RESTful endpoints for all major resources and includes centralized error handling.

## Database Schema Design
The relational database schema includes core entities for Users (authentication, roles), Categories (menu organization), Menu Items (multilingual product catalog), Reservations (table booking), Orders (online ordering), Blog Posts (content management), and Contact Messages (customer inquiries).

## Data Management & Scalability Strategy
The system employs a tiered storage system, archiving data older than 6 months to separate tables to prevent database bloat. It includes manual and automated archiving, database indexing for performance, real-time storage monitoring, and automated daily backups. Comprehensive analytics and reports track revenue, orders, and reservations, alongside real-time status management for orders and reservations with audit trails.

## Authentication & Authorization
Session-based authentication is implemented using a PostgreSQL session store. It supports role-based access for admin, staff, and customers, ensuring secure session handling and password hashing.

## State Management Strategy
Client-side state is managed using React Context for the shopping cart and UI state. Server-side state relies on TanStack Query for data caching and synchronization, while React Hook Form handles complex form state and validation.

## UI/UX Decisions
The application features a warm dark theme with gold accents, a clean and minimal header design, and a custom scrollbar that is hidden but functional across the entire website. SEO is database-driven, allowing dynamic updates to meta titles, descriptions, and Open Graph images, with full bilingual support (Vietnamese/English) and an intelligent fallback mechanism.

## System Design Choices
All pages leverage dynamic SEO metadata fetched from an API, and comprehensive SEO includes sitemap.xml and robots.txt generation. A unified login page handles both admin and staff users, and an advanced customization management system allows for dynamic pricing configurations and base schema protection with cloning capabilities. The system supports full Vietnamese/English language switching across all content, and pricing is handled in Vietnamese Dong (VND).

# External Dependencies

## Database Services
- **Custom PostgreSQL Server**: Self-hosted PostgreSQL at s88d63.cloudnetwork.vn
- **pg**: Standard PostgreSQL driver for Node.js (replaced @neondatabase/serverless)
- Database: `hum94111_pizza`
- User: `hum94111_pizza_user`
- SSL: Enabled (using domain name for certificate compatibility)

## UI & Styling Framework
- **Shadcn/ui**: Pre-built component library based on Radix UI.
- **Radix UI**: Headless UI primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.

## Development & Build Tools
- **Vite**: Frontend build tool and development server.
- **TypeScript**: Static type checking.
- **ESBuild**: Fast JavaScript bundler for backend.
- **PostCSS**: CSS processing.

## Data Management
- **Drizzle ORM**: Type-safe database operations.
- **Zod**: Runtime type validation.
- **TanStack Query**: Server state management.

## Payment Processing
- **Stripe**: Payment processing integration (Stripe.js and React Stripe.js).

## Additional Libraries
- **Date-fns**: Date manipulation and formatting.
- **Class Variance Authority**: Component variant handling.
- **CLSX & Tailwind Merge**: Conditional CSS class management.