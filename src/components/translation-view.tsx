'use client';

import { useEffect, useMemo, useActionState } from 'react';
import Image from 'next/image';
import { useFormStatus } from 'react-dom';
import { getTranslation } from '@/app/actions';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Loader2, X, Languages, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';

interface TranslationViewProps {
  imageSrc: string;
  onBack: () => void;
}

const languageList = [
  { value: 'Czech', labelKey: 'Czech' },
  { value: 'Spanish', labelKey: 'Spanish' },
  { value: 'French', labelKey: 'French' },
  { value: 'German', labelKey: 'German' },
  { value: 'Japanese', labelKey: 'Japanese' },
  { value: 'Chinese', labelKey: 'Chinese' },
  { value: 'Russian', labelKey: 'Russian' },
  { value: 'Arabic', labelKey: 'Arabic' },
  { value: 'English', labelKey: 'English' },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations('TranslationView');
  return (
    <Button type="submit" disabled={pending} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Languages className="mr-2 h-4 w-4" />}
      {t('translate_button')}
    </Button>
  );
}

export default function TranslationView({ imageSrc, onBack }: TranslationViewProps) {
  const t = useTranslations('TranslationView');
  const tLang = useTranslations('TranslationView.languages');
  const locale = useLocale();

  const initialState = { message: '', translatedText: '' };
  const [state, dispatch] = useActionState(getTranslation, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.message && state.message !== 'success') {
      toast({
        variant: "destructive",
        title: t('translation_error_toast_title'),
        description: state.message,
      });
    }
  }, [state, toast, t]);

  const memoizedImage = useMemo(() => (
    <Image src={imageSrc} alt={t('title')} fill objectFit="contain" />
  ), [imageSrc, t]);
  
  const defaultLanguage = languageList.find(l => l.value.toLowerCase().startsWith(locale))?.value || 'Czech';

  return (
    <motion.div 
      className="absolute inset-0 bg-black/60 backdrop-blur-md z-10 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-sm"
      >
        <Card className="h-[95vh] max-h-[800px] flex flex-col">
          <CardHeader className="relative">
            <CardTitle>{t('title')}</CardTitle>
            <Button variant="ghost" size="icon" className="absolute top-3 right-3 h-8 w-8 rounded-full" onClick={onBack}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
            <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-muted">
              {memoizedImage}
            </div>
            <form action={dispatch} className="flex flex-col gap-4">
              <input type="hidden" name="photoDataUri" value={imageSrc} />
              <Select name="targetLanguage" defaultValue={defaultLanguage} required>
                <SelectTrigger>
                  <SelectValue placeholder={t('select_language_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {languageList.map(lang => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {tLang(lang.labelKey as any)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <SubmitButton />
            </form>
            {state.translatedText && (
              <div className="mt-4 p-4 bg-accent/10 border border-accent/20 rounded-lg">
                  <h3 className="font-semibold text-accent-foreground flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-accent"/>
                      {t('translation_result_title')}
                  </h3>
                  <p className="text-sm text-foreground">{state.translatedText}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
