# FV Bodegones E-Commerce Store

## Overview

FV Bodegones is a modern, responsive e-commerce web application designed for a local grocery store ("bodega"). The platform enables customers to browse products by category, add items to a shopping cart, and place orders. It includes an administrative panel for managing categories, products, orders, users, and site settings. The application is built with a focus on mobile-first design, warm and trustworthy aesthetics using earth tones, and a clean user experience inspired by modern e-commerce platforms like Shopify and Mercado Libre.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build Tool:**
- React 18+ with TypeScript for type safety
- Vite as the build tool and development server
- React Router (wouter) for client-side routing

**UI Components:**
- Radix UI primitives for accessible, unstyled components
- shadcn/ui component system with the "new-york" style variant
- Tailwind CSS for styling with custom design tokens
- Custom color palette using HSL values with CSS variables for light/dark mode support

**State Management:**
- TanStack Query (React Query) for server state management and data fetching
- Local React state (useState) for UI state like cart items, selected categories, and dialog visibility
- Session-based authentication state

**Design System:**
- Typography: Inter (primary), Sora (accent/headers) from Google Fonts
- Color scheme: Earth tones (browns, greens) with warm accents for trust and familiarity
- Mobile-first responsive design with breakpoints at 768px (md) and 1024px (lg)
- Custom border radius tokens (.1875rem, .375rem, .5625rem)

**Key Features:**
- Dynamic category browsing with expandable product grids
- Shopping cart with support for both unit-based and weight-based products
- Real-time cart updates and calculations
- Admin panel with CRUD operations for all entities
- Order management system with status tracking

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript
- Session-based authentication using express-session
- RESTful API design pattern

**API Structure:**
- `/api/categories` - Category management endpoints
- `/api/products` - Product management endpoints
- `/api/orders` - Order creation and status updates
- `/api/admin/users` - Administrative user management
- `/api/settings` - Site configuration management
- `/api/auth/login` - Authentication endpoints

**Database Layer:**
- PostgreSQL as the primary database
- Drizzle ORM for type-safe database queries
- Schema-first design with shared TypeScript types between client and server
- Migration support via drizzle-kit

**Session Management:**
- HTTP-only cookies for security
- Configurable session secret via environment variables
- 7-day session expiration

**Data Validation:**
- Zod schemas for runtime type validation
- Drizzle-zod integration for schema-to-validator conversion
- Shared validation schemas between client and server

### External Dependencies

**Database:**
- PostgreSQL via Neon serverless driver (@neondatabase/serverless)
- Connection via DATABASE_URL environment variable
- Drizzle ORM (v0.39.1) for query building and type safety

**UI Component Libraries:**
- @radix-ui/* - Comprehensive set of accessible UI primitives (dialogs, dropdowns, tooltips, etc.)
- embla-carousel-react - Carousel/slider functionality
- lucide-react - Icon system
- cmdk - Command palette component
- vaul - Drawer component

**Form Handling:**
- react-hook-form - Form state management
- @hookform/resolvers - Integration with Zod validation

**Utilities:**
- date-fns - Date manipulation and formatting
- class-variance-authority - Component variant management
- clsx & tailwind-merge - Conditional className utilities
- nanoid - Unique ID generation

**Development Tools:**
- Replit-specific plugins for development (@replit/vite-plugin-*)
- TypeScript compiler with strict mode enabled
- PostCSS with Tailwind CSS and Autoprefixer

**Third-Party Services:**
- Google Fonts API (Inter, Sora fonts)
- Image hosting via imageUrl fields (currently local/external URLs)

**Authentication:**
- Session-based authentication (no external auth provider)
- Password storage (implementation details in storage layer)

**Build & Deployment:**
- esbuild for server bundling
- Vite for client bundling
- Static asset serving in production mode