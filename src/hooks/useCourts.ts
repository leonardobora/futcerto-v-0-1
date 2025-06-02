
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface Court {
  id: number;
  name: string;
  location: string;
  price_per_hour: number;
  max_players: number;
  latitude: number;
  longitude: number;
  image_url: string;
  manager_id?: string;
  created_at: string;
}

interface CourtFilters {
  searchTerm?: string;
  priceFilter?: string;
  capacityFilter?: string;
}

export const useCourts = (filters: CourtFilters = {}) => {
  return useQuery<Court[], Error>({ // Explicitly type useQuery for better type safety
    queryKey: ['courts', filters], // Include filters in queryKey
    queryFn: async (): Promise<Court[]> => {
      let query = supabase.from('courts').select('*');

      // Apply search term filter
      if (filters.searchTerm) {
        query = query.or(`name.ilike.%${filters.searchTerm}%,location.ilike.%${filters.searchTerm}%`);
      }

      // Apply price filter
      if (filters.priceFilter && filters.priceFilter !== 'all') {
        const [minPriceStr, maxPriceStr] = filters.priceFilter.split('-');
        const minPrice = parseInt(minPriceStr, 10);
        const maxPrice = maxPriceStr === 'Infinity' ? Infinity : parseInt(maxPriceStr, 10);

        if (!isNaN(minPrice)) {
          query = query.gte('price_per_hour', minPrice);
        }
        if (!isNaN(maxPrice) && maxPrice !== Infinity) {
          query = query.lte('price_per_hour', maxPrice);
        }
      }

      // Apply capacity filter
      if (filters.capacityFilter && filters.capacityFilter !== 'all') {
        const capacity = parseInt(filters.capacityFilter, 10);
        if (!isNaN(capacity)) {
          // Assuming max_players means the exact number of players for a type of game (e.g. 10 for 5v5)
          // If it means "up to X players", then query = query.lte('max_players', capacity);
          // If it means "at least X players are supported", then query = query.gte('max_players', capacity);
          // For now, using eq as per original instruction, but this might need adjustment based on desired logic.
          query = query.eq('max_players', capacity);
        }
      }
      
      query = query.order('name');

      const { data, error } = await query;

      if (error) {
        throw new Error(`Erro ao buscar quadras: ${error.message}`);
      }

      return data || [];
    },
  });
};
