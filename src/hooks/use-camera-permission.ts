'use client';
import { useState, useEffect, useCallback } from 'react';

export type PermissionState = 'granted' | 'denied' | 'prompt' | undefined;

export default function useCameraPermission() {
  const [permissionStatus, setPermissionStatus] = useState<PermissionState>(undefined);

  const checkPermission = useCallback(async () => {
    if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setPermissionStatus(result.state);
        result.onchange = () => setPermissionStatus(result.state);
      } catch (e) {
        // Fallback for browsers that don't support query
        setPermissionStatus('prompt');
      }
    } else {
      // Fallback for older browsers or non-secure contexts
      setPermissionStatus('prompt');
    }
  }, []);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  const requestPermission = useCallback(async () => {
    if (typeof navigator !== 'undefined' && 'mediaDevices' in navigator) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        setPermissionStatus('granted');
        return true;
      } catch (e) {
        console.error("Camera permission request failed:", e);
        setPermissionStatus('denied');
        return false;
      }
    }
    return false;
  }, []);
  
  return { permissionStatus, requestPermission };
}
