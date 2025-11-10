'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { SwitchCamera, Loader2, ZoomIn, ZoomOut, QrCode, Copy, X, Languages, Download } from 'lucide-react';
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
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

type Prediction = cocoSsd.DetectedObject;

export default function CameraUI() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

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
    isRecording,
    setIsRecording,
    recordedVideo,
    setRecordedVideo,
    reset,
  } = useCameraStore();

  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const qrIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadModel = useCallback(async () => {
    try {
      await tf.ready();
      const loadedModel = await cocoSsd.load();
      setModel(loadedModel);
    } catch (err) {
      console.error("Failed to load model", err);
      toast({
        variant: "destructive",
        title: "AI Model Error",
        description: "Could not load the object detection model.",
      });
    }
  }, [toast]);

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
          video: { 
            facingMode: facingMode,
            advanced: [{ focusMode: 'continuous' }]
          }
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
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setPredictions([]);
  }, []);

  const stopQrMode = useCallback(() => {
    if (qrIntervalRef.current) {
      clearInterval(qrIntervalRef.current);
      qrIntervalRef.current = null;
    }
  }, []);

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

  const startQrMode = useCallback(() => {
    stopQrMode();
    if (isCameraReady && !qrCode) {
        qrIntervalRef.current = setInterval(scanQrCode, 500);
    }
  }, [isCameraReady, qrCode, stopQrMode, scanQrCode]);

  useEffect(() => {
    loadModel();
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
      stopArMode();
      stopQrMode();
      reset();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode, startCamera, stopArMode, stopQrMode, reset, loadModel]);
  
  const detectObjects = useCallback(async () => {
    if (model && videoRef.current && videoRef.current.readyState === 4) {
      const detectedObjects = await model.detect(videoRef.current);
      setPredictions(detectedObjects);
    }
  }, [model]);

  useEffect(() => {
    stopArMode();
    stopQrMode();
    if (mode === 'AR' && isCameraReady && model) {
      detectionIntervalRef.current = setInterval(detectObjects, 100);
    } else if (mode === 'QR' && isCameraReady) {
      startQrMode();
    }
    return () => {
      stopArMode();
      stopQrMode();
    }
  }, [mode, isCameraReady, model, detectObjects, stopArMode, stopQrMode, startQrMode]);

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

  const startRecording = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      recordedChunksRef.current = [];
      const stream = videoRef.current.srcObject as MediaStream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideo(url);
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleCapture = async () => {
    if (mode === 'VIDEO') {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
      return;
    }
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
        
        if (mode === 'AR') {
          const mostLikelyObject = predictions.length > 0 ? predictions.reduce((prev, current) => (prev.score > current.score) ? prev : current) : null;
          
          setArSnapshot({ image: dataUrl, label: mostLikelyObject ? mostLikelyObject.class : t('ar_processing'), description: '' });

          identifyObject(dataUrl, mostLikelyObject?.class).then(result => {
              if (result.identifiedObject) {
                  setArSnapshot({
                      image: dataUrl,
                      label: result.identifiedObject,
                      description: result.description || (result.error ? result.error as string : 'Could not get a description.')
                  });
              } else {
                  setArSnapshot({
                      image: dataUrl,
                      label: 'Object not identified',
                      description: 'Could not identify an object in the snapshot.'
                  });
              }
          });
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

  const handleDismissQrCode = () => {
    setQrCode(null);
    startQrMode();
  };
  
  const handleModeChange = (newMode: 'PHOTO' | 'VIDEO' | 'QR' | 'AR') => {
    setPredictions([]);
    setQrCode(null);
    if(isRecording) stopRecording();
    setMode(newMode);
  }

  const ShutterButton = () => (
    <motion.button
      onClick={handleCapture}
      disabled={!isCameraReady || mode === 'QR' || (mode === 'AR' && !model)}
      className={cn("w-20 h-20 rounded-full bg-background/30 p-1.5 backdrop-blur-sm flex items-center justify-center ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isRecording && "p-0"
      )}
      aria-label={t('capture_button_label')}
      whileTap={{ scale: 0.9 }}
    >
      <motion.div className={cn("w-full h-full rounded-full bg-background")}
        animate={{ 
          scale: isRecording ? 0.6 : 1,
          borderRadius: isRecording ? '20%' : '50%'
        }}
        transition={{ duration: 0.2 }}
      />
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

  const VideoPreview = () => (
    <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-md z-20 flex flex-col items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
    >
        <div className="w-full max-w-sm rounded-lg overflow-hidden shadow-2xl border-2 border-neutral-700">
            <video src={recordedVideo!} controls autoPlay className="w-full aspect-video"></video>
        </div>
        <div className="flex gap-4 mt-6">
            <Button onClick={() => setRecordedVideo(null)} variant="outline" className="bg-background/80">
                <X className="mr-2 h-4 w-4" /> Zpět
            </Button>
            <Button asChild>
              <a href={recordedVideo!} download="video.webm">
                <Download className="mr-2 h-4 w-4" /> Stáhnout
              </a>
            </Button>
        </div>
    </motion.div>
  );

  const ArObjectBoxes = () => {
    if (!videoRef.current) return null;
    const { videoWidth, videoHeight } = videoRef.current;
    const { offsetWidth, offsetHeight } = videoRef.current;
    const scaleX = offsetWidth / videoWidth;
    const scaleY = offsetHeight / videoHeight;

    return predictions.map((prediction, index) => {
        const [x, y, width, height] = prediction.bbox;
        const isPerson = prediction.class === 'person';
        const borderColor = isPerson ? 'border-red-500' : 'border-accent';

        return (
            <div
                key={index}
                className={cn('absolute border-2', borderColor)}
                style={{
                    left: `${x * scaleX}px`,
                    top: `${y * scaleY}px`,
                    width: `${width * scaleX}px`,
                    height: `${height * scaleY}px`,
                }}
            >
                <p className={cn('absolute -top-6 left-0 text-sm font-semibold px-1 rounded', isPerson ? 'bg-red-500 text-white' : 'bg-accent text-accent-foreground')}>
                    {prediction.class} ({(prediction.score * 100).toFixed(1)}%)
                </p>
            </div>
        );
    });
};

  return (
    <div className="h-full w-full bg-black flex flex-col">
      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />

        {(!isCameraReady || (mode === 'AR' && !model)) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
              <p className="text-white text-sm font-medium">
                {mode === 'AR' && !model ? 'Nahrávám AI model...' : 'Nahrávám kameru...'}
              </p>
            </div>
          </div>
        )}
        
        {mode === 'AR' && isCameraReady && model && <ArObjectBoxes />}

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
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDismissQrCode}>
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

        <AnimatePresence>
          {recordedVideo && <VideoPreview />}
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

    