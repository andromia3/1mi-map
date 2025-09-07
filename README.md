# 1MI Members' Club

A premium Next.js 14 application for the 1MI Members' Club featuring an interactive Mapbox-powered map where members can discover and share nice places in London.

## 🌟 Features

- **🔐 Secure Authentication** - Email/password login with Supabase Auth
- **🗺️ Interactive Map** - Beautiful Mapbox map centered on London
- **📍 Place Sharing** - Members can add and discover nice places
- **🌍 PostGIS Integration** - Advanced spatial queries with nearby places functionality
- **📏 Distance Calculations** - Find places within 2km with accurate distance measurements
- **🎨 Premium UI** - Clean, modern design with shadcn/ui components
- **🔒 Password Management** - Users can change their passwords
- **📱 Responsive Design** - Works perfectly on all devices
- **⚡ Real-time Ready** - Built for real-time updates with Supabase
- **🛡️ Row Level Security** - Secure data access with RLS policies

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS + shadcn/ui
- **Maps**: Mapbox GL JS
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth with JWT tokens
- **Validation**: Zod + React Hook Form
- **Deployment**: Netlify with serverless functions

## 📋 Prerequisites

- Node.js 18+
- Supabase account ([supabase.com](https://supabase.com))
- Mapbox account and API token ([mapbox.com](https://mapbox.com))

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd 1mi-members-club
npm install
```

### 2. Supabase Project Setup

1. **Create a new project** on [Supabase](https://supabase.com)
2. **Get your credentials** from Settings → API:
   - Project URL
   - Anon (public) key
3. **Enable PostGIS extension** in your Supabase project:

   Go to your Supabase project dashboard → Database → Extensions and enable the `postgis` extension.

4. **Create the places table** in the Supabase SQL Editor:

   Go to your Supabase project dashboard → SQL Editor and run this SQL:

```sql
-- Create places table with PostGIS geography column
CREATE TABLE public.places (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  geom GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lng, lat), 4326)) STORED,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create spatial index for better performance
CREATE INDEX idx_places_geom ON public.places USING GIST (geom);

-- Enable Row Level Security
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;

-- Create policies for secure data access
CREATE POLICY "Users can view all places" ON public.places
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own places" ON public.places
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own places" ON public.places
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own places" ON public.places
  FOR DELETE USING (auth.uid() = created_by);

-- Create RPC function for finding nearby places
CREATE OR REPLACE FUNCTION nearby_places(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_radius_m INTEGER DEFAULT 2000
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  geom TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  distance_m DOUBLE PRECISION
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    p.id,
    p.title,
    p.description,
    p.lat,
    p.lng,
    ST_AsGeoJSON(p.geom) as geom,
    p.created_by,
    p.created_at,
    ST_Distance(p.geom, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) as distance_m
  FROM public.places p
  WHERE ST_DWithin(p.geom, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, p_radius_m)
  ORDER BY distance_m;
$$;
```

**Note**: This replaces the old Prisma migrations. Simply run this SQL once in your Supabase project. The `geom` column is automatically generated from `lat`/`lng` coordinates.

### 3. Mapbox Setup

1. **Create a Mapbox account** at [mapbox.com](https://mapbox.com)
2. **Generate an API token** from your account dashboard
3. **Copy the token** for use in environment variables

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://fleomqtjdvdkhojqkvax.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_oniQH7v49lsjml_DAXQEcw_0wQzqm41"

# Mapbox Configuration
MAPBOX_TOKEN="pk.eyJ1IjoiYW5kcm9taWEiLCJhIjoiY21mOXA0eWphMDlpODJscW9weWlvNXB0biJ9.lt-cpkt9IgVZwigPpimEBw"
NEXT_PUBLIC_MAPBOX_TOKEN="pk.eyJ1IjoiYW5kcm9taWEiLCJhIjoiY21mOXA0eWphMDlpODJscW9weWlvNXB0biJ9.lt-cpkt9IgVZwigPpimEBw"
```

**Important Notes:**
- Use the same Mapbox token for both `MAPBOX_TOKEN` and `NEXT_PUBLIC_MAPBOX_TOKEN`
- The `NEXT_PUBLIC_` prefix makes variables available in the browser
- Never commit `.env.local` to version control

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and:
1. **Sign up** for a new account with your email
2. **Sign in** with your credentials
3. **Explore the map** and add your first place!

## 📁 Project Structure

```
├── app/                    # Next.js 14 App Router
│   ├── login/             # Login page
│   │   └── page.tsx       # Login page component
│   ├── map/               # Map page (protected)
│   │   └── page.tsx       # Map page component
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page (redirects to login)
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   │   ├── button.tsx    # Button component
│   │   ├── card.tsx      # Card component
│   │   ├── dialog.tsx    # Dialog component
│   │   ├── input.tsx     # Input component
│   │   ├── label.tsx     # Label component
│   │   └── textarea.tsx  # Textarea component
│   ├── LoginForm.tsx     # Login form component
│   ├── MapView.tsx       # Mapbox map component
│   └── Topbar.tsx        # Navigation bar component
├── lib/                  # Utilities and helpers
│   ├── supabase/         # Supabase client helpers
│   │   ├── browser.ts    # Browser client
│   │   └── server.ts     # Server client
│   └── utils.ts          # Utility functions
├── middleware.ts         # Route protection middleware
├── netlify.toml          # Netlify deployment configuration
├── next.config.js        # Next.js configuration
├── package.json          # Dependencies and scripts
├── tailwind.config.js    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

## 🔐 Authentication System

The application uses Supabase Auth for secure authentication:

### Features
- **Email/Password Authentication** - Secure login with email and password
- **JWT Tokens** - Automatic session management with JWT tokens
- **Protected Routes** - Middleware protects `/map` route
- **Session Persistence** - Sessions persist across browser refreshes
- **Password Management** - Users can change their passwords

### Authentication Flow
1. **Sign Up** - Users create accounts with email/password
2. **Sign In** - Existing users authenticate with credentials
3. **Session Management** - JWT tokens handled automatically
4. **Route Protection** - Middleware redirects unauthenticated users
5. **Logout** - Secure session termination

## 🗄️ Database Schema

### Places Table
```sql
CREATE TABLE public.places (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row Level Security (RLS)
- **View All Places** - Users can see all places added by any member
- **Create Own Places** - Users can only add places to their own account
- **Update Own Places** - Users can only modify their own places
- **Delete Own Places** - Users can only remove their own places
- **Authentication Required** - All operations require valid authentication

## 🗺️ Map Features

### Interactive Map
- **Mapbox Integration** - Powered by Mapbox GL JS
- **London Centered** - Default view centered on London
- **Custom Styling** - Light theme with premium appearance
- **Responsive Design** - Works on all screen sizes

### Place Management
- **Click to Add** - Click anywhere on the map to add a place
- **Rich Information** - Add title and description for each place
- **Visual Markers** - Green circular markers for all places
- **Popup Details** - Click markers to see place information
- **User Attribution** - Shows who added each place

## 🚀 Deployment

### Netlify Deployment

1. **Connect Repository**
   - Link your GitHub repository to Netlify
   - Netlify will auto-detect Next.js configuration

2. **Environment Variables**
   Set the following in your Netlify dashboard:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://fleomqtjdvdkhojqkvax.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_oniQH7v49lsjml_DAXQEcw_0wQzqm41
   MAPBOX_TOKEN=pk.eyJ1IjoiYW5kcm9taWEiLCJhIjoiY21mOXA0eWphMDlpODJscW9weWlvNXB0biJ9.lt-cpkt9IgVZwigPpimEBw
   NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoiYW5kcm9taWEiLCJhIjoiY21mOXA0eWphMDlpODJscW9weWlvNXB0biJ9.lt-cpkt9IgVZwigPpimEBw
   ```

3. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: 18.x

4. **Deploy**
   - Netlify will automatically deploy on every push to main
   - Preview deployments for pull requests

### Environment Variables for Production

Make sure to set these in your deployment platform:

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | ✅ |
| `MAPBOX_TOKEN` | Your Mapbox API token | ✅ |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Same as MAPBOX_TOKEN | ✅ |

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint for code quality
```

### Development Workflow

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Make Changes**
   - Edit components in `components/`
   - Modify pages in `app/`
   - Update styles in `tailwind.config.js`

3. **Test Changes**
   - Visit `http://localhost:3000`
   - Test authentication flow
   - Verify map functionality

4. **Code Quality**
   ```bash
   npm run lint
   ```

### Key Development Files

- **`components/LoginForm.tsx`** - Authentication form
- **`components/MapView.tsx`** - Main map component
- **`components/Topbar.tsx`** - Navigation and user actions
- **`middleware.ts`** - Route protection
- **`lib/supabase/`** - Supabase client configuration

## 🔧 Configuration

### Supabase Configuration
- **Project URL** - Your Supabase project URL
- **Anon Key** - Public key for client-side operations
- **Row Level Security** - Enabled for data protection

### Mapbox Configuration
- **Access Token** - Your Mapbox API token
- **Map Style** - Light theme for premium appearance
- **Default Location** - London coordinates (-0.1276, 51.5072)

### Next.js Configuration
- **App Router** - Using Next.js 14 App Router
- **TypeScript** - Full TypeScript support
- **Middleware** - Route protection with middleware

## 🐛 Troubleshooting

### Common Issues

1. **Authentication Not Working**
   - Check Supabase URL and anon key
   - Verify environment variables are set
   - Ensure Supabase project is active

2. **Map Not Loading**
   - Verify Mapbox token is valid
   - Check browser console for errors
   - Ensure token has correct permissions

3. **Database Errors**
   - Verify RLS policies are set up correctly
   - Check Supabase project status
   - Ensure user is authenticated

4. **Build Failures**
   - Run `npm install` to ensure dependencies
   - Check TypeScript errors with `npm run lint`
   - Verify all environment variables are set

### Getting Help

1. **Check the logs** in your browser's developer console
2. **Verify environment variables** are correctly set
3. **Test Supabase connection** in the Supabase dashboard
4. **Check Mapbox token** in the Mapbox dashboard

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and test thoroughly
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request** with a clear description

### Development Guidelines

- **Follow TypeScript** best practices
- **Use Tailwind CSS** for styling
- **Test authentication flow** thoroughly
- **Verify map functionality** on different devices
- **Update documentation** for new features

## 📄 License

This project is private and proprietary to the 1MI Members' Club.

## 🙏 Acknowledgments

- **Supabase** for authentication and database services
- **Mapbox** for mapping services
- **Next.js** for the React framework
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components

---

**Built with ❤️ for the 1MI Members' Club**

---

## 📚 Table of Contents

- Overview and Goals
- Architecture and Data Flow
- Styling System (Code-Only Mapbox Theme)
- Map Features and UX Enhancements
- Persistence and Settings
- Security and RLS
- Local Development (Env, Scripts, Running)
- Testing (Unit + Visual Regression)
- Migrations and Database Ops
- Performance Tips
- Troubleshooting (Extended)
- FAQ

## 🎯 Overview and Goals

This app provides a premium, low-latency mapping experience for members to discover and share places. Styling is 100% code-based (no DB reads for theme), while Supabase remains the source for all geo data (places/meetups/houses). The result is predictable theming, fast first paint, and robust fallbacks during network turbulence.

## 🧱 Architecture and Data Flow

- Next.js 14 App Router + TypeScript
- Supabase for Auth + Postgres/PostGIS (data only)
- Mapbox GL JS for web map rendering
- Client data flows:
  - Auth (middleware protects `/map`)
  - Places loaded via Supabase RPC and table reads
  - Map styling applied client-side from constants in code

### Key Modules

- `lib/map/theme.ts`
  - `DEFAULT_THEME`, `STYLE_URLS`, `StyleKey`
- `lib/map/mapboxHelpers.ts`
  - `safePaint`, `safeLayout`, `safeAddLayer`, `findFirstLayerId` (no-throw helpers)
- `lib/configureVisualTheme.ts`
  - Applies code-only Mapbox styling in staged frames for smoother first paint
- `components/MapView.tsx`
  - Initializes Mapbox, applies theme, mounts data layers, handles persistence

## 🎨 Styling System (Code-Only)

All map styling is computed client-side with constants and safe operations.

- Base style URLs: `STYLE_URLS` (`standard`/`satellite-streets`)
- Theme constants: `DEFAULT_THEME` (water/land/parks/roads/labels/transit/buildings3d/fog/camera)
- Theming order (guarded):
  1) Fog
  2) Water/Land/Parks (skipped on satellite)
  3) Labels (halo, POI size ramp, waterway legibility)
  4) Transit (min zoom, opacity ramp)
  5) Roads (width ramps + subtle casings)
  6) 3D buildings with vertical-gradient and height-tinted color

### Terrain + Sky

After style load, we add DEM, enable terrain, and add a sky layer. All are wrapped in try/catch and skipped gracefully if unavailable.

### Extra Context Layers

- Borough boundaries (admin level 8): subtle, dashed overlay
- Footpaths: dashed `path/pedestrian` with optional directional arrows
- Tall building accent: light highlight for height ≥120m
- Thames glow: gentle line glow improving water readability

## 🧩 Map Features and UX Enhancements

- Instant style and camera restore from localStorage to avoid flicker
- Smooth transforms (custom easing) and resize observer to eliminate blur
- Vignette overlay for subtle center-focus
- Consistent symbol alignment and size at high pitch

## 💾 Persistence and Settings

- Local-only persistence:
  - `map:style_key`: last chosen style
  - `map:last_view`: `{ center, zoom, pitch, bearing }`
- Settings page (`/settings/map`):
  - Choose style (`default|night|satellite`)
  - Toggles: 3D buildings, transit
  - Sliders: label density, road contrast
  - Interaction preferences: dragRotate, touchZoomRotate, scrollZoom, keyboard, dragPan, inertia, wheel zoom rate
- Live events broadcast to open map instances to apply changes without reload

## 🔐 Security and RLS

- RLS enforced for `profiles` and `user_settings` (self-only policies)
- Places have view/insert/update/delete rules as documented above

## 🧪 Testing (Unit + Visual Regression)

### Unit Tests (Vitest)

```bash
npm run test:unit
```

- Includes RLS guard test (requires two seeded test users)

### Visual Regression (Playwright)

```bash
npm run test:e2e
```

- Snapshots for `/map` across `default|night|satellite` with ~3% tolerance
- Middleware bypass via `?__e2e=1` for authless loading during tests

## 🗃️ Migrations and Database Ops

- Row-level security policies (`migrations/2025-09-07_rls_self_only.sql`)
- Backfill user settings defaults (`migrations/2025-09-07_backfill_user_settings_map.sql`)
- Place schema and `nearby_places` RPC (see above SQL)

## ⚙️ Local Development (Extended)

### Environment

- Node 18+ (recommend Node 20)
- `mapbox-gl` >= 2.7.0

### Scripts

```bash
npm run dev       # Start app
npm run build     # Prod build (lint + type check + build)
npm run start     # Serve prod build
npm run lint      # ESLint
npm run test:unit # Vitest
npm run test:e2e  # Playwright
```

### Configuration Sources

- `.env.local`: Supabase + Mapbox tokens
- LocalStorage keys: `map:style_key`, `map:last_view`

## 🚀 Performance Tips

- Keep `easeTo` durations ≤ 500ms with easing for perceived smoothness
- Rely on staged theme application to reduce FOUC
- Avoid heavy synchronous work in `style.load`; use `requestAnimationFrame`

## 🩺 Troubleshooting (Extended)

- Map looks flat: ensure DEM source adds successfully and terrain is set
- Satellite looks over-styled: verify recolors are skipped in code-only theme for satellite
- Symbols warp at pitch: verify `icon-rotation-alignment: map` and `icon-pitch-alignment: viewport`
- Visual tests failing: regenerate snapshots intentionally after acceptable changes

## ❓ FAQ

**Q: Why code-only theming?**
A: Predictability, fewer round trips, simpler diff/PR review, and instant local application.

**Q: Can I add a new style?**
A: Add a new key to `STYLE_URLS`, update settings UI if user-facing, and adjust `DEFAULT_THEME` if needed.

**Q: Do we support offline?**
A: Not fully; however, local restore (style + last view) reduces perceived latency.
