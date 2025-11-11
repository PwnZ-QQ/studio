'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Button } from './ui/button';
import { X, Loader2, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import Map, { Marker } from 'react-map-gl';

interface PhotoLocationViewProps {
  imageSrc: string;
  onBack: () => void;
}

type Position = {
  latitude: number;
  longitude: number;
};

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function PhotoLocationView({ imageSrc, onBack }: PhotoLocationViewProps) {
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

  const memoizedImage = useMemo(() => (
    <Image src={imageSrc} alt={t('title')} fill objectFit="cover" />
  ), [imageSrc, t]);

  const mapComponent = useMemo(() => {
    if (!isClient || !position) return null;
    return (
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          ...position,
          zoom: 14,
        }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
      >
        <Marker longitude={position.longitude} latitude={position.latitude} anchor="bottom" >
          <div className="w-8 h-8 flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
            <div className="absolute w-8 h-8 bg-blue-500/50 rounded-full animate-ping" />
          </div>
        </Marker>
      </Map>
    );
  }, [isClient, position]);

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
          {position ? (
            <a href={`https://www.google.com/maps/search/?api=1&query=${position?.latitude},${position?.longitude}`} target="_blank" rel="noopener noreferrer">
              {mapComponent}
            </a>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
              {error ? (
                <span className="text-destructive">{t('location_error')}</span>
              ) : (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('loading_location')}
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
