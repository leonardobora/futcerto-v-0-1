import { Calendar, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface CourtCardProps {
  name: string;
  location: string;
  price: string;
  maxPlayers: number;
  imageUrl: string;
  onBook: () => void;
}

export const CourtCard = ({ name, location, price, maxPlayers, imageUrl, onBook }: CourtCardProps) => {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="p-0">
        <div className="h-48 overflow-hidden">
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="text-xl mb-2">{name}</CardTitle>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <MapPin size={16} />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={16} />
            <span>Até {maxPlayers} jogadores</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            <span>{price}/hora</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={onBook} className="w-full">
          Reservar Quadra
        </Button>
      </CardFooter>
    </Card>
  );
};