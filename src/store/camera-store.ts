import { create } from 'zustand';

type Mode = 'PHOTO' | 'VIDEO' | 'QR' | 'AR';

interface ArObject {
  label: string;
  description: string;
}

interface ZoomCapabilities {
  min: number;
  max: number;
  step: number;
}

interface CameraState {
  mode: Mode;
  setMode: (mode: Mode) => void;
  facingMode: 'user' | 'environment';
  setFacingMode: (facingMode: 'user' | 'environment' | ((prev: 'user' | 'environment') => 'user' | 'environment')) => void;
  capturedImage: string | null;
  setCapturedImage: (image: string | null) => void;
  isCameraReady: boolean;
  setIsCameraReady: (isReady: boolean) => void;
  arSnapshot: { image: string; label: string; description: string } | null;
  setArSnapshot: (snapshot: { image: string; label: string; description: string } | null) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  zoomCapabilities: ZoomCapabilities | null;
  setZoomCapabilities: (capabilities: ZoomCapabilities | null) => void;
  qrCode: string | null;
  setQrCode: (qrCode: string | null) => void;
  videoTrack: MediaStreamTrack | null;
  setVideoTrack: (track: MediaStreamTrack | null) => void;
  isRecording: boolean;
  setIsRecording: (isRecording: boolean) => void;
  recordedVideo: string | null;
  setRecordedVideo: (video: string | null) => void;
  reset: () => void;
}

const initialState = {
    mode: 'PHOTO' as Mode,
    facingMode: 'environment' as 'user' | 'environment',
    capturedImage: null,
    isCameraReady: false,
    arSnapshot: null,
    zoom: 1,
    zoomCapabilities: null,
    qrCode: null,
    videoTrack: null,
    isRecording: false,
    recordedVideo: null,
};

export const useCameraStore = create<CameraState>((set) => ({
  ...initialState,
  setMode: (mode) => set({ mode }),
  setFacingMode: (facingMode) => set(state => ({ facingMode: typeof facingMode === 'function' ? facingMode(state.facingMode) : facingMode })),
  setCapturedImage: (image) => set({ capturedImage: image }),
  setIsCameraReady: (isReady) => set({ isCameraReady: isReady }),
  setArSnapshot: (snapshot) => set({ arSnapshot: snapshot }),
  setZoom: (zoom) => set({ zoom }),
  setZoomCapabilities: (capabilities) => set({ zoomCapabilities: capabilities }),
  setQrCode: (qrCode) => set({ qrCode }),
  setVideoTrack: (track) => set({ videoTrack: track }),
  setIsRecording: (isRecording) => set({ isRecording }),
  setRecordedVideo: (video) => set({ recordedVideo: video }),
  reset: () => set(initialState),
}));
