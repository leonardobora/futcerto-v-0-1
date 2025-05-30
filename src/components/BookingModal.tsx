import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  courtId: number;
  courtName: string;
  // Add courtPricePerHour for calculating total_price if needed by your schema
  // courtPricePerHour: number;
}

export const BookingModal = ({ isOpen, onClose, courtId, courtName }: BookingModalProps) => {
  const [date, setDate] = useState<Date>();
  const [startTime, setStartTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, profile } = useAuth(); // Use profile to ensure player_id is from profiles table

  const handleBooking = async () => {
    if (!date || !startTime) { // User check is implicitly handled by profile
      toast({
        title: "Erro na reserva",
        description: "Por favor selecione data e horário.",
        variant: "destructive",
      });
      return;
    }
    
    if (!profile || !user) { // Ensure profile and user are loaded
        toast({
            title: "Erro de autenticação",
            description: "Você precisa estar logado para fazer uma reserva.",
            variant: "destructive",
        });
        return;
    }


    setIsLoading(true);

    try {
      const [hourString] = startTime.split(':');
      const hour = parseInt(hourString, 10);
      const endTime = `${hour + 1}:00`; // Assuming 1-hour slots

      // Format date to YYYY-MM-DD for Supabase 'date' type
      const bookingDate = date.toISOString().split('T')[0];

      // Optional: Calculate total_price if your table requires it
      // const totalPrice = courtPricePerHour; // If price is per hour

      const { data, error } = await supabase
        .from('bookings')
        .insert([
          {
            court_id: courtId,
            player_id: profile.id, // Use profile.id as it's the FK to profiles table
            booking_date: bookingDate,
            start_time: startTime,
            end_time: endTime, // Ensure your table has end_time or calculate duration
            status: 'confirmed', // Default status
            // total_price: totalPrice, // Uncomment if you have this column
          }
        ])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('Este horário já está reservado. Escolha outro horário.');
        }
        console.error("Booking error:", error);
        throw new Error(error.message || "Ocorreu um erro ao criar a reserva.");
      }

      if (!data) {
        throw new Error("A reserva foi criada, mas não retornou dados.");
      }

      const bookingLink = `${window.location.origin}/reserva/${data.id}`; // Adjust if your link structure is different

      toast({
        title: "Reserva confirmada!",
        description: "Link de convite copiado para a área de transferência.",
      });

      if (navigator.clipboard) {
        navigator.clipboard.writeText(bookingLink).catch(err => {
          console.warn("Falha ao copiar link para a área de transferência:", err);
          toast({
            title: "Link da reserva",
            description: `Use este link para compartilhar: ${bookingLink}`,
            duration: 10000, // Keep toast longer if copy fails
          });
        });
      } else {
         toast({
            title: "Link da reserva",
            description: `Use este link para compartilhar: ${bookingLink}`,
            duration: 10000,
          });
      }
      onClose();
    } catch (error: any) {
      toast({
        title: "Erro na reserva",
        description: error.message || "Ocorreu um erro desconhecido.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reservar {courtName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
            disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))} // Disable past dates
          />

          <Select onValueChange={setStartTime} value={startTime}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o horário" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 8).map((hour) => (
                <SelectItem key={hour} value={`${hour}:00`}>
                  {`${hour}:00 - ${hour + 1}:00`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleBooking} disabled={isLoading || !date || !startTime || !user}>
            {isLoading ? "Reservando..." : "Confirmar Reserva"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
