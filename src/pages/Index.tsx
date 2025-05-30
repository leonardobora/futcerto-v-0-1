import { useState, useEffect } from "react"; // Added useEffect
import { CourtCard } from "@/components/CourtCard";
import { BookingModal } from "@/components/BookingModal";
import { AuthModal } from "@/components/AuthModal";
import CourtsMap from "@/components/CourtsMap";
import { Button } from "@/components/ui/button";
import { UserPlus, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCourts, Court as CourtType } from "@/hooks/useCourts"; // Import Court type
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [selectedCourt, setSelectedCourt] = useState<{ id: number; name: string; /* price_per_hour: number; */ } | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const { data: courts = [], isLoading: courtsLoading, error: courtsError, refetch: refetchCourts } = useCourts();
  const { toast } = useToast();

  // Refetch courts when auth state changes (e.g. user logs in/out, if RLS depends on it)
  // Or if you want to ensure fresh data after certain operations.
  useEffect(() => {
    refetchCourts();
  }, [user, refetchCourts]);


  const handleBooking = (court: CourtType) => { // Pass the whole court object
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setSelectedCourt({ id: court.id, name: court.name, /* price_per_hour: court.price_per_hour */ });
    setIsBookingModalOpen(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Até a próxima!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao sair",
        description: error?.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const mapCourts = courts.map(court => ({
    id: court.id,
    name: court.name,
    location: court.location,
    // Ensure coordinates are [longitude, latitude] for Mapbox
    coordinates: [court.longitude, court.latitude] as [number, number],
  }));

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary py-6 sticky top-0 z-50 shadow-md">
        <div className="container flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">FutCerto</h1>
            <p className="text-primary-foreground/80 mt-1 text-sm">
              Encontre e reserve as melhores quadras de Curitiba
            </p>
          </div>
          <div className="flex items-center gap-4">
            {user && profile ? (
              <>
                <span className="text-white text-sm">
                  Olá, {profile.name}! ({profile.user_type})
                </span>
                <Button
                  onClick={handleSignOut}
                  variant="secondary"
                  className="gap-2"
                >
                  <LogOut size={20} />
                  Sair
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsAuthModalOpen(true)}
                variant="secondary"
                className="gap-2"
              >
                <UserPlus size={20} />
                Entrar / Cadastrar
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        {courtsError ? (
          <div className="text-center py-8 bg-red-50 p-4 rounded-md">
            <p className="text-red-700 font-semibold">Erro ao carregar quadras:</p>
            <p className="text-red-600">{courtsError.message}</p>
            <Button onClick={() => refetchCourts()} className="mt-4">Tentar Novamente</Button>
          </div>
        ) : courtsLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Carregando quadras...</p>
          </div>
        ) : courts.length === 0 ? (
           <div className="text-center py-16">
            <p className="text-gray-600 text-lg">Nenhuma quadra encontrada.</p>
            {/* Optionally, if a manager, link to add court */}
          </div>
        ) : (
          <>
            <CourtsMap
              courts={mapCourts}
              onSelectCourt={(courtMapData) => {
                  const fullCourtData = courts.find(c => c.id === courtMapData.id);
                  if (fullCourtData) {
                    handleBooking(fullCourtData);
                  }
              }}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courts.map((court) => (
                <CourtCard
                  key={court.id}
                  name={court.name}
                  location={court.location}
                  price={`R$ ${court.price_per_hour.toFixed(2)}`} // Ensure price is formatted
                  maxPlayers={court.max_players}
                  imageUrl={court.image_url || '/placeholder.svg'} // Fallback image
                  onBook={() => handleBooking(court)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {selectedCourt && isBookingModalOpen && ( // Ensure modal only renders if selectedCourt is not null
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => {
            setIsBookingModalOpen(false);
            setSelectedCourt(null); // Clear selected court on close
          }}
          courtId={selectedCourt.id}
          courtName={selectedCourt.name}
          // courtPricePerHour={selectedCourt.price_per_hour} // Pass price if needed
        />
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export default Index;
