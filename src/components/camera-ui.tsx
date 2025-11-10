'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { SwitchCamera, Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import TranslationView from './translation-view';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { identifyObject } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import ArSnapshotView from './ar-snapshot-view';
import { Wand2 } from 'lucide-react';
import { Slider } from './ui/slider';

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
  const lastIdentifiedObject = useRef<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [zoomCapabilities, setZoomCapabilities] = useState<{ min: number; max: number; step: number } | null>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);


  const startCamera = useCallback(async () => {
    setIsCameraReady(false);
    setZoomCapabilities(null);
    setZoom(1);

    if (videoRef.current) {
      if (videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode }
        });
        videoRef.current.srcObject = stream;
        videoTrackRef.current = stream.getVideoTracks()[0];
        
        const capabilities = videoTrackRef.current.getCapabilities();
        if ('zoom' in capabilities) {
          setZoomCapabilities({
            min: capabilities.zoom.min,
            max: capabilities.zoom.max,
            step: capabilities.zoom.step,
          });
        }
        
        videoRef.current.onloadedmetadata = () => {
          setIsCameraReady(true);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        toast({
          variant: "destructive",
          title: "Chyba kamery",
          description: "Nepodařilo se získat přístup ke kameře.",
        });
        // If environment camera fails, try to switch to user camera
        if (facingMode === 'environment') {
          setFacingMode('user');
        }
      }
    }
  }, [facingMode, toast]);

  const stopArMode = useCallback(() => {
    if (arIntervalRef.current) {
      clearInterval(arIntervalRef.current);
      arIntervalRef.current = null;
    }
    setArObject(null);
    lastIdentifiedObject.current = null;
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
      
      const MAX_WIDTH = 640;
      const scale = MAX_WIDTH / video.videoWidth;
      canvas.width = MAX_WIDTH;
      canvas.height = video.videoHeight * scale;

      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        try {
          const result = await identifyObject(dataUrl);
          if (result.identifiedObject && result.description) {
              if (result.identifiedObject !== lastIdentifiedObject.current) {
                  setArObject({ label: result.identifiedObject, description: result.description });
                  lastIdentifiedObject.current = result.identifiedObject;
              }
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
      arIntervalRef.current = setInterval(captureFrameForAr, 1500);
    } else {
      stopArMode();
    }
    return () => stopArMode();
  }, [mode, isCameraReady, captureFrameForAr, stopArMode]);

  const handleZoomChange = (newZoom: number) => {
    if (videoTrackRef.current && zoomCapabilities) {
        try {
            videoTrackRef.current.applyConstraints({ advanced: [{ zoom: newZoom }] });
            setZoom(newZoom);
        } catch (error) {
            console.error('Zoom not supported or value out of range:', error);
        }
    }
  };

  const handleFlipCamera = () => {
    stopArMode();
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
        const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
        
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
      aria-label="Vyfotit"
    >
      <div className="w-full h-full rounded-full bg-background active:scale-95 transition-transform" />
    </button>
  );

  const ModeSwitcher = () => (
    <div className="flex items-center justify-center gap-4 text-sm font-medium text-white/80">
      <button onClick={() => setMode('QR')} className={cn("transition-colors", mode === 'QR' && 'text-accent font-semibold')}>QR</button>
      <button onClick={() => setMode('PHOTO')} className={cn("text-lg transition-colors", mode === 'PHOTO' && 'text-accent font-semibold')}>Foto</button>
      <button onClick={() => setMode('VIDEO')} className={cn("transition-colors", mode === 'VIDEO' && 'text-accent font-semibold')}>Video</button>
      <button onClick={() => setMode('AR')} className={cn("transition-colors flex items-center gap-1", mode === 'AR' && 'text-accent font-semibold')}>
        <Wand2 className="h-4 w-4" /> AR
      </button>
    </div>
  );

  return (
    <div className="h-full w-full bg-black flex flex-col">
      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />

        {!isCameraReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
        
        {mode === 'AR' && arObject && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm flex items-center gap-2">
            {isProcessingAr && (!arObject || arObject.label !== lastIdentifiedObject.current) ? <Loader2 className="h-4 w-4 animate-spin"/> : <Wand2 className="h-4 w-4 text-accent" />}
            {arObject.label}
          </div>
        )}

        <div className="absolute top-4 right-4 z-10">
            <Button variant="ghost" size="icon" onClick={handleFlipCamera} className="text-white bg-black/20 backdrop-blur-sm hover:bg-black/40 hover:text-white rounded-full">
                <SwitchCamera className="h-6 w-6" />
            </Button>
        </div>

        {zoomCapabilities && (
          <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center gap-2">
            <ZoomOut className="h-5 w-5 text-white" />
            <Slider
              min={zoomCapabilities.min}
              max={zoomCapabilities.max}
              step={zoomCapabilities.step}
              value={[zoom]}
              onValueChange={(value) => handleZoomChange(value[0])}
              className="w-full"
            />
            <ZoomIn className="h-5 w-5 text-white" />
          </div>
        )}
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
