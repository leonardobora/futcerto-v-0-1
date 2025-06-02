import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Building, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Zod Schema for form validation
const courtFormSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres." }),
  location: z.string().min(5, { message: "Localização deve ter pelo menos 5 caracteres." }),
  price_per_hour: z.coerce.number().positive({ message: "Preço deve ser um número positivo." }),
  max_players: z.coerce.number().int().positive({ message: "Capacidade deve ser um inteiro positivo." }),
  image_url: z.string().url({ message: "URL da imagem inválida." }).or(z.literal('')),
});

type CourtFormData = z.infer<typeof courtFormSchema>;

interface CourtData extends CourtFormData {
  id: number;
  manager_id: string;
}

const EditCourtPage: React.FC = () => {
  const { courtId } = useParams<{ courtId: string }>();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchCourtDetails = async (): Promise<CourtData | null> => {
    if (!user?.id || !courtId || profile?.user_type !== 'manager') return null;
    
    const { data, error: queryError } = await supabase
      .from('courts')
      .select('*')
      .eq('id', courtId)
      .single();

    if (queryError) {
      if (queryError.code === 'PGRST116') { // PostgREST error for "Not found"
        throw new Error('Quadra não encontrada.');
      }
      throw new Error(queryError.message);
    }
    if (data && data.manager_id !== user.id) {
      throw new Error('Acesso Negado: Você não gerencia esta quadra.');
    }
    return data as CourtData;
  };

  const { 
    data: court, 
    isLoading: isLoadingCourt, 
    error: courtError,
    isError: isCourtError, // To distinguish between error object and actual error state
  } = useQuery<CourtData | null, Error>({
    queryKey: ['court', courtId, user?.id],
    queryFn: fetchCourtDetails,
    enabled: !!user && !!courtId && profile?.user_type === 'manager' && !authLoading,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CourtFormData>({
    resolver: zodResolver(courtFormSchema),
  });

  // Update mutation
  const mutation = useMutation({
    mutationFn: async (formData: CourtFormData) => {
      if (!courtId) throw new Error("Court ID is missing.");
      const { data, error } = await supabase
        .from('courts')
        .update({
          name: formData.name,
          location: formData.location,
          price_per_hour: formData.price_per_hour, // Zod schema coerces this
          max_players: formData.max_players,       // Zod schema coerces this
          image_url: formData.image_url || null,   // Set to null if empty string
        })
        .eq('id', courtId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Sucesso!",
        description: `Quadra "${data?.name}" atualizada com sucesso.`,
      });
      queryClient.invalidateQueries({ queryKey: ['court', courtId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['managerCourts', user?.id] });
      navigate('/manager/dashboard');
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar quadra",
        description: error.message || "Não foi possível atualizar os dados da quadra. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (court) {
      reset({
        name: court.name,
        location: court.location,
        price_per_hour: court.price_per_hour,
        max_players: court.max_players,
        image_url: court.image_url || '',
      });
    }
  }, [court, reset]);

  const onSubmit: SubmitHandler<CourtFormData> = async (formData) => {
    mutation.mutate(formData);
  };

  if (authLoading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Skeleton className="h-64 w-full max-w-lg" />
      </div>
    );
  }

  if (!user || profile?.user_type !== 'manager') {
    return (
      <div className="container mx-auto p-4 mt-10">
        <Alert variant="destructive" className="max-w-lg mx-auto">
          <Building className="h-4 w-4" />
          <AlertTitle>Acesso Negado</AlertTitle>
          <AlertDescription>
            Você não tem permissão para visualizar esta página. Esta área é reservada para gestores de quadras.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // This handles errors from fetchCourtDetails, including the authorization check
  if (isCourtError && courtError) {
     return (
      <div className="container mx-auto p-4 mt-10">
        <Alert variant="destructive" className="max-w-lg mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao Carregar Quadra</AlertTitle>
          <AlertDescription>
            {courtError.message || "Não foi possível buscar os dados da quadra."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoadingCourt) {
     return (
      <div className="container mx-auto p-4">
        <Card className="max-w-lg mx-auto">
          <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
            <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-20 w-full" /></div>
            <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
            <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
            <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
            <Skeleton className="h-10 w-full mt-4" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!court && !isLoadingCourt) { // Court not found but no specific error thrown by query, or initial state
    return (
      <div className="container mx-auto p-4 mt-10">
        <Alert variant="destructive" className="max-w-lg mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Quadra não encontrada</AlertTitle>
          <AlertDescription>
            Não foi possível encontrar os dados da quadra. Verifique o ID ou se você tem permissão.
          </AlertDescription>
        </Alert>
      </div>
    );
  }


  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Editar Quadra: {court?.name}</CardTitle>
          <CardDescription>Atualize as informações da sua quadra.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="name">Nome da Quadra</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="location">Localização</Label>
              <Textarea id="location" {...register("location")} />
              {errors.location && <p className="text-sm text-destructive mt-1">{errors.location.message}</p>}
            </div>
            <div>
              <Label htmlFor="price_per_hour">Preço por Hora (R$)</Label>
              <Input id="price_per_hour" type="number" step="0.01" {...register("price_per_hour")} />
              {errors.price_per_hour && <p className="text-sm text-destructive mt-1">{errors.price_per_hour.message}</p>}
            </div>
            <div>
              <Label htmlFor="max_players">Capacidade Máxima de Jogadores</Label>
              <Input id="max_players" type="number" {...register("max_players")} />
              {errors.max_players && <p className="text-sm text-destructive mt-1">{errors.max_players.message}</p>}
            </div>
            <div>
              <Label htmlFor="image_url">URL da Imagem</Label>
              <Input id="image_url" {...register("image_url")} />
              {errors.image_url && <p className="text-sm text-destructive mt-1">{errors.image_url.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditCourtPage;
