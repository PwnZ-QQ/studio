'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { SwitchCamera, Loader2, Video, QrCode } from 'lucide-react';
import TranslationView from './translation-view';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

type Mode = 'PHOTO' | 'VIDEO' | 'QR';

export default function CameraUI() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>('PHOTO');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const startCamera = useCallback(async () => {
    setIsCameraReady(false);
    if (videoRef.current) {
      // Stop any existing stream
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
        // Fallback to default if facing mode is not available
        if (facingMode === 'environment') {
          setFacingMode('user');
        }
      }
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

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
        // Flip image horizontally if it's the front camera
        if (facingMode === 'user') {
          context.translate(canvas.width, 0);
          context.scale(-1, 1);
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
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
      <button onClick={() => setMode('QR')} className={cn("transition-colors", mode === 'QR' && 'text-primary font-semibold')}>QR</button>
      <button onClick={() => setMode('PHOTO')} className={cn("text-lg transition-colors", mode === 'PHOTO' && 'text-primary font-semibold')}>Photo</button>
      <button onClick={() => setMode('VIDEO')} className={cn("transition-colors", mode === 'VIDEO' && 'text-primary font-semibold')}>Video</button>
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

        <div className="absolute top-4 right-4">
          <Button variant="ghost" size="icon" onClick={handleFlipCamera} className="text-white bg-black/20 hover:bg-black/40 hover:text-white rounded-full">
            <SwitchCamera className="h-6 w-6" />
          </Button>
        </div>
      </div>

      <div className="h-40 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-4">
        <ModeSwitcher />
        <ShutterButton />
      </div>

      {capturedImage && (
        <TranslationView
          imageSrc={capturedImage}
          onBack={() => setCapturedImage(null)}
        />
      )}
    </div>
  );
}
