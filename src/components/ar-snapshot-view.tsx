'use client';

import Image from 'next/image';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { X } from 'lucide-react';
import { useMemo } from 'react';

interface ArSnapshotViewProps {
  imageSrc: string;
  label: string;
  onBack: () => void;
}

export default function ArSnapshotView({ imageSrc, label, onBack }: ArSnapshotViewProps) {
  const memoizedImage = useMemo(() => (
    <Image src={imageSrc} alt="AR Snapshot" layout="fill" objectFit="contain" />
  ), [imageSrc]);

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-10 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm h-[95%] flex flex-col">
        <CardHeader className="relative">
          <CardTitle>AR Snapshot</CardTitle>
          <Button variant="ghost" size="icon" className="absolute top-3 right-3 h-8 w-8 rounded-full" onClick={onBack}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
          <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-muted">
            {memoizedImage}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm flex items-center gap-2">
                {label}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
