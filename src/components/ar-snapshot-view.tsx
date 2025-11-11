'use client';

import Image from 'next/image';
import { Button } from './ui/button';
import { X, Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { ScrollArea } from './ui/scroll-area';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';

interface ArSnapshotViewProps {
  imageSrc: string;
  label: string;
  description: string;
  onBack: () => void;
}

export default function ArSnapshotView({ imageSrc, label, description, onBack }: ArSnapshotViewProps) {
  const t = useTranslations('ArSnapshotView');
  const tCamera = useTranslations('CameraUI');
  const memoizedImage = useMemo(() => (
    <Image src={imageSrc} alt={t('title')} fill objectFit="cover" />
  ), [imageSrc, t]);

  const isProcessing = label === tCamera('ar_processing') || description === '';

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
        className="w-full max-w-sm bg-background/80 backdrop-blur-lg p-4 rounded-xl border border-white/10 flex-grow flex flex-col"
      >
        <h3 className="text-xl font-semibold text-foreground text-center mb-4">{t('title')}</h3>
        <div className="text-center p-4 bg-muted/50 rounded-lg flex-1 flex flex-col">
          <p className="text-sm text-muted-foreground mb-1">{t('identified_object_label')}</p>
          <div className="font-semibold text-2xl text-foreground flex items-center justify-center gap-2">
            {isProcessing && label !== 'Object not identified' ? <Loader2 className="h-6 w-6 animate-spin" /> : null}
            <p>{label}</p>
          </div>
          
          <div className="mt-4 pt-4 border-t border-muted-foreground/20 flex-1 flex flex-col min-h-0">
            <p className="text-sm text-muted-foreground mb-1">{t('description_label')}</p>
            <ScrollArea className="mt-1 text-left flex-1">
                {isProcessing ? (
                  <div className="flex items-center justify-center h-full">
                     <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <p className="text-sm text-foreground/80">{description}</p>
                )}
            </ScrollArea>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
