'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Button } from './ui/button';
import { X, Loader2, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default icon path issue with webpack
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

interface PhotoLocationViewProps {
  imageSrc: string;
  onBack: () => void;
}

type Position = {
  lat: number;
  lng: number;
};

export default function PhotoLocationView({ imageSrc, onBack }: PhotoLocationViewProps) {
  const t = useTranslations('PhotoLocationView');
  const [position, setPosition] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setError(null);
      },
      (err) => {
        setError(err.message);
      },
      { enableHighAccuracy: true }
    );
    
    // This is a hack to fix the default icon issue with Leaflet in Next.js
    const DefaultIcon = L.icon({
        iconRetinaUrl: iconRetinaUrl.src,
        iconUrl: iconUrl.src,
        shadowUrl: shadowUrl.src,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        tooltipAnchor: [16, -28],
        shadowSize: [41, 41],
    });
    L.Marker.prototype.options.icon = DefaultIcon;

  }, []);

  const memoizedImage = useMemo(() => (
    <Image src={imageSrc} alt={t('title')} fill objectFit="cover" />
  ), [imageSrc, t]);

  return (
    <motion.div
      className="absolute inset-0 bg-black/60 backdrop-blur-md z-10 flex flex-col items-center justify-end p-4 gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Button variant="ghost" size="icon" className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/30 text-white" onClick={onBack}>
        <X className="h-5 w-5" />
      </Button>
      
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-sm"
      >
        <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border-2 border-white/50 shadow-2xl">
          {memoizedImage}
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-sm bg-background/80 backdrop-blur-lg p-4 rounded-xl border border-white/10"
      >
        <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
            <MapPin className="h-5 w-5 text-accent"/>
            {t('location_title')}
        </h3>
        <div className="h-48 w-full rounded-md overflow-hidden bg-muted">
            {position && (
                <MapContainer center={position} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={position}>
                        <Popup>
                           {t('popup_text')}
                        </Popup>
                    </Marker>
                </MapContainer>
            )}
            {error && <div className="h-full w-full flex items-center justify-center text-sm text-destructive">{t('location_error')}</div>}
            {!position && !error && (
                <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('loading_location')}
                </div>
            )}
        </div>
      </motion.div>
    </motion.div>
  );
}
