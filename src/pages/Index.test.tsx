import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import Index from './Index';
import { AuthContextType, useAuth } from '@/contexts/AuthContext';
import { useCourts, Court } from '@/hooks/useCourts';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';

vi.mock('@/contexts/AuthContext');
vi.mock('@/hooks/useCourts');
vi.mock('@/components/CourtsMap', () => ({
  default: ({ courts }: { courts: any[] }) => <div data-testid="courts-map">{courts.length} courts on map</div>,
}));
vi.mock('@/components/CourtCard', () => ({
  CourtCard: ({ name, onBook }: { name: string, onBook: () => void }) => (
    <div data-testid="court-card">
      <span>{name}</span>
      <button onClick={onBook}>Book</button>
    </div>
  ),
}));

global.window.matchMedia = vi.fn(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Polyfill for PointerEvent methods missing in JSDOM
if (global.window && typeof Element !== 'undefined' && !Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = function(pointerId: number): boolean {
    // @ts-ignore
    return !!(this._pointerCapture && this._pointerCapture[pointerId]);
  };
}
if (global.window && typeof Element !== 'undefined' && !Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = function(pointerId: number): void {
    // @ts-ignore
    this._pointerCapture = this._pointerCapture || {};
    // @ts-ignore
    this._pointerCapture[pointerId] = true;
  };
}
if (global.window && typeof Element !== 'undefined' && !Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = function(pointerId: number): void {
    // @ts-ignore
    if (this._pointerCapture) {
      // @ts-ignore
      delete this._pointerCapture[pointerId];
    }
  };
}
// Polyfill for scrollIntoView
if (global.window && typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}
const mockUser = { id: 'user-123', email: 'test@example.com' };
const mockProfile = { name: 'Test User', email: 'test@example.com', phone: '1234567890', user_type: 'player', avatar_url: '' };

const allMockCourts: Court[] = [
  { id: 1, name: 'Quadra Central', location: 'Centro', price_per_hour: 60, max_players: 10, latitude: 0, longitude: 0, image_url: '', created_at: '1' },
  { id: 2, name: 'Quadra Bairro Novo', location: 'Bairro X', price_per_hour: 40, max_players: 10, latitude: 0, longitude: 0, image_url: '', created_at: '2' },
  { id: 3, name: 'Grande Quadra Society', location: 'Centro', price_per_hour: 120, max_players: 22, latitude: 0, longitude: 0, image_url: '', created_at: '3' },
  { id: 4, name: 'Quadra Pequena 7v7', location: 'Bairro Y', price_per_hour: 80, max_players: 14, latitude: 0, longitude: 0, image_url: '', created_at: '4' },
];

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, cacheTime: 0 } },
});

const renderIndexPage = (
  useAuthMockValue: Partial<AuthContextType> = { user: mockUser, profile: mockProfile, loading: false, signOut: vi.fn() },
  courtsHookImplementation?: (filters: any) => { data?: Court[]; isLoading?: boolean; error?: Error | null }
) => {
  (useAuth as vi.Mock).mockReturnValue(useAuthMockValue);
  if (courtsHookImplementation) {
    (useCourts as vi.Mock).mockImplementation(courtsHookImplementation);
  } else {
    (useCourts as vi.Mock).mockReturnValue({ data: allMockCourts, isLoading: false, error: null });
  }

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Index />
        <SonnerToaster />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('IndexPage Filter Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    // Default useCourts mock for initial render in most tests
    (useCourts as vi.Mock).mockReturnValue({ data: allMockCourts, isLoading: false, error: null });

  });

  it('1. Initial Load: displays all courts', async () => {
    renderIndexPage();
    await waitFor(() => {
      expect(screen.getAllByTestId('court-card')).toHaveLength(allMockCourts.length);
    });
    // Expect initial call with empty filters (default state in Index.tsx)
    expect(useCourts).toHaveBeenCalledWith({ searchTerm: '', priceFilter: '', capacityFilter: '' });
  });

  it('2. Search Term Filter: filters courts by name', async () => {
    const searchTerm = 'Central';
    const expectedFilteredCourts = allMockCourts.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const courtsMock = vi.fn((filters) => {
      if (filters.searchTerm === searchTerm) {
        return { data: expectedFilteredCourts, isLoading: false, error: null };
      }
      return { data: allMockCourts, isLoading: false, error: null };
    });

    renderIndexPage(undefined, courtsMock);

    const searchInput = screen.getByPlaceholderText(/buscar por nome ou local.../i);
    await userEvent.type(searchInput, searchTerm);

    await waitFor(() => {
      expect(courtsMock).toHaveBeenCalledWith(expect.objectContaining({ searchTerm }));
    });

    await waitFor(() => {
      expect(screen.getAllByTestId('court-card')).toHaveLength(expectedFilteredCourts.length);
      expect(screen.getByText('Quadra Central')).toBeInTheDocument();
    });
  });

  it('3. Price Filter: filters courts by price range (Up to R$50)', async () => {
    const priceFilterValue = '0-50';
    const expectedFilteredCourts = allMockCourts.filter(c => c.price_per_hour >= 0 && c.price_per_hour <= 50);

    const courtsMock = vi.fn((filters) => {
      if (filters.priceFilter === priceFilterValue) {
        return { data: expectedFilteredCourts, isLoading: false, error: null };
      }
      return { data: allMockCourts, isLoading: false, error: null }; // Default for initial load
    });

    renderIndexPage(undefined, courtsMock);

    const priceSelectTrigger = screen.getByText('Preço').closest('button');
    expect(priceSelectTrigger).toBeInTheDocument();
    await userEvent.click(priceSelectTrigger!);
    await userEvent.click(screen.getByRole('option', { name: /até r\$50/i }));

    await waitFor(() => {
      expect(courtsMock).toHaveBeenCalledWith(expect.objectContaining({ priceFilter: priceFilterValue }));
    });

    await waitFor(() => {
      expect(screen.getAllByTestId('court-card')).toHaveLength(expectedFilteredCourts.length);
      if (expectedFilteredCourts.length > 0) {
        expect(screen.getByText(expectedFilteredCourts[0].name)).toBeInTheDocument();
      }
    });
  });

  it('4. Capacity Filter: filters courts by capacity (5v5 - Max 10)', async () => {
    const capacityFilterValue = '10';
    const expectedFilteredCourts = allMockCourts.filter(c => c.max_players === 10);

    const courtsMock = vi.fn((filters) => {
      if (filters.capacityFilter === capacityFilterValue) {
        return { data: expectedFilteredCourts, isLoading: false, error: null };
      }
      return { data: allMockCourts, isLoading: false, error: null };
    });

    renderIndexPage(undefined, courtsMock);

    const capacitySelectTrigger = screen.getByText('Capacidade (Max.)').closest('button');
    expect(capacitySelectTrigger).toBeInTheDocument();
    await userEvent.click(capacitySelectTrigger!);
    await userEvent.click(screen.getByRole('option', { name: /5v5 \(até 10 jogadores\)/i }));

    await waitFor(() => {
      expect(courtsMock).toHaveBeenCalledWith(expect.objectContaining({ capacityFilter: capacityFilterValue }));
    });

    await waitFor(() => {
      expect(screen.getAllByTestId('court-card')).toHaveLength(expectedFilteredCourts.length);
      expectedFilteredCourts.forEach(court => {
        expect(screen.getByText(court.name)).toBeInTheDocument();
      });
    });
  });

  it('5. Combined Filters: search term, price, and capacity', async () => {
    const searchTerm = 'Quadra';
    const priceFilterValue = '0-50';
    const capacityFilterValue = '10';

    const expectedFilteredCourts = allMockCourts.filter(c =>
      (c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.location.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (c.price_per_hour >= 0 && c.price_per_hour <= 50) &&
      c.max_players === parseInt(capacityFilterValue)
    );

    const courtsMock = vi.fn((filters) => {
      if (
        filters.searchTerm === searchTerm &&
        filters.priceFilter === priceFilterValue &&
        filters.capacityFilter === capacityFilterValue
      ) {
        return { data: expectedFilteredCourts, isLoading: false, error: null };
      }
      // Handle intermediate states as filters are applied one by one
      if (filters.searchTerm === searchTerm && filters.priceFilter === '' && filters.capacityFilter === '') {
        return { data: allMockCourts.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.location.toLowerCase().includes(searchTerm.toLowerCase())), isLoading: false, error: null };
      }
      if (filters.searchTerm === searchTerm && filters.priceFilter === priceFilterValue && filters.capacityFilter === '') {
         return { data: allMockCourts.filter(c => (c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.location.toLowerCase().includes(searchTerm.toLowerCase())) && (c.price_per_hour >= 0 && c.price_per_hour <= 50)), isLoading: false, error: null };
      }
      return { data: allMockCourts, isLoading: false, error: null }; // Initial or other states
    });

    renderIndexPage(undefined, courtsMock);

    const searchInput = screen.getByPlaceholderText(/buscar por nome ou local.../i);
    await userEvent.type(searchInput, searchTerm);

    const priceSelectTrigger = screen.getByText('Preço').closest('button');
    await userEvent.click(priceSelectTrigger!);
    await userEvent.click(screen.getByRole('option', { name: /até r\$50/i }));

    const capacitySelectTrigger = screen.getByText('Capacidade (Max.)').closest('button');
    await userEvent.click(capacitySelectTrigger!);
    await userEvent.click(screen.getByRole('option', { name: /5v5 \(até 10 jogadores\)/i }));

    await waitFor(() => {
      expect(courtsMock).toHaveBeenCalledWith({ searchTerm, priceFilter: priceFilterValue, capacityFilter: capacityFilterValue });
    });

    await waitFor(() => {
      if (expectedFilteredCourts.length > 0) {
        expect(screen.getAllByTestId('court-card')).toHaveLength(expectedFilteredCourts.length);
        expectedFilteredCourts.forEach(court => {
            expect(screen.getByText(court.name)).toBeInTheDocument();
        });
      } else {
        expect(screen.queryByTestId('court-card')).not.toBeInTheDocument();
        expect(screen.getByText(/nenhuma quadra encontrada/i)).toBeInTheDocument();
      }
    });
  });

  it('6. Clearing Filters: shows all courts after clearing a filter', async () => {
    const searchTerm = 'Central';
    const courtsMock = vi.fn((filters) => {
      if (filters.searchTerm === searchTerm) {
        return { data: [allMockCourts[0]], isLoading: false, error: null };
      }
      if (filters.searchTerm === '' && filters.priceFilter === 'all' && filters.capacityFilter === 'all') {
        return { data: allMockCourts, isLoading: false, error: null };
      }
      // Default for initial render with empty strings (which become 'all' in the component)
      if(filters.searchTerm === '' && filters.priceFilter === '' && filters.capacityFilter === '') {
         return { data: allMockCourts, isLoading: false, error: null };
      }
      return { data: [], isLoading: false, error: null }; // Fallback for other combinations
    });

    renderIndexPage(undefined, courtsMock);

    const searchInput = screen.getByPlaceholderText(/buscar por nome ou local.../i);
    await userEvent.type(searchInput, searchTerm);

    await waitFor(() => expect(courtsMock).toHaveBeenCalledWith(expect.objectContaining({ searchTerm })));
    await waitFor(() => expect(screen.getAllByTestId('court-card')).toHaveLength(1));

    await userEvent.clear(searchInput);
    // When search is cleared, price and capacity filters remain 'all' (default from SelectItem value)
    // or '' if they were never touched. The Index component initializes them to ''.
    // The useCourts hook default for filters is {}.
    // The state in Index.tsx for priceFilter and capacityFilter is `''` initially.
    // The Select components have "all" as the value for "Any Price"/"Any Capacity".
    // So, when searchTerm is cleared, the call to useCourts will be { searchTerm: '', priceFilter: 'all', capacityFilter: 'all' }
    // if the Selects were not touched, or if they were set to "all".
    // If they were never touched, Index.tsx uses `''` for priceFilter/capacityFilter.
    // Let's assume the initial call to useCourts in Index is `useCourts({ searchTerm, priceFilter, capacityFilter })`
    // where priceFilter and capacityFilter are `''`. The hook defaults these to 'all' effectively.
    // The test should reflect what the hook receives from Index.tsx's state
    await waitFor(() => expect(courtsMock).toHaveBeenCalledWith({ searchTerm: '', priceFilter: '', capacityFilter: '' }));

    await waitFor(() => {
        expect(screen.getAllByTestId('court-card')).toHaveLength(allMockCourts.length);
    });
  });
});
