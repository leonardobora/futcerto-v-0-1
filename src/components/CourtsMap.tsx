import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin } from 'lucide-react';

interface Court {
  id: number;
  name: string;
  location: string;
  coordinates: [number, number];
}

interface CourtsMapProps {
  courts: Court[];
  onSelectCourt?: (court: Court) => void;
}

const CourtsMap = ({ courts, onSelectCourt }: CourtsMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Inicializa o mapa
    mapboxgl.accessToken = 'SEU_TOKEN_MAPBOX';
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-46.6388, -23.5489], // São Paulo
      zoom: 11
    });

    // Adiciona controles de navegação
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Adiciona marcadores para cada quadra
    courts.forEach((court) => {
      const marker = document.createElement('div');
      marker.className = 'court-marker';
      marker.innerHTML = `<div class="bg-primary p-2 rounded-full cursor-pointer hover:bg-primary/80 transition-colors">
        ${MapPin({ size: 24, color: 'white' }).outerHTML}
      </div>`;

      new mapboxgl.Marker(marker)
        .setLngLat(court.coordinates)
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <strong>${court.name}</strong>
              <p>${court.location}</p>
            `)
        )
        .addTo(map.current!);

      marker.addEventListener('click', () => {
        onSelectCourt?.(court);
      });
    });

    return () => {
      map.current?.remove();
    };
  }, [courts, onSelectCourt]);

  return (
    <div className="relative w-full h-[400px] rounded-lg overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};

export default CourtsMap;