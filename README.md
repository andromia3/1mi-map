# 1MI Members' Club

A premium Next.js 14 application for the 1MI Members' Club featuring a beautiful Mapbox-powered map where members can discover and share nice places in London.

## Features

- 🔐 **Secure Authentication** - Cookie-based login with iron-session
- 🗺️ **Interactive Map** - Beautiful Mapbox map centered on London
- 📍 **Place Sharing** - Members can add and discover nice places
- 🎨 **Premium UI** - Clean, modern design with shadcn/ui components
- 🔒 **Password Management** - Users can change their passwords
- 📱 **Responsive Design** - Works perfectly on all devices

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS + shadcn/ui
- **Maps**: Mapbox GL JS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: iron-session (cookie-based)
- **Validation**: Zod + React Hook Form
- **Deployment**: Netlify

## Prerequisites

- Node.js 18+ 
- PostgreSQL database (we recommend [Neon](https://neon.tech/))
- Mapbox account and API token

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd 1mi-members-club
npm install
```

### 2. Database Setup

1. Create a PostgreSQL database (we use [Supabase](https://supabase.com/))
2. Get your connection string from your database provider
3. **For Supabase**: Reset your database password and update the DATABASE_URL

**Supabase Password Reset:**
1. Go to your Supabase project dashboard
2. Navigate to Settings → Database
3. Click "Reset database password"
4. Copy the new password and URL-encode special characters
5. Update your DATABASE_URL with the new password

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
DATABASE_URL="postgresql://postgres:password@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
MAPBOX_TOKEN="pk.your_mapbox_token_here"
NEXT_PUBLIC_MAPBOX_TOKEN="pk.your_mapbox_token_here"
SESSION_PASSWORD="your-super-secret-session-password-at-least-32-characters-long"
```

**Important**: Prisma CLI uses `.env` (not `.env.local`). For local seeding on Windows:
```powershell
Copy-Item .env.local .env
```

**Important**: 
- Get your Mapbox token from [mapbox.com](https://mapbox.com)
- Generate a strong session password (32+ characters)
- Use the same token for both `MAPBOX_TOKEN` and `NEXT_PUBLIC_MAPBOX_TOKEN`

### 4. Database Migration & Seeding

**First-time setup sequence:**
```bash
# 1. Copy environment variables for Prisma CLI
Copy-Item .env.local .env

# 2. Deploy database schema
npx prisma migrate deploy

# 3. Seed the database with demo users
npx prisma db seed
```

**Alternative commands:**
```bash
# Push schema (for development)
npx prisma db push

# Seed using npm script
npm run db:seed
```

**Note**: Prisma seed is configured in `package.json` and uses `ts-node prisma/seed.ts` with CommonJS module system.

### 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app!

## Demo Accounts

The seed script creates these demo accounts:

| Username | Password | Display Name |
|----------|----------|--------------|
| vincent  | changeme1 | Vincent      |
| sergio   | changeme1 | Sergio       |
| guest    | changeme1 | Guest        |

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── login/         # Authentication
│   │   ├── logout/        # Logout
│   │   ├── change-password/ # Password management
│   │   └── places/        # Places CRUD
│   ├── login/             # Login page
│   ├── map/               # Map page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── LoginForm.tsx     # Login form
│   ├── MapView.tsx       # Map component
│   └── Topbar.tsx        # Navigation bar
├── lib/                  # Utilities
│   ├── auth.ts          # Authentication helpers
│   ├── prisma.ts        # Database client
│   ├── session.ts       # Session management
│   └── utils.ts         # Utility functions
├── prisma/              # Database
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Seed script
└── netlify.toml         # Netlify configuration
```

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `POST /api/change-password` - Change user password

### Places
- `GET /api/places` - Get all places
- `POST /api/places` - Create new place

## Database Schema

### User
- `id` - Unique identifier
- `username` - Unique username
- `passwordHash` - Bcrypt hashed password
- `displayName` - Optional display name
- `createdAt` - Account creation date
- `updatedAt` - Last update date

### Place
- `id` - Unique identifier
- `title` - Place title
- `description` - Optional description
- `lat` - Latitude coordinate
- `lng` - Longitude coordinate
- `createdById` - User who created the place
- `createdAt` - Creation date
- `updatedAt` - Last update date

## Deployment

### Netlify Deployment

1. Connect your GitHub repository to Netlify
2. Set the build command: `npm run build`
3. Set the publish directory: `.next`
4. Add environment variables in Netlify dashboard
5. Deploy!

### Environment Variables for Production

Make sure to set these in your Netlify dashboard:

- `DATABASE_URL` - Your production PostgreSQL URL
- `MAPBOX_TOKEN` - Your Mapbox API token
- `NEXT_PUBLIC_MAPBOX_TOKEN` - Same as above
- `SESSION_PASSWORD` - Strong session password

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push schema changes
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio
```

### Database Management

```bash
# Reset database (careful!)
npx prisma db push --force-reset

# View database in browser
npx prisma studio

# Generate Prisma client after schema changes
npx prisma generate
```

## Customization

### Adding New Features

The app is designed to be extensible. To add new features:

1. **Database**: Update `prisma/schema.prisma`
2. **API**: Add new routes in `app/api/`
3. **UI**: Create components in `components/`
4. **Pages**: Add new pages in `app/`

### Styling

The app uses Tailwind CSS with a custom design system. Key files:

- `tailwind.config.js` - Tailwind configuration
- `app/globals.css` - Global styles and CSS variables
- `components/ui/` - Reusable UI components

### Map Customization

The map is configured in `components/MapView.tsx`. You can:

- Change the map style
- Adjust the center location
- Modify marker appearance
- Add new map interactions

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check your `DATABASE_URL` format
   - Ensure your database is accessible
   - Verify SSL mode settings

2. **Map Not Loading**
   - Verify your Mapbox token is correct
   - Check browser console for errors
   - Ensure `NEXT_PUBLIC_MAPBOX_TOKEN` is set

3. **Authentication Issues**
   - Check `SESSION_PASSWORD` is set
   - Verify cookie settings
   - Clear browser cookies and try again

4. **Build Errors**
   - Run `npm install` to ensure dependencies are installed
   - Check TypeScript errors with `npm run lint`
   - Verify all environment variables are set

### Getting Help

If you encounter issues:

1. Check the browser console for errors
2. Verify all environment variables are set correctly
3. Ensure your database is accessible
4. Check the Netlify build logs for deployment issues

## License

This project is private and proprietary to 1MI Members' Club.

---

Built with ❤️ for the 1MI Members' Club
