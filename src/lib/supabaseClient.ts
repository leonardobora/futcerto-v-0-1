import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE1MTYyMzkwMjJ9.placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Check if we're using placeholder values and add a warning
export const isSupabaseConfigured = () => {
  return import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
}

// Mock data for development when Supabase is not configured
export const mockCourts = [
  {
    id: 1,
    name: 'Quadra Central',
    location: 'Centro, Curitiba',
    price_per_hour: 60,
    max_players: 10,
    latitude: -25.4372,
    longitude: -49.2569,
    image_url: 'https://via.placeholder.com/300x200?text=Quadra+Central',
    manager_id: 'mock-manager-1',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Arena Sports',
    location: 'Batel, Curitiba',
    price_per_hour: 80,
    max_players: 10,
    latitude: -25.4284,
    longitude: -49.2733,
    image_url: 'https://via.placeholder.com/300x200?text=Arena+Sports',
    manager_id: 'mock-manager-2',
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Futsal Express',
    location: 'Água Verde, Curitiba',
    price_per_hour: 45,
    max_players: 10,
    latitude: -25.4520,
    longitude: -49.2865,
    image_url: 'https://via.placeholder.com/300x200?text=Futsal+Express',
    manager_id: 'mock-manager-3',
    created_at: new Date().toISOString(),
  },
]