'use client';

import { useRef, useEffect, useCallback } from 'react';
import { SwitchCamera, Loader2, ZoomIn, ZoomOut, QrCode, Copy, X, Languages } from 'lucide-react';
import TranslationView from './translation-view';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { identifyObject } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import ArSnapshotView from './ar-snapshot-view';
import { Wand2 } from 'lucide-react';
import { Slider } from './ui/slider';
import jsQR from 'jsqr';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from './language-switcher';
import { AnimatePresence, motion } from 'framer-motion';
import { useCameraStore } from '@/store/camera-store';

export default function CameraUI() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const t = useTranslations('CameraUI');

  const {
    mode,
    setMode,
    facingMode,
    setFacingMode,
    capturedImage,
    setCapturedImage,
    isCameraReady,
    setIsCameraReady,
    arObject,
    setArObject,
    isProcessingAr,
    setIsProcessingAr,
    arSnapshot,
    setArSnapshot,
    zoom,
    setZoom,
    zoomCapabilities,
    setZoomCapabilities,
    qrCode,
    setQrCode,
    videoTrack,
    setVideoTrack,
    reset,
  } = useCameraStore();

  const arIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const qrIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastIdentifiedObject = useRef<string | null>(null);

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
        const track = stream.getVideoTracks()[0];
        setVideoTrack(track);
        
        const capabilities = track.getCapabilities();
        if ('zoom' in capabilities && capabilities.zoom) {
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
          title: t('camera_error_toast_title'),
          description: t('camera_error_toast_description'),
        });
        if (facingMode === 'environment') {
          setFacingMode('user');
        }
      }
    }
  }, [facingMode, setIsCameraReady, setVideoTrack, setZoom, setZoomCapabilities, t, toast, setFacingMode]);

  const stopArMode = useCallback(() => {
    if (arIntervalRef.current) {
      clearInterval(arIntervalRef.current);
      arIntervalRef.current = null;
    }
    setArObject(null);
    lastIdentifiedObject.current = null;
    setIsProcessingAr(false);
  }, [setArObject, setIsProcessingAr]);

  const stopQrMode = useCallback(() => {
    if (qrIntervalRef.current) {
      clearInterval(qrIntervalRef.current);
      qrIntervalRef.current = null;
    }
    setQrCode(null);
  }, [setQrCode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
      stopArMode();
      stopQrMode();
      reset();
    };
  }, [startCamera, stopArMode, stopQrMode, reset]);
  
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
  }, [isProcessingAr, setIsProcessingAr, setArObject]);

  const scanQrCode = useCallback(() => {
    if (videoRef.current && canvasRef.current && !qrCode) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');

      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          setQrCode(code.data);
          stopQrMode();
        }
      }
    }
  }, [qrCode, stopQrMode, setQrCode]);


  useEffect(() => {
    stopArMode();
    stopQrMode();
    if (mode === 'AR' && isCameraReady) {
      arIntervalRef.current = setInterval(captureFrameForAr, 1500);
    } else if (mode === 'QR' && isCameraReady) {
      qrIntervalRef.current = setInterval(scanQrCode, 500);
    }
    return () => {
      stopArMode();
      stopQrMode();
    }
  }, [mode, isCameraReady, captureFrameForAr, scanQrCode, stopArMode, stopQrMode]);

  const handleZoomChange = (newZoom: number) => {
    if (videoTrack && zoomCapabilities) {
        try {
            videoTrack.applyConstraints({ advanced: [{ zoom: newZoom }] });
            setZoom(newZoom);
        } catch (error) {
            console.error('Zoom not supported or value out of range:', error);
        }
    }
  };

  const handleFlipCamera = () => {
    stopArMode();
    stopQrMode();
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

  const handleCopyQrCode = () => {
    if (qrCode) {
        navigator.clipboard.writeText(qrCode);
        toast({
            title: t('copied_toast_title'),
            description: t('copied_toast_description'),
        });
    }
  }
  
  const handleModeChange = (newMode: 'PHOTO' | 'VIDEO' | 'QR' | 'AR') => {
    setArObject(null);
    setQrCode(null);
    setMode(newMode);
  }

  const ShutterButton = () => (
    <motion.button
      onClick={handleCapture}
      disabled={!isCameraReady || mode === 'QR'}
      className="w-20 h-20 rounded-full bg-background/30 p-1.5 backdrop-blur-sm flex items-center justify-center ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      aria-label={t('capture_button_label')}
      whileTap={{ scale: 0.9 }}
    >
      <div className="w-full h-full rounded-full bg-background" />
    </motion.button>
  );

  const ModeSwitcher = () => (
    <div className="flex items-center justify-center gap-4 text-sm font-medium text-white/80 bg-black/30 backdrop-blur-sm p-2 rounded-full">
      <button onClick={() => handleModeChange('QR')} className={cn("transition-colors px-2 py-1 rounded-full", mode === 'QR' && 'text-accent font-semibold bg-white/10')}>{t('mode_qr')}</button>
      <button onClick={() => handleModeChange('PHOTO')} className={cn("transition-colors px-2 py-1 rounded-full", mode === 'PHOTO' && 'text-accent font-semibold bg-white/10')}>{t('mode_photo')}</button>
      <button onClick={() => handleModeChange('VIDEO')} className={cn("transition-colors px-2 py-1 rounded-full", mode === 'VIDEO' && 'text-accent font-semibold bg-white/10')}>{t('mode_video')}</button>
      <button onClick={() => handleModeChange('AR')} className={cn("transition-colors flex items-center gap-1 px-2 py-1 rounded-full", mode === 'AR' && 'text-accent font-semibold bg-white/10')}>
        <Wand2 className="h-4 w-4" /> {t('mode_ar')}
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
        
        <AnimatePresence>
        {mode === 'AR' && arObject && (
          <motion.div 
            className="absolute bottom-40 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm flex items-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            {isProcessingAr && (!arObject || arObject.label !== lastIdentifiedObject.current) ? <Loader2 className="h-4 w-4 animate-spin"/> : null}
            {arObject.label}
          </motion.div>
        )}
        </AnimatePresence>

        <AnimatePresence>
        {mode === 'QR' && qrCode && (
            <motion.div 
              className="absolute inset-x-4 top-14 z-20"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
                <Alert variant="default" className="bg-background/90 backdrop-blur-sm">
                    <QrCode className="h-5 w-5" />
                    <AlertTitle className="flex justify-between items-center">
                        {t('qr_found_title')}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setQrCode(null)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </AlertTitle>
                    <AlertDescription className="break-all mt-2">
                        {qrCode}
                    </AlertDescription>
                    <div className="mt-4 flex gap-2">
                        <Button onClick={handleCopyQrCode} size="sm" className="w-full">
                            <Copy className="mr-2 h-4 w-4" /> {t('qr_copy_button')}
                        </Button>
                        {qrCode.startsWith('http') && (
                             <Button asChild variant="secondary" size="sm" className="w-full">
                                <a href={qrCode} target="_blank" rel="noopener noreferrer">{t('open_link_button')}</a>
                            </Button>
                        )}
                    </div>
                </Alert>
            </motion.div>
        )}
        </AnimatePresence>


        <div className="absolute top-4 left-4 z-10">
            <LanguageSwitcher />
        </div>
        <div className="absolute top-4 right-4 z-10">
            <Button variant="ghost" size="icon" onClick={handleFlipCamera} className="text-white bg-black/20 backdrop-blur-sm hover:bg-black/40 hover:text-white rounded-full">
                <SwitchCamera className="h-6 w-6" />
            </Button>
        </div>

        {zoomCapabilities && (
          <div className="absolute bottom-28 left-4 right-4 z-10 flex items-center gap-2">
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
        
        <div className="absolute bottom-4 left-0 right-0 z-10 flex flex-col items-center justify-center gap-4">
            <ShutterButton />
            <ModeSwitcher />
        </div>

      </div>
      
      <AnimatePresence>
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
      </AnimatePresence>
    </div>
  );
}
