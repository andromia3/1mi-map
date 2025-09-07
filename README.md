# 1MI Members' Club

A beautiful, premium Next.js 14 application for the 1MI Members' Club featuring an interactive Mapbox map where members can share and discover nice places around London.

## Features

- **Modern Authentication**: Secure email/password login with Supabase Auth
- **Interactive Map**: Full-screen Mapbox map centered on London
- **Place Sharing**: Members can add pins with titles and descriptions
- **Premium UI**: Clean, minimalist design inspired by Notion/Linear
- **Real-time Updates**: Places are shared across all members
- **Responsive Design**: Works perfectly on desktop and mobile

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui for premium look and feel
- **Maps**: Mapbox GL JS with custom styling
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth with JWT tokens
- **Deployment**: Netlify with serverless functions
- **Styling**: Tailwind CSS with custom components

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd 1mi-members-club
npm install
```

### 2. Supabase Setup

1. Create a new project on [Supabase](https://supabase.com)
2. Go to Settings → API to get your project URL and anon key
3. Create the `places` table in the SQL editor:

```sql
-- Create places table
CREATE TABLE public.places (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all places" ON public.places
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own places" ON public.places
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own places" ON public.places
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own places" ON public.places
  FOR DELETE USING (auth.uid() = created_by);
```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
MAPBOX_TOKEN="pk.your_mapbox_token_here"
NEXT_PUBLIC_MAPBOX_TOKEN="pk.your_mapbox_token_here"
```

**Important**: 
- Get your Supabase URL and anon key from your project settings
- Get your Mapbox token from [mapbox.com](https://mapbox.com)
- Use the same token for both `MAPBOX_TOKEN` and `NEXT_PUBLIC_MAPBOX_TOKEN`

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and sign up for a new account or sign in.

## Project Structure

```
├── app/                    # Next.js 14 App Router
│   ├── login/             # Login page
│   ├── map/               # Map page (protected)
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── LoginForm.tsx     # Login form
│   ├── MapView.tsx       # Mapbox map component
│   └── Topbar.tsx        # Navigation bar
├── lib/                  # Utilities
│   ├── supabase/         # Supabase client helpers
│   └── utils.ts          # Utility functions
├── middleware.ts         # Route protection
└── public/               # Static assets
```

## Authentication

The app uses Supabase Auth for secure authentication:

- **Sign Up**: Users can create accounts with email/password
- **Sign In**: Existing users can sign in with their credentials
- **Protected Routes**: `/map` is protected by middleware
- **Session Management**: JWT tokens handled automatically by Supabase

## Database Schema

### Places Table
- `id` - UUID primary key
- `title` - Place title (required)
- `description` - Optional description
- `lat` - Latitude coordinate
- `lng` - Longitude coordinate
- `created_by` - User ID who added the place
- `created_at` - Creation timestamp

### Row Level Security (RLS)
- Users can view all places
- Users can only create, update, and delete their own places
- All operations require authentication

## Deployment

### Netlify

1. **Connect Repository**: Link your GitHub repo to Netlify
2. **Environment Variables**: Set the following in Netlify dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
   - `MAPBOX_TOKEN` - Your Mapbox API token
   - `NEXT_PUBLIC_MAPBOX_TOKEN` - Same as above

3. **Build Settings**: Netlify will auto-detect Next.js and use the included `netlify.toml`

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is private and proprietary to the 1MI Members' Club.