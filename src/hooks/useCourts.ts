
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
  return useQuery({
    queryKey: ['courts'],
    queryFn: async (): Promise<Court[]> => {
      const { data, error } = await supabase
        .from('courts')
        .select('*')
        .order('name');

      if (error) {
        throw new Error(`Erro ao buscar quadras: ${error.message}`);
      }

      return data || [];
    },
  });
};
