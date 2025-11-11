# Futcerto ⚽

**Find and book the best soccer courts in Curitiba with ease.**

Futcerto is an open-source web application that connects soccer players with available courts in Curitiba, Brazil. Built with React, TypeScript, and Supabase, it provides an intuitive platform for discovering, viewing, and booking soccer courts throughout the city.

🌐 **[Visit our landing page](https://leonardobora.github.io/futcerto-v-0-1/)** to learn more about the project vision and potential!

---

## 🎯 MVP Development Guidelines

This project follows a **Minimum Viable Product (MVP)** approach focused on delivering core functionality quickly while maintaining code quality and scalability. Our development philosophy emphasizes:

- **Open-source first**: Leveraging proven open-source technologies
- **Rapid prototyping**: Getting a functional version deployed quickly
- **Iterative improvement**: Building in phases based on user feedback
- **Cost-effective solutions**: Using free tiers and open-source alternatives
- **Scalable architecture**: Building foundations that can grow with the product

See [MVP_ARCHITECTURE.md](./MVP_ARCHITECTURE.md) for detailed technical architecture and implementation guidelines.

---

## ✨ Features

### Current MVP Features
- 🗺️ **Interactive Map**: Browse courts on an integrated Mapbox map
- 🏟️ **Court Discovery**: View detailed information about each court including pricing, capacity, and location
- 👤 **User Authentication**: Secure sign up and login system powered by Supabase
- 📅 **Booking System**: Reserve courts for your preferred time slots
- 📱 **Responsive Design**: Mobile-first design optimized for all devices
- 🎨 **Modern UI**: Built with shadcn/ui components and Tailwind CSS

### Planned Features (Roadmap)
- 💳 **Payment Integration**: Online payment processing
- 👥 **Team Management**: Create and manage soccer teams
- ⭐ **Reviews & Ratings**: User feedback on courts and facilities
- 📊 **Analytics Dashboard**: Court utilization and booking insights
- 🔔 **Notifications**: Real-time booking confirmations and reminders

---

## 🛠️ Tech Stack

### Core Technologies
- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite (lightning-fast HMR)
- **Styling**: Tailwind CSS + shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Authentication & Database**: Supabase (PostgreSQL + Auth)
- **Maps**: Mapbox GL JS for interactive mapping
- **Form Handling**: React Hook Form with Zod validation
- **Routing**: React Router DOM v6

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint with TypeScript support
- **Type Checking**: TypeScript 5.x
- **Testing**: Vitest + React Testing Library

### Open-Source Alternatives Considered
See [MVP_ARCHITECTURE.md](./MVP_ARCHITECTURE.md) for detailed comparison of technology options and architectural decisions.

---

## 📋 Prerequisites

Before running this project, make sure you have:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/) or install via [nvm](https://github.com/nvm-sh/nvm)
- **npm** (comes with Node.js) or **yarn**
- **Git** for version control
- **Supabase account** (free tier available) - [supabase.com](https://supabase.com)
- **Mapbox account** (free tier available) - [mapbox.com](https://mapbox.com)

### Optional but Recommended
- **VS Code** with recommended extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript Vue Plugin (Volar)

---

## 🚀 Getting Started

### Quick Start (5 minutes)

```bash
# 1. Clone the repository
git clone https://github.com/leonardobora/futcerto-v-0-1.git
cd futcerto-v-0-1

# 2. Install dependencies
npm install

# 3. Set up environment variables (see below)
cp .env.example .env.local

# 4. Start development server
npm run dev
```

The application will be available at `http://localhost:8080`

---

### Detailed Setup Instructions

#### 1. Clone the Repository

```bash
git clone https://github.com/leonardobora/futcerto-v-0-1.git
cd futcerto-v-0-1
```

#### 2. Install Dependencies

```bash
npm install
```

If you encounter issues, try clearing npm cache:
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration (Required)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Mapbox Configuration (Required)
VITE_MAPBOX_TOKEN=your_mapbox_access_token

# Optional: Stripe for payment processing (Future feature)
# VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

**Getting Your API Keys:**

**Supabase Setup:**
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to Project Settings > API
4. Copy the `Project URL` and `anon/public` key to your `.env.local`

**Mapbox Setup:**
1. Go to [mapbox.com](https://mapbox.com) and create a free account
2. Navigate to Account > Access Tokens
3. Create a new token or use the default public token
4. Copy the token to your `.env.local`

#### 4. Database Setup

Run the SQL migrations in your Supabase SQL editor. See [Database Schema](#database-schema) section below for complete SQL scripts.

Alternatively, use the provided migration file:
```bash
# If you have Supabase CLI installed
supabase db push
```

#### 5. Start Development Server

```bash
npm run dev
```

The app will be running at `http://localhost:8080` with hot module reloading enabled.

---

## 🗄️ Database Schema

The following tables are required in your Supabase database. Run these SQL commands in the Supabase SQL Editor:

### Profiles Table
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  user_type TEXT CHECK (user_type IN ('player', 'manager')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### Courts Table
```sql
CREATE TABLE courts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  price_per_hour DECIMAL(10,2) NOT NULL,
  max_players INTEGER NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  image_url TEXT,
  manager_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view courts" ON courts
  FOR SELECT USING (true);

CREATE POLICY "Managers can insert their courts" ON courts
  FOR INSERT WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "Managers can update their courts" ON courts
  FOR UPDATE USING (auth.uid() = manager_id);
```

### Bookings Table
```sql
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  court_id INTEGER REFERENCES courts(id) NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status TEXT CHECK (status IN ('confirmed', 'cancelled', 'pending')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" ON bookings
  FOR UPDATE USING (auth.uid() = user_id);
```

### Sample Data (Optional)

Insert sample courts for testing:
```sql
INSERT INTO courts (name, location, price_per_hour, max_players, latitude, longitude, image_url)
VALUES 
  ('Arena Futebol Clube', 'Rua João Bettega, 5600 - Curitiba', 120.00, 14, -25.4284, -49.2733, 'https://example.com/court1.jpg'),
  ('Society Estrela', 'Av. Cândido de Abreu, 127 - Curitiba', 100.00, 10, -25.4372, -49.2699, 'https://example.com/court2.jpg'),
  ('Campo do Barigui', 'Rua Candido Xavier, 1000 - Curitiba', 80.00, 22, -25.4195, -49.3117, 'https://example.com/court3.jpg');
```

---

## 💻 Development Workflow

### Common Commands

```bash
# Start development server (with hot reload)
npm run dev

# Run linter to check code quality
npm run lint

# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Build for production
npm run build

# Preview production build locally
npm run preview

# Build in development mode (with source maps)
npm run build:dev
```

### Development Best Practices

1. **Code Quality**
   - Run `npm run lint` before committing
   - Fix any TypeScript errors
   - Follow the existing code style

2. **Testing**
   - Write tests for new features
   - Ensure existing tests pass
   - Use `npm run test:ui` for interactive testing

3. **Git Workflow**
   - Create feature branches from `main`
   - Write clear commit messages
   - Submit pull requests for review

4. **Performance**
   - Keep bundle size minimal
   - Use lazy loading for routes
   - Optimize images and assets

---

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run build:dev` | Build in development mode |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint for code quality |

---

## 🏗️ Project Structure

```
futcerto-v-0-1/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # shadcn/ui base components
│   │   ├── AuthModal.tsx  # Authentication modal
│   │   ├── BookingModal.tsx # Court booking modal
│   │   ├── CourtCard.tsx  # Court display card
│   │   └── CourtsMap.tsx  # Interactive map component
│   ├── contexts/          # React Context providers
│   │   └── AuthContext.tsx # Authentication state
│   ├── hooks/             # Custom React hooks
│   │   ├── useCourts.ts   # Courts data fetching
│   │   └── use-toast.ts   # Toast notifications
│   ├── lib/               # Utility libraries
│   │   └── utils.ts       # Helper functions
│   ├── pages/             # Page components (routes)
│   │   └── Index.tsx      # Main application page
│   ├── App.tsx            # Root application component
│   ├── main.tsx           # Application entry point
│   └── index.css          # Global styles
├── supabase/              # Supabase configuration
│   └── functions/         # Edge functions
├── docs/                  # GitHub Pages documentation
├── .env.local             # Environment variables (create this)
├── vite.config.ts         # Vite configuration
├── tailwind.config.ts     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Project dependencies
```

### Key Directories Explained

- **`src/components/`**: Reusable React components organized by feature
- **`src/pages/`**: Top-level page components mapped to routes
- **`src/contexts/`**: Global state management with React Context
- **`src/hooks/`**: Custom React hooks for shared logic
- **`src/lib/`**: Utility functions and helper libraries
- **`supabase/`**: Backend configuration and database migrations

---

## 🔧 Configuration

### Vite Configuration
The project uses Vite for fast builds and development. Key configurations:
- **React SWC plugin** for blazing-fast refresh
- **Path aliases**: `@/` maps to `./src/` for clean imports
- **Port**: Development server runs on port 8080

### Tailwind CSS
Custom design system built on Tailwind CSS:
- **Component library**: shadcn/ui for high-quality, accessible components
- **Theme**: Customizable via `tailwind.config.ts`
- **Dark mode**: Configured via `next-themes` (class-based)
- **Custom colors**: Sports-themed primary colors

Example usage:
```tsx
import { Button } from "@/components/ui/button"

<Button variant="default">Book Now</Button>
```

### TypeScript
Strict TypeScript configuration for type safety:
- **Strict mode enabled** for better type checking
- **Path mapping** for clean imports
- **ES2020 target** for modern JavaScript features

### Environment Variables
All environment variables must be prefixed with `VITE_` to be exposed to the client:
```env
VITE_SUPABASE_URL=...
VITE_MAPBOX_TOKEN=...
```

---

## 🌟 Feature Implementation Guide

### Adding a New Feature

Follow this workflow when implementing new features:

1. **Plan**: Define the feature requirements and acceptance criteria
2. **Design**: Create component mockups or wireframes
3. **Database**: Update schema if needed (migrations in `supabase/migrations/`)
4. **Backend**: Create API endpoints or Supabase queries
5. **Frontend**: Implement UI components
6. **Test**: Write and run tests
7. **Document**: Update relevant documentation

### Authentication Flow

The app uses Supabase Auth with email/password:

```typescript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})

// Sign out
await supabase.auth.signOut()
```

### Data Fetching Pattern

Using TanStack Query for server state:

```typescript
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export const useCourts = () => {
  return useQuery({
    queryKey: ['courts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courts')
        .select('*')
      
      if (error) throw error
      return data
    }
  })
}
```

---

## 🚢 Deployment

### Recommended Hosting Options

#### Vercel (Recommended for MVP)
**Pros**: Zero-config, automatic deployments, generous free tier
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

#### Netlify
**Pros**: Easy setup, built-in forms, good free tier
```bash
# Build command
npm run build

# Publish directory
dist
```

#### GitHub Pages (Static Hosting)
The landing page is already deployed to GitHub Pages. See `docs/` folder.

### Environment Variables in Production

Remember to set all environment variables in your hosting platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_MAPBOX_TOKEN`

### Build Optimization

```bash
# Production build with optimizations
npm run build

# Build output will be in dist/
# Verify build size
du -sh dist/
```

---

## 🤝 Contributing

Contributions are welcome! This is an open-source project and we appreciate help from the community.

### How to Contribute

1. **Fork the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/futcerto-v-0-1.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Write clean, documented code
   - Follow the existing code style
   - Add tests for new features

4. **Run tests and linting**
   ```bash
   npm run lint
   npm run test
   ```

5. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

7. **Open a Pull Request**
   - Describe your changes clearly
   - Reference any related issues
   - Wait for review and feedback

### Code Style Guidelines

- Use TypeScript for type safety
- Follow React best practices and hooks patterns
- Write meaningful variable and function names
- Add comments for complex logic
- Keep components small and focused
- Use existing UI components from shadcn/ui

### Reporting Issues

Found a bug or have a feature request? Please open an issue:
- Use the issue templates if available
- Provide clear reproduction steps for bugs
- Include screenshots for UI issues

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🎯 MVP Roadmap

### Phase 1: Core Features ✅ (Current)
- [x] User authentication and profiles
- [x] Court listing and details
- [x] Interactive map integration
- [x] Basic booking system
- [x] Responsive UI design

### Phase 2: Enhanced Features 🚧 (Next)
- [ ] Payment integration (Stripe/PIX)
- [ ] Email notifications for bookings
- [ ] Court availability calendar
- [ ] User reviews and ratings
- [ ] Search and filter improvements

### Phase 3: Advanced Features 📅 (Future)
- [ ] Team management system
- [ ] Real-time availability updates
- [ ] Mobile app (React Native)
- [ ] Tournament organization
- [ ] Social features and match-making
- [ ] Analytics dashboard for court managers

### Phase 4: Scale & Optimize 🚀 (Future)
- [ ] Multi-city support
- [ ] Advanced analytics and insights
- [ ] API for third-party integrations
- [ ] White-label solution for court owners
- [ ] Loyalty programs and rewards

---

## 🔗 Useful Links

- **Documentation**: [MVP_ARCHITECTURE.md](./MVP_ARCHITECTURE.md) - Detailed technical architecture
- **Landing Page**: [https://leonardobora.github.io/futcerto-v-0-1/](https://leonardobora.github.io/futcerto-v-0-1/)
- **GitHub Repository**: [https://github.com/leonardobora/futcerto-v-0-1](https://github.com/leonardobora/futcerto-v-0-1)
- **Issue Tracker**: [GitHub Issues](https://github.com/leonardobora/futcerto-v-0-1/issues)

---

## 📞 Support & Community

### Getting Help
- **GitHub Issues**: Report bugs or request features
- **Discussions**: Ask questions and share ideas
- **Documentation**: Check the docs for detailed guides

### Stay Updated
- Star the repository to get updates
- Watch for new releases
- Follow the project roadmap

---

## 🏆 Acknowledgments

This project is built with amazing open-source technologies:

- **React** - UI library
- **Supabase** - Backend and database
- **Tailwind CSS** - Styling framework
- **shadcn/ui** - Component library
- **Mapbox** - Map integration
- **Vite** - Build tool
- **TypeScript** - Type safety

Special thanks to the open-source community for these incredible tools!

---

**Built with ❤️ for the Curitiba soccer community**