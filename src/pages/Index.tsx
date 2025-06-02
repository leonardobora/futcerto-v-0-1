import { useState } from "react";
import { CourtCard } from "@/components/CourtCard";
import { BookingModal } from "@/components/BookingModal";
import { AuthModal } from "@/components/AuthModal";
import CourtsMap from "@/components/CourtsMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Added
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Added
import { UserPlus, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCourts } from "@/hooks/useCourts"; // Will be updated to accept filters
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton"; // Added for consistency
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Added for consistency
import { Link } from "react-router-dom"; // Added for profile link (though not strictly part of this task, good to have)

const Index = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('');

  // Update useCourts to pass filters once the hook is modified
  const { data: courts = [], isLoading: courtsLoading, error: courtsError } = useCourts({ searchTerm, priceFilter, capacityFilter });

  const { user, profile, signOut, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [selectedCourt, setSelectedCourt] = useState<{ id: number; name: string; price: number } | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  // Assuming RegisterModal might be added back or handled differently, keeping state for now
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);


  const handleBookClick = (court: { id: number; name: string; price: number }) => {
    if (!user) {
      setIsAuthModalOpen(true);
    } else {
      setSelectedCourt(court);
      setIsBookingModalOpen(true);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Até a próxima!",
      });
    } catch (error) {
      toast({
        title: "Erro ao sair",
        description: "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const mapCourts = courts.map(court => ({
    id: court.id,
    name: court.name,
    location: court.location,
    coordinates: [court.longitude, court.latitude] as [number, number],
  }));

  if (authLoading) { // Main loading state for auth
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-primary py-6 shadow-md">
        <div className="container mx-auto flex justify-between items-center px-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Futcerto</h1>
            <p className="text-primary-foreground/80 mt-1">
              Encontre e reserve as melhores quadras de Curitiba
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user && profile ? (
              <>
                <Link to="/profile" className="text-sm text-white hover:underline">
                  Olá, {profile.name}!
                </Link>
                <Button 
                  onClick={handleSignOut}
                  variant="secondary"
                  size="sm"
                  className="gap-1.5"
                >
                  <LogOut size={18} />
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => setIsAuthModalOpen(true)}
                  variant="secondary"
                  size="sm"
                  className="gap-1.5"
                >
                  <UserPlus size={18} />
                  Entrar / Cadastrar
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Filters Section */}
      <div className="bg-gray-100 py-4 shadow">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row flex-wrap gap-4 items-center">
          <Input
            placeholder="Buscar por nome ou local..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-full sm:max-w-xs md:max-w-sm lg:max-w-md flex-grow"
          />
          <Select value={priceFilter} onValueChange={setPriceFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Preço" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Qualquer Preço</SelectItem>
              <SelectItem value="0-50">Até R$50</SelectItem>
              <SelectItem value="51-100">R$51 - R$100</SelectItem>
              <SelectItem value="101-Infinity">Acima de R$100</SelectItem>
            </SelectContent>
          </Select>
          <Select value={capacityFilter} onValueChange={setCapacityFilter}>
            <SelectTrigger className="w-full sm:w-[240px]">
              <SelectValue placeholder="Capacidade (Max.)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Qualquer Capacidade</SelectItem>
              <SelectItem value="10">5v5 (Até 10 jogadores)</SelectItem>
              <SelectItem value="14">7v7 (Até 14 jogadores)</SelectItem>
              <SelectItem value="22">Futebol Society (Até 22)</SelectItem>
              {/* Consider making this dynamic or more comprehensive */}
            </SelectContent>
          </Select>
        </div>
      </div>


      <main className="flex-grow container mx-auto p-4 space-y-8">
        {courtsError ? (
          <Alert variant="destructive" className="max-w-xl mx-auto">
            <AlertTitle>Erro ao Carregar Quadras</AlertTitle>
            <AlertDescription>
              Não foi possível buscar as quadras. Tente novamente mais tarde. (Detalhe: {courtsError.message})
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="h-[400px] md:h-[500px] rounded-lg overflow-hidden shadow-lg">
              {courtsLoading && !courtsError ? (
                 <Skeleton className="h-full w-full" />
              ) : (
                <CourtsMap
                  courts={mapCourts}
                  onSelectCourt={(court) => handleBookClick({id: court.id, name: court.name, price: courts.find(c=>c.id === court.id)?.price_per_hour || 0})}
                />
              )}
            </div>

            {courtsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="flex flex-col">
                    <Skeleton className="h-[200px] w-full rounded-t-lg" />
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                    <CardFooter>
                      <Skeleton className="h-10 w-full" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : courts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {courts.map((court) => (
                  <CourtCard
                    key={court.id}
                    name={court.name}
                    location={court.location}
                    price={`R$ ${court.price_per_hour.toFixed(2)}`}
                    maxPlayers={court.max_players}
                    imageUrl={court.image_url}
                    onBook={() => handleBookClick({id: court.id, name: court.name, price: court.price_per_hour})}
                  />
                ))}
              </div>
            ) : (
              <Alert className="max-w-xl mx-auto">
                <AlertTitle>Nenhuma Quadra Encontrada</AlertTitle>
                <AlertDescription>
                  Não há quadras disponíveis que correspondam aos seus filtros atuais. Tente ajustar sua busca.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </main>

      <footer className="p-4 border-t bg-gray-100 text-center text-sm text-muted-foreground mt-auto">
        © {new Date().getFullYear()} Futcerto. Todos os direitos reservados.
      </footer>

      {selectedCourt && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          courtId={selectedCourt.id}
          courtName={selectedCourt.name}
          courtPrice={selectedCourt.price}
        />
      )}
      
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onRegisterClick={() => {
          setIsAuthModalOpen(false);
          // setIsRegisterModalOpen(true); // Assuming RegisterModal is separate or part of AuthModal logic
        }}
      />
      {/* If RegisterModal is a separate component:
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onLoginClick={() => {
          setIsRegisterModalOpen(false);
          setIsAuthModalOpen(true);
        }}
      />
      */}
    </div>
  );
};

export default Index;
