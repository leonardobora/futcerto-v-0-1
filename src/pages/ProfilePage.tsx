import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge'; // Added for booking status
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'; // Added for bookings table

const ProfilePage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  const fetchProfile = async () => {
    if (!user?.id) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('name, email, phone, user_type')
      .eq('id', user.id)
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return data;
  };

  const { data: profile, error: profileError, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: fetchProfile,
    enabled: !!user?.id && !authLoading,
  });

  const fetchBookings = async () => {
    if (!user?.id) return null;
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        start_time,
        end_time,
        status,
        courts (name)
      `)
      .eq('player_id', user.id)
      .order('booking_date', { ascending: false })
      .order('start_time', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }
    // Process courts to be a simple name string
    return data?.map(b => ({...b, court_name: (b.courts as any)?.name || 'Quadra desconhecida'})) || null;
  };

  const { data: bookings, error: bookingsError, isLoading: isLoadingBookings } = useQuery({
    queryKey: ['bookings', user?.id],
    queryFn: fetchBookings,
    enabled: !!user?.id && !authLoading,
  });

  if (authLoading || (isLoadingProfile && user)) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Meu Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Minhas Reservas</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertTitle>Acesso Negado</AlertTitle>
          <AlertDescription>
            Por favor, faça login para visualizar seu perfil e reservas.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertTitle>Erro ao carregar perfil</AlertTitle>
          <AlertDescription>
            {(profileError as Error).message || 'Não foi possível buscar os dados do perfil.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const userTypeMap: { [key: string]: string } = {
    player: 'Jogador',
    manager: 'Gestor de Quadra',
  };

  const bookingStatusMap: { [key: string]: { text: string; variant: "default" | "destructive" | "outline" | "secondary" | "ghost" | null | undefined } } = {
    confirmed: { text: 'Confirmada', variant: 'default' },
    pending: { text: 'Pendente', variant: 'secondary' },
    cancelled: { text: 'Cancelada', variant: 'destructive' },
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {profile && (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Meu Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Nome:</strong> {profile.name}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Telefone:</strong> {profile.phone || 'Não informado'}</p>
            <p><strong>Tipo de Usuário:</strong> {userTypeMap[profile.user_type] || profile.user_type}</p>
          </CardContent>
        </Card>
      )}
      {!profile && !isLoadingProfile && !profileError && (
         <Alert className="max-w-md mx-auto">
            <AlertTitle>Perfil não encontrado</AlertTitle>
            <AlertDescription>
              Não foi possível encontrar dados do seu perfil.
            </AlertDescription>
          </Alert>
      )}

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Minhas Reservas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingBookings && (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}
          {bookingsError && (
            <Alert variant="destructive">
              <AlertTitle>Erro ao carregar reservas</AlertTitle>
              <AlertDescription>
                {(bookingsError as Error).message || 'Não foi possível buscar suas reservas.'}
              </AlertDescription>
            </Alert>
          )}
          {!isLoadingBookings && !bookingsError && bookings && bookings.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quadra</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking: any) => (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.court_name}</TableCell>
                    <TableCell>{new Date(booking.booking_date + 'T00:00:00').toLocaleDateString()}</TableCell>
                    <TableCell>{booking.start_time} - {booking.end_time}</TableCell>
                    <TableCell>
                      <Badge variant={bookingStatusMap[booking.status]?.variant || 'outline'}>
                        {bookingStatusMap[booking.status]?.text || booking.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!isLoadingBookings && !bookingsError && (!bookings || bookings.length === 0) && (
            <p className="text-center text-muted-foreground">Você ainda não possui reservas.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
