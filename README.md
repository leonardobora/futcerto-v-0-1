# Futcerto ⚽

**Find and book the best soccer courts in Curitiba with ease.**

Futcerto is a modern web application that connects soccer players with available courts in Curitiba, Brazil. Built with React, TypeScript, and Supabase, it provides an intuitive platform for discovering, viewing, and booking soccer courts throughout the city.

---

## 🚀 Lovable Shipped Event - Season 1

This project is being prepared for application to the **Lovable Shipped** community event (June 16 - July 25, 2025) - a 6-week intensive program where builders from around the world ship amazing products together. The program provides mentorship, community support, and over $3M+ in partner perks while maintaining zero equity requirements.

**Program Timeline:**
- **Week 1:** Ideate
- **Week 2:** Build  
- **Week 3:** Feedback
- **Week 4:** Iterate
- **Week 5:** Launch
- **Week 6:** Showcase

Learn more about Lovable Shipped at [lovable.dev](https://lovable.dev)

---

## ✨ Features

- 🗺️ **Interactive Map**: Browse courts on an integrated Mapbox map
- 🏟️ **Court Discovery**: View detailed information about each court including pricing, capacity, and location
- 👤 **User Authentication**: Secure sign up and login system
- 📅 **Booking System**: Reserve courts for your preferred time slots
- 📱 **Responsive Design**: Optimized for desktop and mobile devices
- 🎨 **Modern UI**: Built with shadcn/ui components and Tailwind CSS

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **State Management**: TanStack Query (React Query)
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Maps**: Mapbox GL JS
- **Forms**: React Hook Form with Zod validation
- **Routing**: React Router DOM
- **Build Tool**: Vite
- **Package Manager**: npm

---

## 📋 Prerequisites

Before running this project, make sure you have:

- **Node.js** (v18 or higher) - [Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **npm** (comes with Node.js)
- **Supabase account** - [supabase.com](https://supabase.com)
- **Mapbox account** - [mapbox.com](https://mapbox.com)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <YOUR_GIT_URL>
cd futcerto-v-0-1
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory and add your configuration:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Mapbox Configuration
VITE_MAPBOX_TOKEN=your_mapbox_access_token
```

### 4. Supabase Setup

You'll need to create the following tables in your Supabase database:

#### Profiles Table
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  user_type TEXT CHECK (user_type IN ('player', 'manager')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Courts Table
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
```

#### Bookings Table
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
```

### 5. Create Supabase Client

Create the file `src/lib/supabaseClient.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 6. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:8080`

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
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── AuthModal.tsx   # Authentication modal
│   ├── BookingModal.tsx # Court booking modal
│   ├── CourtCard.tsx   # Court display card
│   └── CourtsMap.tsx   # Interactive map component
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication state management
├── hooks/              # Custom React hooks
│   ├── useCourts.ts    # Courts data fetching
│   └── use-toast.ts    # Toast notifications
├── lib/                # Utility libraries
│   └── utils.ts        # Helper functions
├── pages/              # Page components
│   └── Index.tsx       # Main application page
└── main.tsx           # Application entry point
```

---

## 🔧 Configuration

### Vite Configuration
The project uses Vite with React SWC plugin for fast builds and hot reload. Path aliases are configured for clean imports (`@/` maps to `./src/`).

### Tailwind CSS
Custom styling with shadcn/ui components. The design system includes:
- Primary color scheme for sports/soccer theme
- Responsive breakpoints
- Dark mode support (via next-themes)

### TypeScript
Strict TypeScript configuration with path mapping and modern ES features enabled.

---

## 🌟 Key Features Detail

### Authentication System
- **Sign Up**: Users can register as either players or court managers
- **Sign In**: Secure email/password authentication via Supabase
- **Profile Management**: User profiles with contact information
- **Protected Routes**: Booking requires authentication

### Court Management
- **Interactive Map**: Mapbox integration showing all available courts
- **Court Details**: Name, location, pricing, capacity, and images
- **Real-time Data**: Courts fetched from Supabase with React Query caching

### Booking System
- **Time Slot Selection**: Users can choose preferred booking times
- **Price Calculation**: Automatic pricing based on duration
- **Booking Confirmation**: Secure booking creation with user verification

---

## 🚢 Deployment

This project is optimized for deployment on:

- **Lovable**: Direct deployment via the Lovable platform
- **Netlify**: Simple drag-and-drop or Git integration
- **Vercel**: Zero-config deployment for React applications

### Build for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

---

## 🤝 Contributing

This project is being prepared for the Lovable Shipped event, and contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🎯 Roadmap

Future enhancements planned:
- [ ] Payment integration for bookings
- [ ] Court availability calendar
- [ ] User reviews and ratings
- [ ] Mobile app development
- [ ] Real-time chat between players
- [ ] Tournament organization features

---

## 📞 Support

For questions or support:
- **GitHub Issues**: Report bugs or request features
- **Lovable Community**: Connect with fellow builders
- **Project URL**: [Lovable Project Dashboard](https://lovable.dev/projects/4fefc2b8-6dc5-460c-8ca3-98eedb5dea7d)

---

## 🏆 Acknowledgments

- **Lovable Team**: For providing an amazing platform and community
- **Lovable Shipped Participants**: Fellow builders who provided feedback and support
- **Open Source Community**: For the incredible tools and libraries that made this possible

---

**Built with ❤️ for Lovable Shipped Season 1 (2025)**