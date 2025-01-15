import React, { useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map with Curitiba's coordinates
    mapboxgl.accessToken = 'pk.eyJ1IjoibGVvbmFyZG9ib3JhIiwiYSI6ImNtNXh2anR5NDA2bGQya29venNtdnRvMTkifQ.3lXFg1NQotmr9cTi5OhaOg';
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-49.2733, -25.4284], // Curitiba coordinates
      zoom: 12 // Increased zoom for better city view
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
  }, [courts, onSelectCourt]);

  return (
    <div className="relative w-full h-[400px] rounded-lg overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};

export default CourtsMap;