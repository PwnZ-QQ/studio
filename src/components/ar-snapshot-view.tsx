'use client';

import { Suspense } from 'react';
import { Button } from './ui/button';
import { X, Loader2, Link as LinkIcon } from 'lucide-react';
import { useMemo } from 'react';
import { ScrollArea } from './ui/scroll-area';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import ObjectModel from './object-model';

interface ArSnapshotViewProps {
  imageSrc: string;
  label: string;
  description: string;
  onBack: () => void;
}

export default function ArSnapshotView({ imageSrc, label, description, onBack }: ArSnapshotViewProps) {
  const t = useTranslations('ArSnapshotView');
  const tCamera = useTranslations('CameraUI');

  const isProcessing = label === tCamera('ar_processing') || description === '';
  const objectSearchUrl = useMemo(() => {
    if (isProcessing || label === 'Object not identified') return null;
    return `https://www.google.com/search?q=${encodeURIComponent(label)}`;
  }, [label, isProcessing]);

  return (
    <motion.div 
      className="absolute inset-0 bg-black/50 backdrop-blur-lg z-10 flex flex-col items-center justify-center p-4 gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Button variant="ghost" size="icon" className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/30 text-white hover:bg-black/50" onClick={onBack}>
          <X className="h-5 w-5" />
      </Button>

      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-sm"
      >
        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black">
          <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-white"/></div>}>
            <ObjectModel modelKey={label} />
          </Suspense>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-sm bg-transparent p-4 rounded-xl flex-grow flex flex-col"
      >
        <h3 className="text-2xl font-bold text-white text-center mb-4" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{t('title')}</h3>
        <div className="text-center p-4 bg-black/20 rounded-xl border border-white/10 flex-1 flex flex-col backdrop-blur-sm">
          <p className="text-sm text-white/70 mb-1">{t('identified_object_label')}</p>
          <div className="font-bold text-3xl text-white flex items-center justify-center gap-3" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.7)' }}>
            {isProcessing && label !== 'Object not identified' ? <Loader2 className="h-7 w-7 animate-spin" /> : null}
            {objectSearchUrl ? (
                <a href={objectSearchUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline">
                    <span>{label}</span>
                    <LinkIcon className="h-5 w-5 text-white/70" />
                </a>
            ) : (
                <p>{label}</p>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-white/20 flex-1 flex flex-col min-h-0">
            <p className="text-sm text-white/70 mb-2">{t('description_label')}</p>
            <ScrollArea className="mt-1 text-left flex-1">
                {isProcessing ? (
                  <div className="flex items-center justify-center h-full">
                     <Loader2 className="h-5 w-5 animate-spin text-white/70" />
                  </div>
                ) : (
                  <p className="text-sm text-white/90" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{description}</p>
                )}
            </ScrollArea>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
