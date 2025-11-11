'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import Image from 'next/image';
import { SwitchCamera, Loader2, ZoomIn, ZoomOut, QrCode, Copy, X, Languages, Download, Zap, ZapOff, Type, Smile, BarChart2 } from 'lucide-react';
import PhotoLocationView from './photo-location-view';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { identifyObject, translateTextInImage } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import ArSnapshotView from './ar-snapshot-view';
import CameraStats from './camera-stats';
import { Wand2 } from 'lucide-react';
import { Slider } from './ui/slider';
import jsQR from 'jsqr';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useLocale, useTranslations } from 'next-intl';
import LanguageSwitcher from './language-switcher';
import { AnimatePresence, motion } from 'framer-motion';
import { useCameraStore } from '@/store/camera-store';
import { FaceMesh } from '@mediapipe/face_mesh';
import { drawConnectors } from '@mediapipe/drawing_utils';
import { FACEMESH_TESSELATION } from '@mediapipe/face_mesh';


export default function CameraUI() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const touchStartDistance = useRef<number>(0);
  const lastZoom = useRef<number>(1);
  const faceMeshRef = useRef<FaceMesh | null>(null);

  const { toast } = useToast();
  const t = useTranslations('CameraUI');
  const locale = useLocale();

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
    hasTorch,
    setHasTorch,
    isTorchOn,
    setIsTorchOn,
    reset,
  } = useCameraStore();
  
  const [faceModelReady, setFaceModelReady] = useState(false);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const qrIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [translatedText, setTranslatedText] = useState<{ text: string, box: any } | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const loadFaceModel = useCallback(() => {
    if (faceMeshRef.current) return;
    setFaceModelReady(false);
    const faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      },
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    
    faceMesh.onResults(onFaceResults);

    faceMesh.initialize().then(() => {
        faceMeshRef.current = faceMesh;
        setFaceModelReady(true);
    });

  }, []);
  
  const onFaceResults = (results: any) => {
    const canvas = canvasRef.current;
    if (!canvas || !videoRef.current) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiFaceLandmarks) {
      for (const landmarks of results.multiFaceLandmarks) {
        drawConnectors(ctx, landmarks, FACEMESH_TESSELATION,
                       {color: '#C0C0C070', lineWidth: 1});
      }
    }
    ctx.restore();
  };
  
  const detectFace = useCallback(async () => {
    if (faceMeshRef.current && videoRef.current) {
        await faceMeshRef.current.send({image: videoRef.current});
    }
  }, []);

  const startCamera = useCallback(async () => {
    setIsCameraReady(false);
    setZoomCapabilities(null);
    setZoom(1);
    setHasTorch(false);
    setIsTorchOn(false);

    if (videoRef.current) {
      if (videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: facingMode,
            advanced: [{ focusMode: 'continuous' }]
          },
          audio: true
        });
        videoRef.current.srcObject = stream;
        const track = stream.getVideoTracks()[0];
        setVideoTrack(track);
        
        const capabilities = track.getCapabilities();
        if ('torch' in capabilities) {
          setHasTorch(!!capabilities.torch);
        }

        if ('zoom' in capabilities && capabilities.zoom) {
          setZoomCapabilities({
            min: capabilities.zoom.min,
            max: capabilities.zoom.max,
            step: capabilities.zoom.step,
          });
          lastZoom.current = 1;
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
  }, [facingMode, setIsCameraReady, setVideoTrack, setZoom, setZoomCapabilities, t, toast, setFacingMode, setHasTorch, setIsTorchOn]);

  const stopDetectionMode = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
  }, []);

  const stopQrMode = useCallback(() => {
    if (qrIntervalRef.current) {
      clearInterval(qrIntervalRef.current);
      qrIntervalRef.current = null;
    }
  }, []);
  
  const stopTextMode = useCallback(() => {
    setTranslatedText(null);
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
    loadFaceModel();

    return () => {
        faceMeshRef.current?.close();
    }
  }, [loadFaceModel]);


  useEffect(() => {
    stopDetectionMode();
    stopQrMode();
    stopTextMode();
    
    if (mode === 'SMILE' && isCameraReady && faceModelReady) {
      detectionIntervalRef.current = setInterval(detectFace, 100);
    } else if (mode === 'QR' && isCameraReady) {
      startQrMode();
    }
    
    return () => {
      stopDetectionMode();
      stopQrMode();
      stopTextMode();
    }
  }, [mode, isCameraReady, faceModelReady, detectFace, stopDetectionMode, stopQrMode, startQrMode, stopTextMode]);


  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
      stopDetectionMode();
      stopQrMode();
      stopTextMode();
      reset();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);
  
  const handleZoomChange = useCallback((newZoom: number) => {
    if (videoTrack && zoomCapabilities) {
        try {
            const clampedZoom = Math.max(zoomCapabilities.min, Math.min(newZoom, zoomCapabilities.max));
            videoTrack.applyConstraints({ advanced: [{ zoom: clampedZoom }] });
            setZoom(clampedZoom);
        } catch (error) {
            console.error('Zoom not supported or value out of range:', error);
        }
    }
  }, [videoTrack, zoomCapabilities, setZoom]);

  const handleTouchStart = (e: React.TouchEvent<HTMLVideoElement>) => {
    if (e.touches.length === 2) {
        e.preventDefault();
        touchStartDistance.current = Math.hypot(
            e.touches[0].pageX - e.touches[1].pageX,
            e.touches[0].pageY - e.touches[1].pageY
        );
        lastZoom.current = zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLVideoElement>) => {
      if (e.touches.length === 2 && zoomCapabilities) {
          e.preventDefault();
          const currentDistance = Math.hypot(
              e.touches[0].pageX - e.touches[1].pageX,
              e.touches[0].pageY - e.touches[1].pageY
          );
          const zoomFactor = currentDistance / touchStartDistance.current;
          const newZoom = lastZoom.current * zoomFactor;
          handleZoomChange(newZoom);
      }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLVideoElement>) => {
    if (e.touches.length < 2) {
        touchStartDistance.current = 0;
    }
  };

  const toggleTorch = useCallback(() => {
    if (videoTrack && hasTorch) {
      const nextTorchState = !isTorchOn;
      videoTrack.applyConstraints({ advanced: [{ torch: nextTorchState }] })
        .then(() => {
          setIsTorchOn(nextTorchState);
        })
        .catch(e => console.error('Failed to toggle torch:', e));
    }
  }, [videoTrack, hasTorch, isTorchOn, setIsTorchOn]);

  const handleFlipCamera = () => {
    stopDetectionMode();
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
    
    if (mode === 'TEXT') {
      if (videoRef.current && canvasRef.current && !isTranslating) {
        setIsTranslating(true);
        setTranslatedText(null);
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
            
            const result = await translateTextInImage(dataUrl, locale === 'cs' ? 'Czech' : 'English');
            
            if (result.translatedText) {
                setTranslatedText({ text: result.translatedText, box: { x: 0, y: 0, width: canvas.width, height: canvas.height/4 } });
            } else {
                toast({ variant: 'destructive', title: "Translation Failed", description: result.error });
            }
        }
        setIsTranslating(false);
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
            const objectName = 'placeholder'
            setArSnapshot({ image: dataUrl, label: t('ar_processing'), description: '' });
            identifyObject(objectName).then(result => {
                setArSnapshot({
                    image: dataUrl,
                    label: objectName,
                    description: result.description || (result.error ? result.error as string : 'Could not get a description.')
                });
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
  
  const handleModeChange = (newMode: 'PHOTO' | 'VIDEO' | 'QR' | 'AR' | 'TEXT' | 'SMILE') => {
    setQrCode(null);
    setTranslatedText(null);
    if(isRecording) stopRecording();
    setMode(newMode);
  }

  const ShutterButton = () => (
    <motion.button
      onClick={handleCapture}
      disabled={!isCameraReady || mode === 'QR' || (mode === 'TEXT' && isTranslating) || (mode === 'SMILE')}
      className="w-16 h-16 rounded-full bg-white/30 p-1 backdrop-blur-sm flex items-center justify-center ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      aria-label={t('capture_button_label')}
      whileTap={{ scale: 0.9 }}
    >
      <motion.div 
        className={cn("w-full h-full rounded-full",
          mode === 'VIDEO' ? 'bg-red-500' : 'bg-white',
          mode === 'TEXT' && 'bg-blue-500',
          mode === 'SMILE' && 'bg-yellow-400',
        )}
        animate={{ 
          scale: isRecording ? 0.6 : 1,
          borderRadius: isRecording ? '20%' : '50%'
        }}
        transition={{ duration: 0.2 }}
      >
        {mode === 'TEXT' && (isTranslating ? <Loader2 className="h-full w-full p-3 text-white animate-spin" /> : <Type className="h-full w-full p-4 text-blue-900" />)}
        {mode === 'SMILE' && <Smile className="h-full w-full p-3 text-yellow-900" />}
      </motion.div>
    </motion.button>
  );

  const ModeSwitcher = () => (
    <div className="flex items-center justify-center gap-4 text-sm font-medium text-white/80">
      <button onClick={() => handleModeChange('QR')} className={cn("transition-colors", mode === 'QR' && 'text-accent font-semibold')}>{t('mode_qr')}</button>
      <button onClick={() => handleModeChange('PHOTO')} className={cn("transition-colors", mode === 'PHOTO' && 'text-accent font-semibold')}>{t('mode_photo')}</button>
      <button onClick={() => handleModeChange('VIDEO')} className={cn("transition-colors", mode === 'VIDEO' && 'text-accent font-semibold')}>{t('mode_video')}</button>
      <button onClick={() => handleModeChange('AR')} className={cn("transition-colors flex items-center gap-1", mode === 'AR' && 'text-accent font-semibold')}>
        <Wand2 className="h-4 w-4" /> {t('mode_ar')}
      </button>
      <button onClick={() => handleModeChange('TEXT')} className={cn("transition-colors flex items-center gap-1", mode === 'TEXT' && 'text-accent font-semibold')}>
        <Type className="h-4 w-4" /> Text
      </button>
      <button onClick={() => handleModeChange('SMILE')} className={cn("transition-colors flex items-center gap-1", mode === 'SMILE' && 'text-accent font-semibold')}>
        <Smile className="h-4 w-4" /> Úsměv
      </button>
    </div>
  );

  const VideoPreview = () => (
    <motion.div
        className="absolute inset-0 bg-black/80 backdrop-blur-md z-20 flex flex-col items-center justify-center p-4"
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
    return null;
  };

const TranslatedTextBox = ({ translated }: { translated: { text: string, box: any } | null }) => {
  if (!translated || !videoRef.current) return null;
  const { videoWidth, videoHeight } = videoRef.current;
  const { offsetWidth, offsetHeight } = videoRef.current;
  const scaleX = offsetWidth / videoWidth;
  const scaleY = offsetHeight / videoHeight;

  const { x, y, width, height } = translated.box;

  return (
    <div
      className="absolute flex items-center justify-center p-2 bg-black/70 rounded-md"
      style={{
          left: `${x * scaleX}px`,
          top: `${y * scaleY}px`,
          width: `${width * scaleX}px`,
          height: `${height * scaleY}px`,
      }}
    >
      <p className="text-white text-sm font-semibold text-center">{translated.text}</p>
      <Button variant="ghost" size="icon" className="absolute -top-3 -right-3 h-6 w-6 text-white bg-black/50 rounded-full" onClick={() => setTranslatedText(null)}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};


  return (
    <div className="h-full w-full bg-black flex flex-col">
      <div className="relative flex-1 overflow-hidden">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="h-full w-full object-cover" 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

        {(!isCameraReady || (mode === 'SMILE' && !faceModelReady)) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
              <p className="text-white text-sm font-medium">
                {mode === 'SMILE' && !faceModelReady ? 'Nahrávám model obličeje...' : 'Nahrávám kameru...'}
              </p>
            </div>
          </div>
        )}
        
        {mode === 'AR' && isCameraReady && <ArObjectBoxes />}
        {mode === 'TEXT' && translatedText && <TranslatedTextBox translated={translatedText} />}

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

        <AnimatePresence>
            {showStats && <CameraStats onBack={() => setShowStats(false)} />}
        </AnimatePresence>


        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            <LanguageSwitcher />
             {hasTorch && (
                <Button variant="ghost" size="icon" onClick={toggleTorch} className={cn("text-white bg-black/30 backdrop-blur-sm hover:bg-black/40 hover:text-white rounded-full h-10 w-10", isTorchOn && "text-accent bg-accent/20")}>
                    {isTorchOn ? <ZapOff className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => setShowStats(true)} className="text-white bg-black/30 backdrop-blur-sm hover:bg-black/40 hover:text-white rounded-full h-10 w-10">
                <BarChart2 className="h-5 w-5" />
            </Button>
        </div>
        <div className="absolute top-4 right-4 z-10">
            <Button variant="ghost" size="icon" onClick={handleFlipCamera} className="text-white bg-black/30 backdrop-blur-sm hover:bg-black/40 hover:text-white rounded-full h-10 w-10">
                <SwitchCamera className="h-5 w-5" />
            </Button>
        </div>

        {zoomCapabilities && (
          <div className="absolute bottom-40 left-4 right-4 z-10 flex items-center gap-2">
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
        
        <div className="absolute bottom-0 left-0 right-0 z-10 h-36 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center justify-end gap-4 pb-5">
            <ModeSwitcher />
            <ShutterButton />
        </div>
      </div>
      
      <AnimatePresence>
        {capturedImage && mode === 'PHOTO' && (
          <PhotoLocationView
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
