

# Fa-NumTX — Vehicle License Plate Detection Dashboard

## Overview
A full-stack vehicle license plate detection dashboard with custom authentication, real-time camera feeds, detection analytics, historical reports, and export functionality.

## Phase 1: Foundation & Design System
- Update favicon to the provided Cloudinary URL
- Configure the design system with indigo-based color palette (#4F46E5 primary, #F0F4FF background)
- Add Inter font from Google Fonts
- Install `@iconify/react` for all icons (replacing lucide-react usage)
- Set up custom card/button styles (rounded-xl cards, rounded-full buttons, shadow-sm)

## Phase 2: Database & Auth Setup
- Add RLS policy on `users` table to allow anon SELECT (for login queries)
- Update RLS policies on `vehicle_detections`, `cameras`, `weekly_exports`, `dashboard_region_stats`, `dashboard_vehicle_type_stats`, and `regions` tables to allow anon SELECT (since custom auth doesn't use Supabase Auth sessions)
- Implement custom authentication flow:
  - Login queries the `users` table directly with username/password
  - Store user object in localStorage as `fa_numtx_user`
  - ProtectedRoute component redirects unauthenticated users to `/login`
  - Logout clears localStorage and redirects to `/login`

## Phase 3: Layout & Navigation
- Create shared Layout component with:
  - **Desktop**: Fixed left sidebar (220px) with logo, nav items (Dashboard, Historical Report, Export Report), and logout button — all using Iconify icons
  - **Mobile**: Bottom navigation bar with the same items
  - Active route highlighting with indigo background and white text
- Set up React Router with lazy-loaded routes and Suspense fallbacks

## Phase 4: Login Page
- Two-column layout on desktop (form left, cover image right)
- Single-column on mobile (form only)
- Logo + "Fa-NumTX" branding at top
- Username and password inputs with Iconify icons
- Password show/hide toggle
- Gradient login button (indigo-500 → purple-500) with loading spinner
- Inline error messages for failed login
- Auto-redirect to dashboard if already logged in

## Phase 5: Dashboard Page
- Page title "Dashboard"
- Two cards side by side (desktop), stacked (mobile):
  - **Video Kendaraan**: Video player card fetching stream_url from first active camera, with custom playback controls (rewind, play/pause, forward, skip). Placeholder shown if no stream available
  - **Informasi Kendaraan**: Pie chart (Recharts) showing vehicle distribution by region from `dashboard_region_stats` view, with percentage labels and color legend
- Lazy-loaded cards with Skeleton loading states

## Phase 6: Historical Report Page
- Search/filter bar for plate number and region name
- Data table showing: Jenis Kendaraan, Waktu (HH:mm), Nomor Polisi, Daerah
- Fetches from `vehicle_detections` ordered by detected_at DESC
- Pagination with 10 rows per page
- Skeleton loading states
- Mobile-responsive with horizontal scroll

## Phase 7: Export Report Page
- Table showing: No, Waktu & Tanggal (formatted DD/MM/YYYY range), Unduh (download button)
- Fetches from `weekly_exports` ordered by period_start ASC
- Download button links to file_url from Supabase Storage
- Skeleton loading states

## Phase 8: Polish & Error Handling
- Error states with friendly messages and retry buttons on all data-fetching components
- Toast notifications (Sonner) for login errors and download actions
- Smooth route transitions
- Mobile-first responsive design verification across all pages

