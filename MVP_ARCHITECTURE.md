# Futcerto MVP Architecture

## Overview

This document outlines the technical architecture for the Futcerto MVP (Minimum Viable Product), a soccer court booking platform for Curitiba, Brazil. The architecture emphasizes open-source technologies, cost-effectiveness, and rapid prototyping while maintaining scalability for future growth.

**Design Principles:**
- **Open-source first**: Prioritize free and open-source solutions
- **Serverless architecture**: Minimize infrastructure management
- **Progressive enhancement**: Start simple, add complexity as needed
- **Mobile-first**: Responsive design for all devices
- **Developer experience**: Fast feedback loops and modern tooling

---

## Technology Stack Benchmarking

### Frontend Framework Comparison

| Framework | Pros | Cons | Score | Selected |
|-----------|------|------|-------|----------|
| **React** | Huge ecosystem, excellent docs, component reusability | Larger bundle size | 9/10 | ✅ Yes |
| **Vue** | Gentler learning curve, smaller bundle | Smaller ecosystem | 7/10 | ❌ No |
| **Svelte** | Best performance, smallest bundles | Smaller ecosystem, fewer jobs | 6/10 | ❌ No |
| **Solid** | Excellent performance | Very small ecosystem, bleeding edge | 5/10 | ❌ No |

**Winner: React 18** - Best balance of ecosystem, documentation, and community support. TypeScript integration is excellent.

### Build Tool Comparison

| Tool | Build Speed | Dev Server | Bundle Size | Selected |
|------|-------------|------------|-------------|----------|
| **Vite** | ⚡ Fastest | ⚡ Instant HMR | Small | ✅ Yes |
| **Webpack** | Slow | Moderate | Moderate | ❌ No |
| **esbuild** | Very Fast | Fast | Very Small | ❌ No |
| **Parcel** | Moderate | Fast | Moderate | ❌ No |

**Winner: Vite** - Lightning-fast development experience with excellent React support via SWC.

### Backend-as-a-Service Comparison

| Service | Free Tier | Database | Auth | Storage | Edge Functions | Selected |
|---------|-----------|----------|------|---------|----------------|----------|
| **Supabase** | 500MB DB, 1GB storage, 2GB bandwidth | PostgreSQL ✅ | Built-in ✅ | Yes ✅ | Yes ✅ | ✅ Yes |
| **Firebase** | 1GB storage, 10GB bandwidth | NoSQL | Built-in ✅ | Yes ✅ | Limited | ❌ No |
| **PocketBase** | Self-hosted, unlimited | SQLite | Built-in ✅ | Yes ✅ | No | ❌ No |
| **Appwrite** | Self-hosted, unlimited | Multiple | Built-in ✅ | Yes ✅ | Yes | ❌ No |

**Winner: Supabase** - Open-source, PostgreSQL (familiar SQL), generous free tier, excellent DX. Firebase is proprietary NoSQL which is harder to migrate from.

### Map Services Comparison

| Service | Free Tier | Features | Pricing After Free | Selected |
|---------|-----------|----------|-------------------|----------|
| **Mapbox** | 50k loads/month | Excellent customization | $5 per 1k loads | ✅ Yes |
| **Google Maps** | $200 credit/month | Most features, best data | $7 per 1k loads | ❌ No |
| **Leaflet + OSM** | Unlimited | Open-source, customizable | Free forever | ⭐ Alternative |
| **MapLibre** | Unlimited | Fork of Mapbox GL | Free forever | ⭐ Future |

**Winner: Mapbox** (MVP) - Best balance of features and free tier. Consider migrating to MapLibre (open-source fork) for production to avoid costs.

### UI Component Library Comparison

| Library | Customization | Accessibility | Bundle Size | Selected |
|---------|---------------|---------------|-------------|----------|
| **shadcn/ui** | Full control (copy/paste) | WCAG 2.1 ✅ | Minimal | ✅ Yes |
| **Material-UI** | Limited without paid theme | Good | Large | ❌ No |
| **Chakra UI** | Good | Excellent | Moderate | ❌ No |
| **Ant Design** | Moderate | Good | Large | ❌ No |

**Winner: shadcn/ui** - Not a traditional library but a collection of components you own. Built on Radix UI primitives with Tailwind CSS.

### Styling Approach Comparison

| Approach | Dev Speed | Bundle Size | Learning Curve | Selected |
|----------|-----------|-------------|----------------|----------|
| **Tailwind CSS** | Fast | Small (with purge) | Moderate | ✅ Yes |
| **CSS Modules** | Moderate | Small | Easy | ❌ No |
| **Styled Components** | Moderate | Large | Easy | ❌ No |
| **Emotion** | Moderate | Large | Easy | ❌ No |

**Winner: Tailwind CSS** - Industry standard, excellent DX, tiny production bundles.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                      │
│  ┌────────────────────────────────────────────────┐    │
│  │         React 18 + TypeScript + Vite           │    │
│  │  ┌──────────────────────────────────────┐     │    │
│  │  │  UI Layer (shadcn/ui + Tailwind)     │     │    │
│  │  └──────────────────────────────────────┘     │    │
│  │  ┌──────────────────────────────────────┐     │    │
│  │  │  State Management (TanStack Query)   │     │    │
│  │  └──────────────────────────────────────┘     │    │
│  │  ┌──────────────────────────────────────┐     │    │
│  │  │  Routing (React Router DOM)          │     │    │
│  │  └──────────────────────────────────────┘     │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                           │
                           │ HTTPS/WSS
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Supabase (BaaS)                        │
│  ┌────────────────────────────────────────────────┐    │
│  │  PostgreSQL Database                           │    │
│  │  - Courts, Users, Bookings, Reviews            │    │
│  └────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────┐    │
│  │  Authentication (Email/Password + OAuth)       │    │
│  └────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────┐    │
│  │  Storage (Images, Court Photos)                │    │
│  └────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────┐    │
│  │  Edge Functions (API endpoints)                │    │
│  └────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────┐    │
│  │  Realtime (WebSocket subscriptions)            │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                           │
                    External APIs
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                   │
        ▼                  ▼                   ▼
  ┌──────────┐      ┌──────────┐       ┌──────────┐
  │  Mapbox  │      │  Stripe  │       │  Email   │
  │   Maps   │      │ Payments │       │ Service  │
  └──────────┘      └──────────┘       └──────────┘
```

---

## Database Schema Design

### Core Tables

#### 1. Profiles (User Management)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  user_type TEXT CHECK (user_type IN ('player', 'manager')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_profiles_user_type ON profiles(user_type);
CREATE INDEX idx_profiles_email ON profiles(email);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

#### 2. Courts (Venue Information)
```sql
CREATE TABLE courts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT DEFAULT 'Curitiba',
  state TEXT DEFAULT 'PR',
  zip_code TEXT,
  
  -- Pricing
  price_per_hour DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  
  -- Capacity
  max_players INTEGER NOT NULL,
  court_type TEXT CHECK (court_type IN ('indoor', 'outdoor')),
  surface_type TEXT CHECK (surface_type IN ('grass', 'synthetic', 'concrete')),
  
  -- Location
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  
  -- Media
  image_url TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  
  -- Amenities
  has_parking BOOLEAN DEFAULT false,
  has_changing_rooms BOOLEAN DEFAULT false,
  has_showers BOOLEAN DEFAULT false,
  has_lighting BOOLEAN DEFAULT false,
  
  -- Management
  manager_id UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_courts_location ON courts USING GIST (
  ll_to_earth(latitude, longitude)
);
CREATE INDEX idx_courts_manager ON courts(manager_id);
CREATE INDEX idx_courts_active ON courts(is_active) WHERE is_active = true;

-- Full-text search
CREATE INDEX idx_courts_search ON courts USING GIN (
  to_tsvector('portuguese', name || ' ' || COALESCE(description, ''))
);

-- RLS Policies
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active courts"
  ON courts FOR SELECT
  USING (is_active = true);

CREATE POLICY "Managers can manage their courts"
  ON courts FOR ALL
  USING (auth.uid() = manager_id);
```

#### 3. Bookings (Reservations)
```sql
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  court_id INTEGER REFERENCES courts(id) NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  
  -- Booking details
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Pricing
  total_price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  
  -- Status
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'pending',
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'refunded')) DEFAULT 'pending',
  
  -- Additional info
  notes TEXT,
  number_of_players INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT valid_date CHECK (booking_date >= CURRENT_DATE)
);

-- Indexes
CREATE INDEX idx_bookings_court ON bookings(court_id);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Prevent double booking
CREATE UNIQUE INDEX idx_no_double_booking ON bookings(
  court_id, booking_date, start_time
) WHERE status != 'cancelled';

-- RLS Policies
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their pending bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Managers can view bookings for their courts"
  ON bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courts
      WHERE courts.id = bookings.court_id
      AND courts.manager_id = auth.uid()
    )
  );
```

#### 4. Reviews (Court Ratings)
```sql
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  court_id INTEGER REFERENCES courts(id) NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  booking_id INTEGER REFERENCES bookings(id),
  
  -- Review content
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  title TEXT,
  comment TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One review per booking
  CONSTRAINT unique_review_per_booking UNIQUE (booking_id)
);

-- Indexes
CREATE INDEX idx_reviews_court ON reviews(court_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- RLS Policies
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews for their bookings"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = reviews.booking_id
      AND bookings.user_id = auth.uid()
      AND bookings.status = 'completed'
    )
  );
```

### Database Functions

#### Calculate Average Rating
```sql
CREATE OR REPLACE FUNCTION get_court_average_rating(court_id_param INTEGER)
RETURNS DECIMAL AS $$
  SELECT COALESCE(AVG(rating), 0)::DECIMAL(3,2)
  FROM reviews
  WHERE court_id = court_id_param;
$$ LANGUAGE SQL STABLE;
```

#### Check Court Availability
```sql
CREATE OR REPLACE FUNCTION is_court_available(
  court_id_param INTEGER,
  date_param DATE,
  start_time_param TIME,
  end_time_param TIME
)
RETURNS BOOLEAN AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM bookings
    WHERE court_id = court_id_param
    AND booking_date = date_param
    AND status != 'cancelled'
    AND (
      (start_time_param >= start_time AND start_time_param < end_time)
      OR (end_time_param > start_time AND end_time_param <= end_time)
      OR (start_time_param <= start_time AND end_time_param >= end_time)
    )
  );
$$ LANGUAGE SQL STABLE;
```

---

## Frontend Architecture

### Component Structure

```
src/
├── components/
│   ├── ui/                    # Base components (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   └── ...
│   ├── layout/                # Layout components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Sidebar.tsx
│   ├── courts/                # Court-related components
│   │   ├── CourtCard.tsx
│   │   ├── CourtDetails.tsx
│   │   ├── CourtFilters.tsx
│   │   └── CourtsMap.tsx
│   ├── bookings/              # Booking components
│   │   ├── BookingForm.tsx
│   │   ├── BookingCard.tsx
│   │   └── BookingCalendar.tsx
│   ├── auth/                  # Authentication
│   │   ├── SignInForm.tsx
│   │   ├── SignUpForm.tsx
│   │   └── AuthModal.tsx
│   └── reviews/               # Review components
│       ├── ReviewForm.tsx
│       └── ReviewList.tsx
├── pages/                     # Page components
│   ├── Home.tsx
│   ├── CourtDetails.tsx
│   ├── MyBookings.tsx
│   ├── Profile.tsx
│   └── ManageCourts.tsx
├── hooks/                     # Custom hooks
│   ├── useCourts.ts
│   ├── useBookings.ts
│   ├── useAuth.ts
│   └── useGeolocation.ts
├── contexts/                  # React contexts
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
├── lib/                       # Utilities
│   ├── supabaseClient.ts
│   ├── utils.ts
│   └── constants.ts
└── types/                     # TypeScript types
    ├── database.ts
    ├── court.ts
    └── booking.ts
```

### State Management Strategy

**TanStack Query for Server State:**
```typescript
// hooks/useCourts.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export const useCourts = (filters?: CourtFilters) => {
  return useQuery({
    queryKey: ['courts', filters],
    queryFn: async () => {
      let query = supabase
        .from('courts')
        .select(`
          *,
          reviews (rating),
          manager:profiles (name, email)
        `)
        .eq('is_active', true)
      
      if (filters?.maxPrice) {
        query = query.lte('price_per_hour', filters.maxPrice)
      }
      
      if (filters?.courtType) {
        query = query.eq('court_type', filters.courtType)
      }
      
      const { data, error } = await query
      if (error) throw error
      
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
```

**React Context for UI State:**
```typescript
// contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )
    
    return () => subscription.unsubscribe()
  }, [])
  
  // ... implement signIn, signUp, signOut
  
  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
```

---

## API Integration Patterns

### Supabase Client Setup

```typescript
// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public',
  },
})
```

### Example: Create Booking

```typescript
// hooks/useCreateBooking.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { toast } from '@/components/ui/use-toast'

interface CreateBookingInput {
  courtId: number
  date: string
  startTime: string
  endTime: string
}

export const useCreateBooking = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: CreateBookingInput) => {
      // Check availability first
      const { data: available } = await supabase.rpc('is_court_available', {
        court_id_param: input.courtId,
        date_param: input.date,
        start_time_param: input.startTime,
        end_time_param: input.endTime,
      })
      
      if (!available) {
        throw new Error('Court is not available at this time')
      }
      
      // Get court details for pricing
      const { data: court } = await supabase
        .from('courts')
        .select('price_per_hour')
        .eq('id', input.courtId)
        .single()
      
      if (!court) throw new Error('Court not found')
      
      // Calculate duration and price
      const start = new Date(`2000-01-01 ${input.startTime}`)
      const end = new Date(`2000-01-01 ${input.endTime}`)
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      const totalPrice = hours * court.price_per_hour
      
      // Create booking
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          court_id: input.courtId,
          booking_date: input.date,
          start_time: input.startTime,
          end_time: input.endTime,
          total_price: totalPrice,
          status: 'pending',
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      toast({
        title: 'Booking created!',
        description: 'Your court has been successfully booked.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}
```

---

## Performance Optimization

### 1. Code Splitting
```typescript
// Use lazy loading for routes
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

const Home = lazy(() => import('@/pages/Home'))
const CourtDetails = lazy(() => import('@/pages/CourtDetails'))
const MyBookings = lazy(() => import('@/pages/MyBookings'))

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/courts/:id" element={<CourtDetails />} />
          <Route path="/bookings" element={<MyBookings />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
```

### 2. Image Optimization
```typescript
// Use Supabase storage with transformations
const getOptimizedImageUrl = (path: string, width: number) => {
  const { data } = supabase.storage
    .from('court-images')
    .getPublicUrl(path, {
      transform: {
        width,
        quality: 80,
        format: 'webp',
      },
    })
  
  return data.publicUrl
}
```

### 3. Query Optimization
```typescript
// Use React Query's caching and prefetching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Prefetch on hover
const onCourtCardHover = (courtId: number) => {
  queryClient.prefetchQuery({
    queryKey: ['court', courtId],
    queryFn: () => fetchCourtDetails(courtId),
  })
}
```

### 4. Lighthouse Score Targets
- **Performance**: > 90
- **Accessibility**: > 95
- **Best Practices**: > 90
- **SEO**: > 90

---

## Security Best Practices

### 1. Row Level Security (RLS)
Always use RLS policies in Supabase to protect data at the database level.

### 2. Environment Variables
Never commit secrets. Use `.env.local` for local development and configure in hosting platform.

### 3. Input Validation
```typescript
import { z } from 'zod'

const bookingSchema = z.object({
  courtId: z.number().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
})

// Validate before submission
const createBooking = async (data: unknown) => {
  const validated = bookingSchema.parse(data)
  // ... proceed with validated data
}
```

### 4. XSS Prevention
React escapes values by default, but be careful with:
- `dangerouslySetInnerHTML`
- Direct DOM manipulation
- Third-party libraries

---

## Testing Strategy

### Unit Tests (Vitest)
```typescript
// components/CourtCard.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CourtCard } from './CourtCard'

describe('CourtCard', () => {
  it('displays court name and price', () => {
    const court = {
      id: 1,
      name: 'Test Court',
      price_per_hour: 100,
      location: 'Curitiba',
    }
    
    render(<CourtCard court={court} />)
    
    expect(screen.getByText('Test Court')).toBeInTheDocument()
    expect(screen.getByText('R$ 100/hour')).toBeInTheDocument()
  })
})
```

### Integration Tests
```typescript
// Test with React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { useCourts } from '@/hooks/useCourts'

describe('useCourts', () => {
  it('fetches courts successfully', async () => {
    const queryClient = new QueryClient()
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
    
    const { result } = renderHook(() => useCourts(), { wrapper })
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(3)
  })
})
```

### E2E Tests (Optional)
For MVP, focus on unit/integration tests. E2E can be added later with Playwright or Cypress.

---

## Deployment Architecture

### Recommended: Vercel (Serverless)

**Advantages:**
- Zero config for Vite/React
- Automatic HTTPS
- Global CDN
- Preview deployments for PRs
- Generous free tier

**Configuration:**
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "VITE_SUPABASE_URL": "@supabase-url",
    "VITE_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "VITE_MAPBOX_TOKEN": "@mapbox-token"
  }
}
```

### Alternative: Netlify

Similar benefits to Vercel. Configuration:
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Self-Hosted Option: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## Cost Analysis (MVP Phase)

### Free Tier Services

| Service | Free Tier | Estimated Monthly Cost |
|---------|-----------|----------------------|
| **Supabase** | 500MB DB, 1GB storage, 2GB bandwidth | $0 (until limits) |
| **Vercel/Netlify** | 100GB bandwidth, unlimited builds | $0 |
| **Mapbox** | 50,000 map loads/month | $0 (until limits) |
| **Domains** | - | ~$12/year |

**Total MVP Cost: ~$1-5/month** (mostly domain)

### Scale Costs (1000 active users)

| Service | Usage | Estimated Cost |
|---------|-------|----------------|
| **Supabase** | ~5GB DB, ~10GB storage | $25/month (Pro plan) |
| **Vercel** | ~500GB bandwidth | $0-20/month |
| **Mapbox** | ~100k map loads | $50/month |
| **Total** | - | **~$75-95/month** |

---

## Open-Source Alternatives for Future

### Current vs. Future Tech Stack

| Component | MVP Choice | Open-Source Alternative | Migration Effort |
|-----------|-----------|------------------------|-----------------|
| Maps | Mapbox | **MapLibre GL** + OSM | Medium |
| Backend | Supabase | **PocketBase** or **Appwrite** | High |
| Payments | Stripe | **Medusa.js** (limited) | High |
| Analytics | Google Analytics | **Plausible** or **Umami** | Low |
| Monitoring | - | **Sentry** (has free tier) | Low |

---

## MVP Implementation Roadmap

### Sprint 1 (Week 1-2): Foundation
- [x] Project setup (Vite + React + TypeScript)
- [x] Supabase integration
- [x] Authentication system
- [x] Database schema
- [x] Basic UI components

### Sprint 2 (Week 3-4): Core Features
- [x] Court listing page
- [x] Interactive map with Mapbox
- [x] Court details page
- [x] Basic booking flow
- [x] User profile

### Sprint 3 (Week 5-6): Polish & Deploy
- [ ] Booking management
- [ ] Email notifications
- [ ] Reviews system
- [ ] Performance optimization
- [ ] Testing
- [ ] Production deployment

### Post-MVP Enhancements
- [ ] Payment integration (Stripe)
- [ ] Team management
- [ ] Advanced search/filters
- [ ] Mobile app (React Native)
- [ ] Admin dashboard

---

## Development Guidelines

### Code Style
- Use TypeScript strictly (no `any` types)
- Follow React best practices (hooks, composition)
- Use ESLint and Prettier
- Write meaningful comments
- Keep components small (<200 lines)

### Git Workflow
```bash
# Feature branches
git checkout -b feature/booking-calendar

# Commit messages
git commit -m "feat: add booking calendar component"
git commit -m "fix: resolve booking time overlap issue"

# Conventional commits
# feat: new feature
# fix: bug fix
# docs: documentation
# style: formatting
# refactor: code restructuring
# test: add tests
# chore: maintenance
```

### PR Guidelines
- Keep PRs small and focused
- Write clear descriptions
- Include screenshots for UI changes
- Ensure all tests pass
- Request review from team

---

## Monitoring & Analytics

### Essential Metrics to Track

1. **User Metrics**
   - Sign-ups per day/week
   - Active users
   - User retention rate

2. **Business Metrics**
   - Bookings created
   - Booking completion rate
   - Average booking value
   - Court utilization rate

3. **Technical Metrics**
   - Page load time
   - Error rate
   - API response time
   - Database query performance

### Recommended Tools

**Free Tier:**
- **Google Analytics 4**: User behavior
- **Sentry**: Error tracking
- **Vercel Analytics**: Performance
- **Supabase Dashboard**: Database metrics

**Future (Paid):**
- **Mixpanel**: Product analytics
- **LogRocket**: Session replay
- **DataDog**: Infrastructure monitoring

---

## Conclusion

This architecture provides a solid foundation for the Futcerto MVP while remaining flexible for future enhancements. The emphasis on open-source technologies and serverless architecture minimizes costs and complexity during the initial phase.

**Key Takeaways:**
- Start simple, scale smartly
- Leverage managed services for MVP
- Plan migration paths to fully open-source
- Focus on user value over technical perfection
- Measure everything, optimize iteratively

**Next Steps:**
1. Complete Sprint 3 tasks
2. Deploy to production
3. Gather user feedback
4. Iterate based on data
5. Plan Phase 2 features

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-07  
**Maintained by**: Futcerto Development Team
