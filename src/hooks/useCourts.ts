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

export const useCourts = () => {
  return useQuery<Court[], Error>({ // Specify Error type for useQuery
    queryKey: ['courts'],
    queryFn: async (): Promise<Court[]> => {
      const { data, error } = await supabase
        .from('courts')
        .select('*')
        .order('name');

      if (error) {
        console.error("Error fetching courts:", error);
        throw new Error(error.message || 'Erro ao buscar quadras');
      }

      return data || [];
    },
  });
};
