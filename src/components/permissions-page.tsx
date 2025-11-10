'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CameraOff } from 'lucide-react';
import type { PermissionState } from '@/hooks/use-camera-permission';
import { useTranslations } from 'next-intl';

interface PermissionsPageProps {
  status: PermissionState;
  requestPermission: () => Promise<boolean>;
}

export default function PermissionsPage({ status, requestPermission }: PermissionsPageProps) {
  const t = useTranslations('PermissionsPage');

  return (
    <div className="flex h-full w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm text-center border-0 shadow-none">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
            <CameraOff className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="mt-4 text-2xl">{t('title')}</CardTitle>
          <CardDescription className="mt-2">
            {status === 'denied'
              ? t('description_denied')
              : t('description_prompt')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status !== 'denied' && (
            <Button onClick={requestPermission} className="w-full" size="lg">
              {t('button')}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
