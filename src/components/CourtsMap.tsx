import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin } from 'lucide-react';
import { createRoot } from 'react-dom/client';

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
  const [mapboxToken, setMapboxToken] = useState<string>('');

  useEffect(() => {
    // Temporary input for Mapbox token
    const token = prompt('Por favor, insira seu token público do Mapbox para visualizar o mapa. Você pode obtê-lo em https://mapbox.com/');
    if (token) {
      setMapboxToken(token);
    }
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    // Initialize map
    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-46.6388, -23.5489], // São Paulo
      zoom: 11
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add markers for each court
    courts.forEach((court) => {
      // Create a DOM element for the marker
      const markerElement = document.createElement('div');
      markerElement.className = 'court-marker';
      
      // Create a React root and render the MapPin component
      const root = createRoot(markerElement);
      root.render(
        <div className="bg-primary p-2 rounded-full cursor-pointer hover:bg-primary/80 transition-colors">
          <MapPin size={24} color="white" />
        </div>
      );

      // Add marker to map
      new mapboxgl.Marker(markerElement)
        .setLngLat(court.coordinates)
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <strong>${court.name}</strong>
              <p>${court.location}</p>
            `)
        )
        .addTo(map.current);

      // Add click handler
      markerElement.addEventListener('click', () => {
        onSelectCourt?.(court);
      });
    });

    return () => {
      map.current?.remove();
    };
  }, [courts, onSelectCourt, mapboxToken]);

  return (
    <div className="relative w-full h-[400px] rounded-lg overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />
      {!mapboxToken && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <p className="text-gray-500">Insira um token do Mapbox para visualizar o mapa</p>
        </div>
      )}
    </div>
  );
};

export default CourtsMap;