# Design Guidelines: FV BODEGONES E-Commerce

## Design Approach

**Selected Approach: Reference-Based (E-Commerce Focus)**

Drawing inspiration from modern e-commerce leaders like Shopify, Mercado Libre, and contemporary grocery delivery apps (Instacart, Cornershop), while adapting to the warm, trustworthy aesthetic of a local bodega.

**Key Design Principles:**
- Trust through warmth: Use earth tones to create familiarity and reliability
- Clarity over complexity: Clean product presentation without visual clutter
- Mobile-first commerce: Touch-friendly interactions, optimal thumb zones
- Quick visual scanning: Clear categorization with strong iconography

## Color Palette

### Light Mode (Primary)
**Primary Colors:**
- Brand Green: `145 45% 35%` - Primary buttons, category highlights, trust indicators
- Earth Brown: `25 30% 25%` - Text, headers, navigation
- Warm Accent: `35 60% 50%` - Price tags, promotional elements, CTAs

**Supporting Colors:**
- Background: `40 15% 97%` - Main background (warm white)
- Card Surface: `0 0% 100%` - Product cards, modal backgrounds
- Border/Divider: `25 10% 85%` - Subtle separators
- Success: `145 50% 40%` - "Agregado al carrito" confirmations
- Error: `0 65% 50%` - Stock alerts, validation errors

### Dark Mode
**Primary Colors:**
- Brand Green: `145 40% 45%` - Adjusted for dark backgrounds
- Light Text: `40 10% 95%` - Primary text
- Warm Accent: `35 55% 55%` - Brightened for contrast

**Supporting Colors:**
- Background: `25 15% 12%` - Main background (warm dark)
- Card Surface: `25 12% 18%` - Elevated surfaces
- Border: `25 8% 25%` - Subtle separators

## Typography

**Font Families (Google Fonts):**
- Primary: 'Inter' - Clean, modern, excellent readability for product info
- Accent: 'Sora' - Headers, category names, brand elements

**Type Scale:**
- H1 (Brand/Hero): 2.5rem (40px), Sora Bold
- H2 (Section Headers): 1.875rem (30px), Sora SemiBold  
- H3 (Category Names): 1.25rem (20px), Sora Medium
- Body (Product Info): 1rem (16px), Inter Regular
- Small (Metadata): 0.875rem (14px), Inter Regular
- Price Display: 1.5rem (24px), Inter Bold
- Button Text: 1rem (16px), Inter Medium

## Layout System

**Spacing Units (Tailwind):** Consistent use of 4, 6, 8, 12, 16, 20 units
- Component padding: `p-4` to `p-6` (mobile), `p-8` (desktop)
- Section spacing: `py-12` (mobile), `py-20` (desktop)
- Card gaps: `gap-4` (mobile), `gap-6` (desktop)
- Product grid: `gap-4` consistently

**Container Strategy:**
- Max width: `max-w-7xl` for main content
- Padding: `px-4 md:px-6 lg:px-8`
- Product grids: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`

## Component Library

### Header (Fixed)
- Sticky navigation with backdrop blur: `sticky top-0 backdrop-blur-md bg-white/90`
- Logo (FV BODEGONES) - Sora Bold, brand green
- Cart icon with badge counter and running total display
- Mobile: Hamburger menu; Desktop: Horizontal navigation

### Category Grid
- Large, touch-friendly cards: Min height `h-28 md:h-32`
- Icon size: `w-12 h-12` with brand green fill
- Grid: 2 columns mobile, 3-4 desktop
- Hover state: Subtle scale transform `hover:scale-105` with shadow
- Categories display with representative icons (using Heroicons)

### Product Cards
- Clean card design with soft shadows: `shadow-sm hover:shadow-md`
- Image container: Square aspect ratio `aspect-square`
- Product name: 2-line clamp with ellipsis
- Price: Bold, brand green, prominent size
- "Agregar al carrito" button: Full width, primary green, rounded corners

### Shopping Cart (Slide-out Panel)
- Overlay: `bg-black/40 backdrop-blur-sm`
- Panel: Slides from right, `w-full md:w-96`, white background
- Product list with thumbnails, quantity controls (+/-), subtotals
- Fixed footer with total and "Finalizar Compra" button
- Empty state with friendly illustration placeholder

### Admin Panel
- Sidebar navigation (desktop) or bottom tabs (mobile)
- Form inputs: Border-bottom style with focus state (green underline)
- Image upload: Drag-and-drop zone with preview
- Action buttons: Primary (green) for save, outline for cancel
- Data tables: Alternating row colors for readability

### Footer
- Three-column layout (desktop): Contact | Social Media | Legal
- Single column stack (mobile)
- Background: Slightly darker than body `bg-[hsl(40,15%,94%)]`
- Social icons: Simple, monochrome, hover to brand green

## Animations & Interactions

**Minimal Motion Philosophy:**
- Cart badge pulse on item add: Quick scale animation `animate-bounce` once
- Category cards: Gentle hover scale `transition-transform duration-200`
- Product "Agregado" confirmation: Slide-in toast notification (2s duration)
- Page transitions: Smooth fade for category product loading
- NO auto-playing carousels or distracting parallax effects

## Images

**Hero Section:**
- Full-width hero showcasing bodega atmosphere
- Image description: Warm-lit bodega interior with fresh produce, organized shelves, welcoming ambiance
- Height: `h-[50vh] md:h-[60vh]`
- Overlay: Subtle dark gradient for text legibility
- Content: "FV BODEGONES - Tu Bodega de Confianza" with search bar

**Product Images:**
- Use placeholder service (via Supabase Storage) initially
- All product images: Square format, white/light background preferred
- Category icons: Heroicons library (shopping-cart, heart, sparkles, etc.)

**Empty States:**
- Cart vacío: Simple icon illustration
- Sin productos: Friendly "No hay productos en esta categoría" message

## Accessibility & Responsiveness

- Touch targets: Minimum 44x44px on mobile
- Color contrast: WCAG AA compliant (4.5:1 for text)
- Form inputs: Always with visible labels, error states in red with icons
- Dark mode: Full support with adjusted contrast ratios
- Skip to content link for keyboard navigation
- ARIA labels on icon-only buttons ("Agregar al carrito", cart icon)