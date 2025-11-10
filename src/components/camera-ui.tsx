'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { SwitchCamera, Loader2 } from 'lucide-react';
import TranslationView from './translation-view';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { identifyObject } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import ArSnapshotView from './ar-snapshot-view';
import { Wand2 } from 'lucide-react';

type Mode = 'PHOTO' | 'VIDEO' | 'QR' | 'AR';

interface ArObject {
    label: string;
    description: string;
}

export default function CameraUI() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>('PHOTO');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [arObject, setArObject] = useState<ArObject | null>(null);
  const [isProcessingAr, setIsProcessingAr] = useState(false);
  const arIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const [arSnapshot, setArSnapshot] = useState<{image: string, label: string, description: string} | null>(null);


  const startCamera = useCallback(async () => {
    setIsCameraReady(false);
    if (videoRef.current) {
      if (videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode }
        });
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setIsCameraReady(true);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        if (facingMode === 'environment') {
          setFacingMode('user');
        }
      }
    }
  }, [facingMode]);

  const stopArMode = useCallback(() => {
    if (arIntervalRef.current) {
      clearInterval(arIntervalRef.current);
      arIntervalRef.current = null;
    }
    setArObject(null);
    setIsProcessingAr(false);
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
      stopArMode();
    };
  }, [startCamera, stopArMode]);
  
  const captureFrameForAr = useCallback(async () => {
    if (videoRef.current && canvasRef.current && !isProcessingAr) {
      setIsProcessingAr(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        
        try {
          const result = await identifyObject(dataUrl);
          if(result.identifiedObject && result.description) {
            setArObject({ label: result.identifiedObject, description: result.description });
          } else if (result.error) {
            // Don't show toast for AR mode to avoid spamming
          }
        } catch (error) {
          // Don't show toast for AR mode to avoid spamming
        } finally {
          setIsProcessingAr(false);
        }
      } else {
        setIsProcessingAr(false);
      }
    }
  }, [isProcessingAr]);

  useEffect(() => {
    if (mode === 'AR' && isCameraReady) {
      arIntervalRef.current = setInterval(captureFrameForAr, 2000);
    } else {
      stopArMode();
    }
    return () => stopArMode();
  }, [mode, isCameraReady, captureFrameForAr, stopArMode]);

  const handleFlipCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        if (facingMode === 'user') {
          context.translate(canvas.width, 0);
          context.scale(-1, 1);
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        
        if (mode === 'AR' && arObject) {
            setArSnapshot({ image: dataUrl, label: arObject.label, description: arObject.description });
        } else {
            setCapturedImage(dataUrl);
        }
      }
    }
  };

  const ShutterButton = () => (
    <button
      onClick={handleCapture}
      disabled={!isCameraReady}
      className="w-20 h-20 rounded-full bg-background/30 p-1.5 backdrop-blur-sm flex items-center justify-center ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      aria-label="Capture photo"
    >
      <div className="w-full h-full rounded-full bg-background active:scale-95 transition-transform" />
    </button>
  );

  const ModeSwitcher = () => (
    <div className="flex items-center justify-center gap-4 text-sm font-medium text-white/80">
      <button onClick={() => setMode('QR')} className={cn("transition-colors", mode === 'QR' && 'text-accent font-semibold')}>QR</button>
      <button onClick={() => setMode('PHOTO')} className={cn("text-lg transition-colors", mode === 'PHOTO' && 'text-accent font-semibold')}>Photo</button>
      <button onClick={() => setMode('VIDEO')} className={cn("transition-colors", mode === 'VIDEO' && 'text-accent font-semibold')}>Video</button>
      <button onClick={() => setMode('AR')} className={cn("transition-colors flex items-center gap-1", mode === 'AR' && 'text-accent font-semibold')}>
        <Wand2 className="h-4 w-4" /> AR
      </button>
    </div>
  );

  return (
    <div className="h-full w-full bg-black flex flex-col">
      <div className="relative flex-1">
        <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />

        {!isCameraReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
        
        {mode === 'AR' && arObject && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm flex items-center gap-2">
            {isProcessingAr ? <Loader2 className="h-4 w-4 animate-spin"/> : <Wand2 className="h-4 w-4" />}
            {arObject.label}
          </div>
        )}

        <div className="absolute top-4 right-4 z-10">
            <Button variant="ghost" size="icon" onClick={handleFlipCamera} className="text-white bg-black/20 backdrop-blur-sm hover:bg-black/40 hover:text-white rounded-full">
                <SwitchCamera className="h-6 w-6" />
            </Button>
        </div>
      </div>

      <div className="h-40 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-4">
        <ModeSwitcher />
        <ShutterButton />
      </div>

      {capturedImage && mode === 'PHOTO' && (
        <TranslationView
          imageSrc={capturedImage}
          onBack={() => setCapturedImage(null)}
        />
      )}

      {arSnapshot && mode === 'AR' && (
        <ArSnapshotView
            imageSrc={arSnapshot.image}
            label={arSnapshot.label}
            description={arSnapshot.description}
            onBack={() => setArSnapshot(null)}
        />
      )}
    </div>
  );
}
