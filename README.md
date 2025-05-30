# FutCerto ⚽

FutCerto is a web application for finding and booking soccer courts, initially focused on Curitiba. It allows players to find courts, check availability, and make reservations. Court managers will also have functionalities to manage their courts and bookings (future feature).

The project is built with React, Vite, TypeScript, Shadcn UI, Tailwind CSS, and uses Supabase for the backend.

## Current Status (MVP - Phase 1 & 2 Core Implemented)

The application now has a functional backend powered by Supabase, allowing for real user authentication, court listings from a database, and a persistent booking system.

### Implemented Features:
*   **User Authentication:**
    *   User registration (Player or Manager roles) via email/password.
    *   User login and logout.
    *   Session persistence.
    *   User profiles stored in Supabase.
*   **Court Listings:**
    *   Courts are fetched from the Supabase database.
    *   Interactive Mapbox map displaying court locations in Curitiba.
    *   Clickable map markers to select a court.
    *   Court cards with details (name, location, price, image).
*   **Booking System:**
    *   Modal for booking a selected court.
    *   Date and time selection for bookings.
    *   Bookings are saved to the Supabase database, linked to the user and court.
    *   Basic conflict handling for already booked slots (via database constraints).
    *   Mock invitation link generated upon successful booking (actual sharing mechanism is pending).
*   **UI/UX:**
    *   Responsive design.
    *   Components from Shadcn UI.
    *   Toast notifications for user actions (success/error).

### Key Technologies Used:
*   **Frontend:** React, Vite, TypeScript, Tailwind CSS, Shadcn UI
*   **Mapping:** Mapbox GL JS
*   **Backend:** Supabase (Authentication, Database - PostgreSQL, Storage (planned))
*   **State Management:** React Context (for Auth), TanStack Query (for server state - courts)
*   **Routing:** React Router DOM

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   [Node.js](https://nodejs.org/) (LTS version recommended)
*   [npm](https://www.npmjs.com/) (comes with Node.js) or [Bun](https://bun.sh/) (optional, for faster performance)
*   A [Supabase](https://supabase.com/) account and a new project created.
*   A [Mapbox](https://www.mapbox.com/) account and an access token.

### Installation & Setup

1.  **Clone the repository (or ensure you have the project files):**
    ```bash
    # If you were cloning:
    # git clone <repository-url>
    # cd <repository-name>
    ```

2.  **Install dependencies:**
    Using npm:
    ```bash
    npm install
    ```
    Or using Bun:
    ```bash
    bun install
    ```

3.  **Set up Environment Variables:**
    Create a `.env` file in the root of the project by copying the example (if one existed) or creating it manually. Add the following variables:

    ```env
    VITE_SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL"
    VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_PROJECT_ANON_KEY"
    VITE_MAPBOX_ACCESS_TOKEN="YOUR_MAPBOX_ACCESS_TOKEN"
    ```
    *   Replace `YOUR_SUPABASE_PROJECT_URL` and `YOUR_SUPABASE_PROJECT_ANON_KEY` with your actual Supabase project URL and public anon key (found in your Supabase project's API settings).
    *   Replace `YOUR_MAPBOX_ACCESS_TOKEN` with your Mapbox public access token.
    *   **Important for Mapbox:** The `CourtsMap.tsx` component currently has a hardcoded Mapbox access token. You should modify it to use `import.meta.env.VITE_MAPBOX_ACCESS_TOKEN`.
        *File to update: `src/components/CourtsMap.tsx`*
        *Change:*
        ```diff
        - mapboxgl.accessToken = 'pk.eyJ1IjoibGVvbmFyZG9ib3JhIiwiYSI6ImNtNXh2anR5NDA2bGQya29venNtdnRvMTkifQ.3lXFg1NQotmr9cTi5OhaOg';
        + mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
        ```
        *And update `src/vite-env.d.ts` to include `VITE_MAPBOX_ACCESS_TOKEN: string;`*


4.  **Set up Supabase Database:**
    You need to set up the tables and Row Level Security (RLS) policies in your Supabase project. The necessary SQL schema is:

    ```sql
    -- Tabela de perfis de usuários
    CREATE TABLE profiles (
      id UUID REFERENCES auth.users(id) PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL, -- Added email to profile as it's good practice
      phone TEXT,
      user_type TEXT CHECK (user_type IN ('player', 'manager')) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- Added updated_at
    );

    -- Tabela de quadras
    CREATE TABLE courts (
      id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      price_per_hour DECIMAL(10,2) NOT NULL,
      max_players INTEGER DEFAULT 14,
      latitude DECIMAL(10,8), -- Consider using PostGIS for geo data later
      longitude DECIMAL(11,8),
      image_url TEXT,
      manager_id UUID REFERENCES profiles(id), -- Link to manager profile
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- Added updated_at
    );

    -- Tabela de reservas
    CREATE TABLE bookings (
      id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      court_id BIGINT REFERENCES courts(id) NOT NULL,
      player_id UUID REFERENCES profiles(id) NOT NULL, -- Should reference profiles.id
      booking_date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      total_price DECIMAL(10,2), -- Consider calculating or ensure it's set
      status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled')) DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- Added updated_at
    );

    -- Habilitar RLS
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

    -- Políticas básicas (adapt and secure these further based on requirements)
    -- Profiles
    CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
    CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id); -- Users create their own profile on signup
    CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

    -- Courts
    CREATE POLICY "Anyone can view courts" ON courts FOR SELECT TO authenticated, anon USING (true); -- Allow anon too if needed for logged-out users
    -- For managers to add/edit courts (ensure manager_id is set correctly and auth.uid() matches)
    -- CREATE POLICY "Managers can insert their own courts" ON courts FOR INSERT WITH CHECK (auth.uid() = manager_id AND (SELECT user_type FROM profiles WHERE id = auth.uid()) = 'manager');
    -- CREATE POLICY "Managers can update their own courts" ON courts FOR UPDATE USING (auth.uid() = manager_id AND (SELECT user_type FROM profiles WHERE id = auth.uid()) = 'manager');
    -- CREATE POLICY "Managers can delete their own courts" ON courts FOR DELETE USING (auth.uid() = manager_id AND (SELECT user_type FROM profiles WHERE id = auth.uid()) = 'manager');
    -- Simplified for now, as manager_id is not being set on court creation yet:
    CREATE POLICY "Authenticated users can insert courts" ON courts FOR INSERT TO authenticated WITH CHECK (true);


    -- Bookings
    CREATE POLICY "Users can view their own bookings" ON bookings FOR SELECT USING (auth.uid() = player_id);
    CREATE POLICY "Users can create bookings for themselves" ON bookings FOR INSERT WITH CHECK (auth.uid() = player_id);
    -- CREATE POLICY "Users can cancel their own bookings" ON bookings FOR UPDATE USING (auth.uid() = player_id) WITH CHECK (status = 'cancelled');
    -- (More specific update/delete policies for bookings needed)

    -- You should also insert some initial data for courts, e.g.:
    INSERT INTO courts (name, location, price_per_hour, latitude, longitude, image_url) VALUES
    ('Arena Soccer Barigui', 'R. Padre Agostinho, 2485 - Bigorrilho', 200.00, -25.4284, -49.2933, 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6'),
    ('Soccer Hall', 'R. Brasílio Itiberê, 3279 - Água Verde', 180.00, -25.4484, -49.2833, 'https://images.unsplash.com/photo-1624880357913-a8539238245b'),
    ('CT Bacacheri', 'R. Costa Rica, 313 - Bacacheri', 160.00, -25.3984, -49.2433, 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68');
    ```
    Execute these SQL commands in the SQL Editor in your Supabase project dashboard.

5.  **Run the development server:**
    Using npm:
    ```bash
    npm run dev
    ```
    Or using Bun:
    ```bash
    bun dev
    ```
    The application should now be running, typically at `http://localhost:5173`.

## Current Limitations & Future Work

While the MVP core is functional, there are several areas for improvement and future development:

*   **Manager Functionality:**
    *   No dedicated dashboard for court managers.
    *   Managers cannot yet add, edit, or delete their courts through the UI.
    *   `manager_id` in the `courts` table is not yet utilized in court creation.
    *   No system for managers to approve or manage bookings for their courts.
*   **Player Dashboard:**
    *   No dedicated dashboard for players to see "My Bookings" or manage their profile easily.
*   **Booking System Enhancements:**
    *   No real-time availability checking beyond basic database constraints (potential for race conditions without further locking or Supabase function logic).
    *   No explicit handling of booking durations beyond a fixed 1-hour slot. `total_price` is not calculated or stored.
    *   Invitation link is generated but not yet integrated with actual sharing (WhatsApp/Email). No page to accept invites.
*   **Error Handling & Validation:**
    *   While basic error handling is in place, more comprehensive validation (client and server-side) can be added.
    *   More robust error messages and user guidance.
*   **Advanced Features (Not Implemented):**
    *   Payment integration (Stripe/PagSeguro, PIX).
    *   Tela de Seleção de Posições (FIFA-style player selection for matches).
    *   Notifications (Push, Email, WhatsApp).
    *   Court/Player rating system.
    *   PWA features.
*   **Data & Configuration:**
    *   Mapbox token is currently hardcoded in `CourtsMap.tsx` and needs to be moved to `.env`. (Instructions provided above to fix this).
    *   Limited seed data for courts.
*   **Security:**
    *   RLS policies are basic and need thorough review and enhancement, especially for manager roles and court/booking modifications.

## Contributing

Contributions are welcome! (Standard contribution guidelines would go here if it were a public project).

---

*This README was last updated: $(date)*
