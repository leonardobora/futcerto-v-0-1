import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import ProfilePage from './ProfilePage';
import { AuthContextType, useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Toaster as SonnerToaster } from '@/components/ui/sonner'; // For any toasts if used

// Mock window.matchMedia for sonner toast library
global.window.matchMedia = vi.fn(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(), // deprecated
  removeListener: vi.fn(), // deprecated
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Mock useAuth
vi.mock('@/contexts/AuthContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/contexts/AuthContext')>();
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

// Mock Supabase client
const mockSupabaseProfileSingle = vi.fn();
const mockSupabaseBookingsChainEnd = vi.fn(); // This is the final mock fn that useQuery will await

vi.mock('@/lib/supabaseClient', async (importOriginal) => {
  const actualSupabaseModule = await importOriginal<typeof import('@/lib/supabaseClient')>();
  return {
    ...actualSupabaseModule,
    supabase: {
      from: vi.fn((tableName: string) => {
        if (tableName === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue({
              single: mockSupabaseProfileSingle,
            }),
          };
        }
        if (tableName === 'bookings') {
          // The result of the *second* order() call is what's awaited by useQuery's queryFn.
          // So, the second order property must hold the mock function that returns a Promise.
          const secondOrderCall = mockSupabaseBookingsChainEnd;

          // The result of the *first* order() call must be an object that has an 'order' method.
          const firstOrderCallResult = {
            order: secondOrderCall,
          };

          // The result of .eq() must be an object that has an 'order' method.
          const eqCallResult = {
            order: vi.fn(() => firstOrderCallResult),
          };

          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue(eqCallResult),
          };
        }
        // Default fallback
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: {}, error: null }),
          order: vi.fn().mockReturnThis(),
        };
      }),
      auth: { /* ... */ },
    },
  };
});


const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  user_metadata: {}, // Add if needed
};

const mockProfileData = {
  name: 'Test User',
  email: 'test@example.com',
  phone: '1234567890',
  user_type: 'player',
};

const mockBookingsData = [
  { id: 'booking-1', booking_date: '2024-08-15', start_time: '10:00', end_time: '11:00', status: 'confirmed', courts: { name: 'Court Alpha' }, court_name: 'Court Alpha' },
  { id: 'booking-2', booking_date: '2024-08-16', start_time: '14:00', end_time: '15:00', status: 'pending', courts: { name: 'Court Beta' }, court_name: 'Court Beta' },
];


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Disable retries for testing to fail faster
      cacheTime: 0, // Disable caching for tests
    },
  },
});

const renderProfilePage = (authContextValue: Partial<AuthContextType>) => {
  (useAuth as vi.Mock).mockReturnValue({ user: null, profile: null, session: null, loading: true, ...authContextValue });

  // Mock implementations will be set in each test or beforeEach.

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ProfilePage />
        <SonnerToaster />
      </MemoryRouter>
    </QueryClientProvider>
  );
};


describe('ProfilePage', () => {
  beforeEach(() => {
    queryClient.clear(); // Clear query cache before each test
    vi.clearAllMocks();

    // Reset mocks to default promise-returning functions before each test
    mockSupabaseProfileSingle.mockImplementation(() => Promise.resolve({ data: null, error: new Error("Profile mock not explicitly set for this test") }));
    mockSupabaseBookingsChainEnd.mockImplementation(() => Promise.resolve({ data: null, error: new Error("Bookings mock not explicitly set for this test") }));

    // Default to logged out, auth loading false
    (useAuth as vi.Mock).mockReturnValue({ user: null, profile: null, session: null, loading: false, signOut: vi.fn() });
  });

  it('displays login message when user is logged out', async () => {
    renderProfilePage({ user: null, loading: false });
    expect(screen.getByText(/por favor, faça login para visualizar seu perfil e reservas./i)).toBeInTheDocument();
    expect(mockSupabaseProfileSingle).not.toHaveBeenCalled();
    expect(mockSupabaseBookingsChainEnd).not.toHaveBeenCalled();
  });

  it('displays profile and bookings successfully when user is logged in', async () => {
    (useAuth as vi.Mock).mockReturnValue({ user: mockUser, profile: mockProfileData, session: {}, loading: false });
    mockSupabaseProfileSingle.mockResolvedValue({ data: mockProfileData, error: null });
    mockSupabaseBookingsChainEnd.mockResolvedValue({ data: mockBookingsData, error: null });

    renderProfilePage({ user: mockUser, loading: false });

    // Profile assertions
    await waitFor(() => expect(screen.getByText(mockProfileData.name)).toBeInTheDocument());
    expect(screen.getByText(mockProfileData.email)).toBeInTheDocument();
    expect(screen.getByText(mockProfileData.phone)).toBeInTheDocument();
    expect(screen.getByText('Jogador')).toBeInTheDocument(); // Mapped user_type

    // Bookings assertions
    await waitFor(() => expect(screen.getByText('Court Alpha')).toBeInTheDocument());
    expect(screen.getByText('Court Beta')).toBeInTheDocument();
    expect(screen.getByText('10:00 - 11:00')).toBeInTheDocument();
    expect(screen.getByText('14:00 - 15:00')).toBeInTheDocument();
    expect(screen.getByText('Confirmada')).toBeInTheDocument();
    expect(screen.getByText('Pendente')).toBeInTheDocument();
  });

  it('displays "no bookings" message when user is logged in but has no bookings', async () => {
    (useAuth as vi.Mock).mockReturnValue({ user: mockUser, profile: mockProfileData, session: {}, loading: false });
    mockSupabaseProfileSingle.mockResolvedValue({ data: mockProfileData, error: null });
    mockSupabaseBookingsChainEnd.mockResolvedValue({ data: [], error: null }); // Empty array for bookings

    renderProfilePage({ user: mockUser, loading: false });

    await waitFor(() => expect(screen.getByText(mockProfileData.name)).toBeInTheDocument()); // Profile loads
    await waitFor(() => expect(screen.getByText(/você ainda não possui reservas./i)).toBeInTheDocument());
  });

  describe('Loading States', () => {
     it('shows skeletons while profile is loading', async () => {
      (useAuth as vi.Mock).mockReturnValue({ user: mockUser, profile: null, session: {}, loading: false });
      mockSupabaseProfileSingle.mockImplementation(() => new Promise(() => {})); // Keep profile promise pending
      mockSupabaseBookingsChainEnd.mockResolvedValue({ data: [], error: null }); // Bookings can resolve

      renderProfilePage({ user: mockUser, loading: false });

      // Check for profile skeletons
      const profileCard = screen.getByText('Meu Perfil').closest('div[role="figure"]'); // Assuming Card is a figure or similar landmark
      // This is a bit fragile; depends on Card structure. A more robust way is to add data-testid
      // For now, let's assume CardContent is a good container for skeletons.
      // Skeletons have class 'animate-pulse'
      const profileSkeletons = screen.getAllByText('Meu Perfil')[0].closest('.rounded-lg.border')?.querySelectorAll('.animate-pulse');
      expect(profileSkeletons?.length).toBeGreaterThan(0);
    });

    it('shows skeletons while bookings are loading', async () => {
      (useAuth as vi.Mock).mockReturnValue({ user: mockUser, profile: mockProfileData, session: {}, loading: false });
      mockSupabaseProfileSingle.mockResolvedValue({ data: mockProfileData, error: null }); // Profile resolves
      mockSupabaseBookingsChainEnd.mockImplementation(() => new Promise(() => {})); // Bookings promise is pending

      renderProfilePage({ user: mockUser, loading: false });

      await waitFor(() => expect(screen.getByText(mockProfileData.name)).toBeInTheDocument()); // Profile loaded

      // Check for bookings skeletons
      const bookingsSkeletons = screen.getByText('Minhas Reservas').closest('.rounded-lg.border')?.querySelectorAll('.animate-pulse');
      expect(bookingsSkeletons?.length).toBeGreaterThan(0);
    });
  });

  describe('Error States', () => {
    it('shows profile fetch error', async () => {
      (useAuth as vi.Mock).mockReturnValue({ user: mockUser, profile: null, session: {}, loading: false });
      mockSupabaseProfileSingle.mockRejectedValue(new Error('Failed to fetch profile'));
      mockSupabaseBookingsChainEnd.mockResolvedValue({ data: [], error: null });

      renderProfilePage({ user: mockUser, loading: false });

      await waitFor(() => expect(screen.getByText(/erro ao carregar perfil/i)).toBeInTheDocument());
      expect(screen.getByText(/failed to fetch profile/i)).toBeInTheDocument();
    });

    it('shows bookings fetch error', async () => {
      (useAuth as vi.Mock).mockReturnValue({ user: mockUser, profile: mockProfileData, session: {}, loading: false });
      mockSupabaseProfileSingle.mockResolvedValue({ data: mockProfileData, error: null });
      mockSupabaseBookingsChainEnd.mockRejectedValue(new Error('Failed to fetch bookings'));

      renderProfilePage({ user: mockUser, loading: false });

      await waitFor(() => expect(screen.getByText(mockProfileData.name)).toBeInTheDocument()); // Profile loaded
      await waitFor(() => expect(screen.getByText(/erro ao carregar reservas/i)).toBeInTheDocument());
      expect(screen.getByText(/failed to fetch bookings/i)).toBeInTheDocument();
    });
  });
});
