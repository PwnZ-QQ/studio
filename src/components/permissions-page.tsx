'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CameraOff } from 'lucide-react';
import type { PermissionState } from '@/hooks/use-camera-permission';

interface PermissionsPageProps {
  status: PermissionState;
  requestPermission: () => Promise<boolean>;
}

export default function PermissionsPage({ status, requestPermission }: PermissionsPageProps) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm text-center border-0 shadow-none">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
            <CameraOff className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="mt-4 text-2xl">Vyžadován přístup ke kameře</CardTitle>
          <CardDescription className="mt-2">
            {status === 'denied'
              ? 'Odepřeli jste přístup ke kameře. Chcete-li tuto funkci používat, povolte prosím oprávnění pro kameru v nastavení prohlížeče.'
              : 'Tato aplikace potřebuje přístup k vaší kameře pro focení a poskytování překladu v reálném čase.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status !== 'denied' && (
            <Button onClick={requestPermission} className="w-full" size="lg">
              Povolit kameru
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
