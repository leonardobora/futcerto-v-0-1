
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
}

export const BookingModal = ({ isOpen, onClose, courtId, courtName }: BookingModalProps) => {
  const [date, setDate] = useState<Date>();
  const [startTime, setStartTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleBooking = async () => {
    if (!date || !startTime || !user) {
      toast({
        title: "Erro na reserva",
        description: "Por favor selecione data e horário",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Calculate end time (assuming 1 hour slots)
      const [hour] = startTime.split(':');
      const endTime = `${parseInt(hour) + 1}:00`;

      // Create booking
      const { data, error } = await supabase
        .from('bookings')
        .insert([
          {
            court_id: courtId,
            player_id: user.id,
            booking_date: date.toISOString().split('T')[0],
            start_time: startTime,
            end_time: endTime,
            status: 'confirmed'
          }
        ])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('Este horário já está reservado. Escolha outro horário.');
        }
        throw error;
      }

      // Create booking link for sharing
      const bookingLink = `${window.location.origin}/reserva/${data.id}`;
      
      toast({
        title: "Reserva confirmada!",
        description: "Link de convite copiado para a área de transferência",
      });
      
      navigator.clipboard.writeText(bookingLink);
      onClose();
    } catch (error: any) {
      toast({
        title: "Erro na reserva",
        description: error.message || "Ocorreu um erro ao criar a reserva",
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
            disabled={(date) => date < new Date()}
          />
          
          <Select onValueChange={setStartTime}>
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
          <Button onClick={handleBooking} disabled={isLoading}>
            {isLoading ? "Reservando..." : "Confirmar Reserva"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
