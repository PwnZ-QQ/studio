'use client';

import { useState, useEffect } from 'react';
import useCameraPermission, { type PermissionState } from '@/hooks/use-camera-permission';
import PermissionsPage from '@/components/permissions-page';
import CameraUI from '@/components/camera-ui';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { permissionStatus, requestPermission } = useCameraPermission();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const renderContent = () => {
    if (!isClient || permissionStatus === undefined) {
      return (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
  
    if (permissionStatus === 'granted') {
      return <CameraUI />;
    }
  
    return <PermissionsPage status={permissionStatus} requestPermission={requestPermission} />;
  }

  return (
    <main className="bg-neutral-800 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-sm mx-auto aspect-[9/16] bg-background text-foreground relative overflow-hidden rounded-2xl shadow-2xl border-4 border-neutral-700">
            {renderContent()}
        </div>
    </main>
  );
}
