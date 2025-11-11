'use client';

import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';

// Fix for default marker icon in Next.js
const icon = L.icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

type Position = {
  latitude: number;
  longitude: number;
};

export default function DynamicMap() {
  const t = useTranslations('PhotoLocationView');
  const [position, setPosition] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setError(null);
      },
      (err) => {
        setError(err.message);
      },
      { enableHighAccuracy: true }
    );
  }, []);

  const MapPlaceholder = () => (
    <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {t('loading_location')}
    </div>
  );

  if (!isClient) {
    return <MapPlaceholder />;
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center text-sm text-destructive">
        {t('location_error')}
      </div>
    );
  }

  if (!position) {
     return <MapPlaceholder />;
  }
  
  return (
    <MapContainer 
        center={[position.latitude, position.longitude]} 
        zoom={14} 
        style={{ height: '100%', width: '100%' }} 
        scrollWheelZoom={false}
        placeholder={<MapPlaceholder />}
    >
        <a href={`https://www.google.com/maps/search/?api=1&query=${position?.latitude},${position?.longitude}`} target="_blank" rel="noopener noreferrer" className="h-full w-full block">
            <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[position.latitude, position.longitude]} icon={icon}>
              <Popup>{t('popup_text')}</Popup>
            </Marker>
        </a>
    </MapContainer>
  );
}
