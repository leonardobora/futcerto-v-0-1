import { useState } from "react";
import { CourtCard } from "@/components/CourtCard";
import { BookingModal } from "@/components/BookingModal";
import { RegisterModal } from "@/components/RegisterModal";
import CourtsMap from "@/components/CourtsMap";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

// Dados mockados de quadras em Curitiba
const COURTS = [
  {
    id: 1,
    name: "Arena Soccer Barigui",
    location: "R. Padre Agostinho, 2485 - Bigorrilho",
    price: "R$ 200",
    maxPlayers: 14,
    coordinates: [-49.2933, -25.4284] as [number, number],
    imageUrl: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 2,
    name: "Soccer Hall",
    location: "R. Brasílio Itiberê, 3279 - Água Verde",
    price: "R$ 180",
    maxPlayers: 14,
    coordinates: [-49.2833, -25.4484] as [number, number],
    imageUrl: "https://images.unsplash.com/photo-1624880357913-a8539238245b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 3,
    name: "CT Bacacheri",
    location: "R. Costa Rica, 313 - Bacacheri",
    price: "R$ 160",
    maxPlayers: 14,
    coordinates: [-49.2433, -25.3984] as [number, number],
    imageUrl: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&q=80"
  },
];

const Index = () => {
  const [selectedCourt, setSelectedCourt] = useState<string | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const handleBooking = (courtName: string) => {
    setSelectedCourt(courtName);
    setIsBookingModalOpen(true);
  };

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
          <Button 
            onClick={() => setIsRegisterModalOpen(true)}
            variant="secondary"
            className="gap-2"
          >
            <UserPlus size={20} />
            Cadastrar
          </Button>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        <CourtsMap 
          courts={COURTS}
          onSelectCourt={(court) => handleBooking(court.name)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {COURTS.map((court) => (
            <CourtCard
              key={court.id}
              {...court}
              onBook={() => handleBooking(court.name)}
            />
          ))}
        </div>
      </main>

      {selectedCourt && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          courtName={selectedCourt}
        />
      )}
      
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />
    </div>
  );
};

export default Index;