import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building, Edit } from 'lucide-react'; // Added Edit icon
import { Button } from '@/components/ui/button'; // Added Button
import { Link } from 'react-router-dom'; // Added Link

interface ManagerCourt {
  id: number;
  name: string;
  location: string;
  price_per_hour: number;
}

const ManagerDashboardPage: React.FC = () => {
  const { user, profile, loading: authLoading } = useAuth();

  const fetchManagerCourts = async () => {
    if (!user?.id || profile?.user_type !== 'manager') return null;
    const { data, error: queryError } = await supabase
      .from('courts')
      .select('id, name, location, price_per_hour')
      .eq('manager_id', user.id)
      .order('name');
    
    if (queryError) {
      throw new Error(queryError.message);
    }
    return data as ManagerCourt[];
  };

  const { 
    data: courts, 
    isLoading: isLoadingCourts, 
    error: courtsError 
  } = useQuery<ManagerCourt[] | null, Error>({
    queryKey: ['managerCourts', user?.id],
    queryFn: fetchManagerCourts,
    enabled: !!user && profile?.user_type === 'manager' && !authLoading,
  });

  if (authLoading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
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

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Minhas Quadras</CardTitle>
          <CardDescription>Gerencie as informações das suas quadras cadastradas.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingCourts && (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          )}
          {courtsError && (
            <Alert variant="destructive">
               <Building className="h-4 w-4" />
              <AlertTitle>Erro ao Carregar Quadras</AlertTitle>
              <AlertDescription>
                {courtsError.message || "Não foi possível buscar suas quadras. Tente novamente mais tarde."}
              </AlertDescription>
            </Alert>
          )}
          {!isLoadingCourts && !courtsError && courts && courts.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Preço/Hora</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courts.map((court) => (
                  <TableRow key={court.id}>
                    <TableCell className="font-medium">{court.name}</TableCell>
                    <TableCell>{court.location}</TableCell>
                    <TableCell>R$ {court.price_per_hour.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/manager/courts/${court.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!isLoadingCourts && !courtsError && (!courts || courts.length === 0) && (
            <div className="text-center py-8">
              <Building size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-muted-foreground">Você ainda não adicionou nenhuma quadra.</p>
              {/* TODO: Add a button/link to "Add New Court" page later */}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerDashboardPage;
