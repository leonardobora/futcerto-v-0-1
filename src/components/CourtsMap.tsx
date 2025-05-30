import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin } from 'lucide-react';
import { createRoot } from 'react-dom/client';

interface CourtMapData { // Renamed from Court to avoid conflict if Court type is imported
  id: number;
  name: string;
  location: string;
  coordinates: [number, number];
}

interface CourtsMapProps {
  courts: CourtMapData[];
  onSelectCourt?: (court: CourtMapData) => void;
}

const CourtsMap = ({ courts, onSelectCourt }: CourtsMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]); // Keep track of markers

  useEffect(() => {
    if (!mapContainer.current) return;

    const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (!mapboxToken) {
      console.error("Mapbox Access Token is not set. Please check your .env file and ensure VITE_MAPBOX_ACCESS_TOKEN is defined.");
      // Optionally, display an error message in the UI here
      return;
    }
    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-49.2733, -25.4284], // Curitiba coordinates
      zoom: 11.5 // Adjusted zoom
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Clean up old markers before adding new ones
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    courts.forEach((court) => {
      if (!court.coordinates || court.coordinates.length !== 2 || typeof court.coordinates[0] !== 'number' || typeof court.coordinates[1] !== 'number') {
        console.warn(`Invalid coordinates for court: ${court.name}`, court.coordinates);
        return; // Skip this court if coordinates are invalid
      }

      const markerElement = document.createElement('div');
      markerElement.className = 'court-marker'; // For potential custom styling
      
      const root = createRoot(markerElement);
      root.render(
        <div className="bg-primary p-2 rounded-full cursor-pointer hover:bg-primary/80 transition-colors">
          <MapPin size={24} color="white" />
        </div>
      );

      const newMarker = new mapboxgl.Marker(markerElement)
        .setLngLat(court.coordinates)
        .setPopup(
          new mapboxgl.Popup({ offset: 35 }) // Increased offset
            .setHTML(`
              <div style="font-family: sans-serif; font-size: 14px;">
                <strong>${court.name}</strong>
                <p style="margin: 2px 0;">${court.location}</p>
              </div>
            `)
        )
        .addTo(map.current!);

      markers.current.push(newMarker); // Add to tracked markers

      // Add click handler to the marker element itself
      markerElement.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent map click event if marker is clicked
        onSelectCourt?.(court);
        // Optional: Fly to marker and open popup
        map.current?.flyTo({ center: court.coordinates, zoom: 14 });
        // newMarker.togglePopup(); // This might be redundant if popup opens on hover/marker creation
      });
    });

    return () => {
      map.current?.remove();
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
    };
  }, [courts, onSelectCourt]); // Rerun effect if courts or onSelectCourt changes

  return (
    <div className="relative w-full h-[400px] md:h-[500px] rounded-lg overflow-hidden shadow-md">
      <div ref={mapContainer} className="absolute inset-0" />
      {!import.meta.env.VITE_MAPBOX_ACCESS_TOKEN && (
        <div className="absolute inset-0 bg-gray-200/80 flex items-center justify-center p-4">
          <p className="text-red-600 text-center font-semibold">
            Mapbox Access Token is not configured. Please set VITE_MAPBOX_ACCESS_TOKEN in your .env file.
          </p>
        </div>
      )}
    </div>
  );
};

export default CourtsMap;
