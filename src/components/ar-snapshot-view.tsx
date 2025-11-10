'use client';

import Image from 'next/image';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { X, Wand2 } from 'lucide-react';
import { useMemo } from 'react';
import { ScrollArea } from './ui/scroll-area';

interface ArSnapshotViewProps {
  imageSrc: string;
  label: string;
  description: string;
  onBack: () => void;
}

export default function ArSnapshotView({ imageSrc, label, description, onBack }: ArSnapshotViewProps) {
  const memoizedImage = useMemo(() => (
    <Image src={imageSrc} alt="AR Snapshot" layout="fill" objectFit="cover" />
  ), [imageSrc]);

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-10 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm h-[95%] flex flex-col">
        <CardHeader className="relative pb-2">
          <CardTitle>AR Snapshot</CardTitle>
          <Button variant="ghost" size="icon" className="absolute top-3 right-3 h-8 w-8 rounded-full" onClick={onBack}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
          <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-muted">
            {memoizedImage}
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg flex-1 flex flex-col">
            <p className="text-sm text-muted-foreground mb-1">Identified Object</p>
            <p className="font-semibold text-lg text-foreground flex items-center justify-center gap-2">
              <Wand2 className="h-5 w-5 text-accent" />
              {label}
            </p>
            <ScrollArea className="mt-4 text-left flex-1">
                <p className="text-sm text-foreground/80">{description}</p>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
