
import { useState } from "react";
import { CourtCard } from "@/components/CourtCard";
import { BookingModal } from "@/components/BookingModal";
import { AuthModal } from "@/components/AuthModal";
import CourtsMap from "@/components/CourtsMap";
import { Button } from "@/components/ui/button";
import { UserPlus, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCourts } from "@/hooks/useCourts";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [selectedCourt, setSelectedCourt] = useState<{ id: number; name: string } | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const { data: courts = [], isLoading: courtsLoading, error: courtsError } = useCourts();
  const { toast } = useToast();

  const handleBooking = (courtId: number, courtName: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    
    setSelectedCourt({ id: courtId, name: courtName });
    setIsBookingModalOpen(true);
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

  // Convert courts data for map component
  const mapCourts = courts.map(court => ({
    id: court.id,
    name: court.name,
    location: court.location,
    coordinates: [court.longitude, court.latitude] as [number, number],
  }));

  if (authLoading) {
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary py-6">
        <div className="container flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Futcerto</h1>
            <p className="text-primary-foreground/80 mt-2">
              Encontre e reserve as melhores quadras de Curitiba
            </p>
          </div>
          <div className="flex items-center gap-4">
            {user && profile ? (
              <>
                <span className="text-white text-sm">
                  Olá, {profile.name}!
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
                Entrar
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        {courtsError ? (
          <div className="text-center py-8">
            <p className="text-red-600">Erro ao carregar quadras: {courtsError.message}</p>
          </div>
        ) : courtsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando quadras...</p>
          </div>
        ) : (
          <>
            <CourtsMap 
              courts={mapCourts}
              onSelectCourt={(court) => handleBooking(court.id, court.name)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courts.map((court) => (
                <CourtCard
                  key={court.id}
                  name={court.name}
                  location={court.location}
                  price={`R$ ${court.price_per_hour}`}
                  maxPlayers={court.max_players}
                  imageUrl={court.image_url}
                  onBook={() => handleBooking(court.id, court.name)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {selectedCourt && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          courtId={selectedCourt.id}
          courtName={selectedCourt.name}
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
