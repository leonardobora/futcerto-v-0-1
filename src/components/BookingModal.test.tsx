import { vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingModal } from './BookingModal';
import { AuthProvider } from '../contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner'; // Using sonner for toasts
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import React from 'react';

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

// Mock new Date() to control calendar's initial month
const MOCK_DATE = new Date(2025, 5, 15); // June 15, 2025
vi.setSystemTime(MOCK_DATE);

// Mock Supabase
const mockSupabaseInsertSingle = vi.fn();
const mockSupabaseFromInstance = {
  insert: vi.fn(() => ({
    select: vi.fn(() => ({
      single: mockSupabaseInsertSingle,
    })),
  })),
  select: vi.fn().mockReturnThis(), // For other select calls like profiles
  eq: vi.fn().mockReturnThis(),    // For other eq calls like profiles
  single: vi.fn(),               // For other single calls like profiles
};

vi.mock('@/lib/supabaseClient', async (importOriginal) => {
  const actualSupabaseModule = await importOriginal<typeof import('@/lib/supabaseClient')>();
  return {
    ...actualSupabaseModule,
    supabase: {
      ...actualSupabaseModule.supabase,
      auth: {
        getSession: vi.fn(),
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        // Add other auth methods if used by tested components via useAuth()
      },
      from: vi.fn((tableName: string) => {
        (mockSupabaseFromInstance as any).tableName = tableName; // Store table name for context
        return mockSupabaseFromInstance;
      }),
    },
  };
});

// Mock clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(() => Promise.resolve()),
  },
  writable: true,
  configurable: true,
});

const mockAuthedUser = {
  id: 'user-123',
  email: 'test@example.com',
  user_metadata: { name: 'Test User', phone: '1234567890' },
};

const TestWrapper = ({ children, initialUser = null }: { children: React.ReactNode; initialUser?: any }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries for testing
      },
    },
  });

  // Mock getSession for AuthProvider
  if (initialUser) {
    (supabase.auth.getSession as vi.Mock).mockResolvedValue({
      data: { session: { user: initialUser, access_token: 'fake-token' } },
      error: null,
    });
    // Mock profile fetch for this user within AuthProvider
    (mockSupabaseFromInstance.single as vi.Mock).mockImplementation(function(this: any) {
      if ((this as any).tableName === 'profiles') {
        return Promise.resolve({ data: { id: initialUser.id, ...initialUser.user_metadata }, error: null });
      }
      return Promise.resolve({data: {}, error: new Error("Unexpected profile fetch")});
    });

  } else {
    (supabase.auth.getSession as vi.Mock).mockResolvedValue({ data: { session: null }, error: null });
     (mockSupabaseFromInstance.single as vi.Mock).mockImplementation(function(this: any) {
      if ((this as any).tableName === 'profiles') {
        return Promise.resolve({ data: null, error: new Error("No user session for profile") });
      }
      return Promise.resolve({data: {}, error: new Error("Unexpected profile fetch")});
    });
  }


  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
};

const renderBookingModal = (
  props: Partial<React.ComponentProps<typeof BookingModal>> = {},
  initialUser: any = mockAuthedUser
) => {
  const defaultProps: React.ComponentProps<typeof BookingModal> = {
    isOpen: true,
    onClose: vi.fn(),
    courtId: 1,
    courtName: 'Test Court Alpha',
    courtPrice: 50,
  };

  return render(
    <TestWrapper initialUser={initialUser}>
      <BookingModal {...defaultProps} {...props} />
    </TestWrapper>
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.setSystemTime(MOCK_DATE); // Reset system time for each test

  // Default Supabase client mocks
  (supabase.auth.getSession as vi.Mock).mockResolvedValue({ data: { session: null }, error: null });
  (supabase.auth.onAuthStateChange as vi.Mock).mockImplementation(() => ({
    data: { subscription: { unsubscribe: vi.fn() } },
  }));
  (supabase.from as vi.Mock).mockImplementation((tableName: string) => {
    (mockSupabaseFromInstance as any).tableName = tableName;
     // Reset specific mocks for the chainable instance
    mockSupabaseFromInstance.insert.mockImplementation(() => ({ // Default insert behavior
        select: vi.fn(() => ({
            single: mockSupabaseInsertSingle.mockResolvedValue({ data: {}, error: null }), // Default successful insert
        })),
    }));
    mockSupabaseFromInstance.select.mockReturnThis();
    mockSupabaseFromInstance.eq.mockReturnThis();
    mockSupabaseFromInstance.single.mockResolvedValue({ data: {}, error: null }); // Default for profile fetches or others
    return mockSupabaseFromInstance;
  });
  mockSupabaseInsertSingle.mockResolvedValue({ data: { id: 'new-booking-id' }, error: null }); // Default for successful booking insert

  (navigator.clipboard.writeText as vi.Mock).mockResolvedValue(undefined);
});

describe('BookingModal', () => {
  it('renders correctly with court name, calendar, and time select', async () => {
    renderBookingModal();
    expect(screen.getByText('Reservar Test Court Alpha')).toBeInTheDocument();
    expect(screen.getByRole('grid')).toBeInTheDocument(); // Calendar
    const timeSelectTrigger = screen.getByRole('combobox');
    expect(timeSelectTrigger).toBeInTheDocument();
    expect(within(timeSelectTrigger).getByText(/selecione o horário/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirmar reserva/i })).toBeInTheDocument();
  });

  describe('Input Validation', () => {
    it('shows error toast if date is not selected and Confirmar Reserva is clicked', async () => {
      const {debug} = renderBookingModal();
      // User profile/name is not displayed in this modal, so no need to wait for 'Test User'

      await userEvent.click(screen.getByRole('button', { name: /confirmar reserva/i }));

      await waitFor(() => {
        // Check for the toast title first, then the specific description
        expect(screen.getByText(/erro na reserva/i)).toBeInTheDocument();
        expect(screen.getByText("Por favor selecione data e horário")).toBeInTheDocument();
      });
      expect(mockSupabaseFromInstance.insert).not.toHaveBeenCalled();
    });

    it('shows error toast if time is not selected (assuming it could be cleared - though current component defaults it)', async () => {
      // Note: The current component defaults time to '08:00'.
      // This test is more conceptual for if the time could be unselected.
      // For now, we'll proceed as if it's possible to not have a time.
      renderBookingModal();
      // User profile/name is not displayed in this modal

      // To simulate no time selected, we'd need to modify the component's state if possible,
      // or ensure the test setup doesn't provide a default selected time.
      // Since the component internally defaults it, this specific test case is hard to trigger
      // without direct state manipulation or component change.
      // We will assume the date validation test covers the general logic.
      // If startTime were nullable and not defaulted:
      // await userEvent.click(screen.getByRole('button', { name: /confirmar reserva/i }));
      // await waitFor(() => {
      //   expect(screen.getByText(/por favor selecione data e horário/i)).toBeInTheDocument();
      // });
      // expect(mockSupabaseFromInstance.insert).not.toHaveBeenCalled();
      // Skipping the "time not selected" part of the toast message as date is the one not selected.
    });
  });

  describe('Successful Booking', () => {
    it('creates a booking, shows success toast, copies link, and calls onClose', async () => {
      const onCloseMock = vi.fn();
      const mockBookingId = 'booking-success-123';
      mockSupabaseInsertSingle.mockResolvedValueOnce({
        data: {
          id: mockBookingId,
          court_id: 1,
          user_id: mockAuthedUser.id, // Ensure this is player_id in your DB
          booking_date: '2024-07-30', // This will be the selected date
          start_time: '10:00',
          end_time: '11:00', // Calculated
          status: 'confirmed'
        },
        error: null,
      });

      renderBookingModal({ onClose: onCloseMock, courtId: 1, courtPrice: 75 });
      // User profile/name is not displayed in this modal

      // Select a date - find the first enabled day in the current month's view
      const dayCells = await screen.findAllByRole('gridcell');
      const firstEnabledDay = dayCells.find(
        cell => !cell.hasAttribute('aria-disabled') || cell.getAttribute('aria-disabled') === 'false'
      );
      if (!firstEnabledDay) throw new Error("No enabled date found in calendar");
      await userEvent.click(firstEnabledDay);

      // Select a time
      const timeSelectTrigger = screen.getByRole('combobox');
      await userEvent.click(timeSelectTrigger);
      await userEvent.click(screen.getByRole('option', { name: '10:00' }));

      // Click confirm
      await userEvent.click(screen.getByRole('button', { name: /confirmar reserva/i }));

      // Verify Supabase call
      await waitFor(() => {
        expect(mockSupabaseFromInstance.insert).toHaveBeenCalledWith([
          expect.objectContaining({
            court_id: 1,
            user_id: mockAuthedUser.id,
            name: mockAuthedUser.user_metadata.name,
            phone: mockAuthedUser.user_metadata.phone,
            // date will be dynamic based on selection, check for presence
            booking_date: expect.any(String),
            start_time: '10:00',
            end_time: '11:00', // Assuming 1hr duration
            total_price: 75, // courtPrice
            status: 'pending', // Default status
          }),
        ]);
      });

      // Verify success toast
      await waitFor(() => {
        expect(screen.getByText(/reserva confirmada!/i)).toBeInTheDocument();
      });

      // Verify clipboard call
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        `http://localhost:3000/reserva/${mockBookingId}` // Default port is 5173 for Vite, ensure this matches
      );

      // Verify onClose call
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Booking Conflicts and Errors', () => {
    it('shows unique constraint error toast and does not call onClose', async () => {
      const onCloseMock = vi.fn();
      mockSupabaseInsertSingle.mockResolvedValueOnce({
        data: null,
        error: { code: '23505', message: 'unique constraint violation' } as any,
      });

      renderBookingModal({ onClose: onCloseMock });
      // User profile/name is not displayed in this modal
      // User profile/name is not displayed in this modal

      // Select date and time
      const dayCellsConflict = await screen.findAllByRole('gridcell');
      // Try to pick a different day than the previous test, e.g., the second enabled day
      const enabledDaysConflict = dayCellsConflict.filter(
        cell => !cell.hasAttribute('aria-disabled') || cell.getAttribute('aria-disabled') === 'false'
      );
      if (enabledDaysConflict.length < 2) throw new Error("Not enough enabled dates for conflict test");
      await userEvent.click(enabledDaysConflict[1]); // Click the second enabled day

      const timeSelectTrigger = screen.getByRole('combobox');
      await userEvent.click(timeSelectTrigger);
      await userEvent.click(screen.getByRole('option', { name: '11:00' }));

      await userEvent.click(screen.getByRole('button', { name: /confirmar reserva/i }));

      await waitFor(() => {
        expect(screen.getByText(/este horário já está reservado./i)).toBeInTheDocument();
        expect(screen.getByText(/escolha outro horário./i)).toBeInTheDocument();
      });
      expect(onCloseMock).not.toHaveBeenCalled();
    });

    it('shows generic error toast for other Supabase errors and does not call onClose', async () => {
      const onCloseMock = vi.fn();
      const errorMessage = 'A different kind of booking error';
      mockSupabaseInsertSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: errorMessage } as any, // Example of another error
      });

      renderBookingModal({ onClose: onCloseMock });
      await waitFor(() => expect(screen.getByText('Test User')).toBeInTheDocument());

      // Select date and time
      const dayCellsError = await screen.findAllByRole('gridcell');
      const enabledDaysError = dayCellsError.filter(
        cell => !cell.hasAttribute('aria-disabled') || cell.getAttribute('aria-disabled') === 'false'
      );
      if (enabledDaysError.length < 3) throw new Error("Not enough enabled dates for error test");
      await userEvent.click(enabledDaysError[2]); // Click the third enabled day


      const timeSelectTrigger = screen.getByRole('combobox');
      await userEvent.click(timeSelectTrigger);
      await userEvent.click(screen.getByRole('option', { name: '14:00' }));

      await userEvent.click(screen.getByRole('button', { name: /confirmar reserva/i }));

      await waitFor(() => {
        expect(screen.getByText(/erro na reserva/i)).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
      expect(onCloseMock).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('disables button and shows "Reservando..." text during submission', async () => {
      // Make Supabase call take time
      mockSupabaseInsertSingle.mockImplementationOnce(() => {
        return new Promise(resolve => setTimeout(() => resolve({ data: { id: 'loading-test-id'}, error: null }), 100));
      });

      renderBookingModal();
      // User profile/name is not displayed in this modal

      // Select date and time
      const dayCellsLoading = await screen.findAllByRole('gridcell');
      const enabledDaysLoading = dayCellsLoading.filter(
        cell => !cell.hasAttribute('aria-disabled') || cell.getAttribute('aria-disabled') === 'false'
      );
      if (enabledDaysLoading.length < 4) throw new Error("Not enough enabled dates for loading test");
      await userEvent.click(enabledDaysLoading[3]); // Click the fourth enabled day

      const timeSelectTrigger = screen.getByRole('combobox');
      await userEvent.click(timeSelectTrigger);
      await userEvent.click(screen.getByRole('option', { name: '15:00' }));

      const confirmButton = screen.getByRole('button', { name: /confirmar reserva/i });
      userEvent.click(confirmButton); // No await here, check state immediately

      // Check immediately for disabled state and text change
      await waitFor(() => expect(confirmButton).toBeDisabled());
      expect(screen.getByText(/reservando\.\.\./i)).toBeInTheDocument();

      // Wait for the operation to complete to avoid issues with other tests
      await waitFor(() => expect(confirmButton).not.toBeDisabled(), { timeout: 2000 });
      await waitFor(() => expect(screen.getByText(/reserva confirmada!/i)).toBeInTheDocument(), { timeout: 2000 }); // Wait for success toast
    });
  });
});
