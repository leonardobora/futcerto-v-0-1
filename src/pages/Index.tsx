import { useState } from "react";
import { CourtCard } from "@/components/CourtCard";
import { BookingModal } from "@/components/BookingModal";
import { RegisterModal } from "@/components/RegisterModal";
import CourtsMap from "@/components/CourtsMap";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

// Dados mockados para exemplo
const COURTS = [
  {
    id: 1,
    name: "Arena Soccer Pro",
    location: "Rua das Palmeiras, 123",
    price: "R$ 120",
    maxPlayers: 12,
    coordinates: [-46.6388, -23.5489],
    imageUrl: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 2,
    name: "Futsal Center",
    location: "Av. Principal, 456",
    price: "R$ 100",
    maxPlayers: 10,
    coordinates: [-46.6488, -23.5589],
    imageUrl: "https://images.unsplash.com/photo-1624880357913-a8539238245b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 3,
    name: "Gol & Cia",
    location: "Rua do Esporte, 789",
    price: "R$ 150",
    maxPlayers: 14,
    coordinates: [-46.6288, -23.5389],
    imageUrl: "https://images.unsplash.com/photo-1524015368236-cf67f6b6f1f1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&q=80"
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
              Encontre e reserve as melhores quadras para seu futebol
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