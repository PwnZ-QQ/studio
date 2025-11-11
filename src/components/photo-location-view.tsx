'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { Button } from './ui/button';
import { X, Loader2, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

interface PhotoLocationViewProps {
  imageSrc: string;
  onBack: () => void;
}

export default function PhotoLocationView({ imageSrc, onBack }: PhotoLocationViewProps) {
  const t = useTranslations('PhotoLocationView');

  const memoizedImage = useMemo(() => (
    <Image src={imageSrc} alt={t('title')} fill objectFit="cover" />
  ), [imageSrc, t]);

  const DynamicMap = useMemo(() => dynamic(() => import('./dynamic-map'), {
    loading: () => (
      <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {t('loading_location')}
      </div>
    ),
    ssr: false
  }), [t]);

  return (
    <motion.div
      className="absolute inset-0 bg-black/60 backdrop-blur-md z-10 flex flex-col items-center justify-center p-4 gap-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      <Button variant="ghost" size="icon" className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/30 text-white hover:bg-black/50" onClick={onBack}>
          <X className="h-5 w-5" />
      </Button>
      
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="w-full max-w-sm"
      >
        <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border-2 border-white/50 shadow-2xl">
          {memoizedImage}
        </div>
      </motion.div>

      <motion.div
        className="w-full max-w-sm bg-background/80 backdrop-blur-lg p-4 rounded-xl border border-white/10"
      >
        <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
            <MapPin className="h-5 w-5 text-accent"/>
            {t('location_title')}
        </h3>
        <div className="h-48 w-full rounded-md overflow-hidden bg-muted">
          <DynamicMap />
        </div>
      </motion.div>
    </motion.div>
  );
}
