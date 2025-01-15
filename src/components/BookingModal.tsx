import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  courtName: string;
}

export const BookingModal = ({ isOpen, onClose, courtName }: BookingModalProps) => {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const { toast } = useToast();

  const handleBooking = () => {
    if (!date || !time) {
      toast({
        title: "Erro na reserva",
        description: "Por favor selecione data e horário",
        variant: "destructive",
      });
      return;
    }

    // Aqui seria integrada a lógica de reserva
    const bookingLink = `https://futcerto.app/convite/${Date.now()}`;
    
    toast({
      title: "Reserva confirmada!",
      description: "Link de convite copiado para a área de transferência",
    });
    
    navigator.clipboard.writeText(bookingLink);
    onClose();
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
          
          <Select onValueChange={setTime}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o horário" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 8).map((hour) => (
                <SelectItem key={hour} value={`${hour}:00`}>
                  {`${hour}:00`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleBooking}>Confirmar Reserva</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};