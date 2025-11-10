'use client';

import Image from 'next/image';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { X } from 'lucide-react';
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
  const memoizedImage = useMemo(() => (
    <Image src={imageSrc} alt={t('title')} fill objectFit="cover" />
  ), [imageSrc, t]);

  return (
    <motion.div 
      className="absolute inset-0 bg-black/60 backdrop-blur-md z-10 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-sm"
      >
        <Card className="h-[95vh] max-h-[800px] flex flex-col">
          <CardHeader className="relative pb-2">
            <CardTitle>{t('title')}</CardTitle>
            <Button variant="ghost" size="icon" className="absolute top-3 right-3 h-8 w-8 rounded-full" onClick={onBack}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
            <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-muted">
              {memoizedImage}
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg flex-1 flex flex-col">
              <p className="text-sm text-muted-foreground mb-1">{t('identified_object_label')}</p>
              <p className="font-semibold text-lg text-foreground flex items-center justify-center gap-2">
                {label}
              </p>
              <p className="text-sm text-muted-foreground mt-4 mb-1">{t('description_label')}</p>
              <ScrollArea className="mt-1 text-left flex-1">
                  <p className="text-sm text-foreground/80">{description}</p>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}