'use client';

import { useEffect, useMemo, useActionState, useState } from 'react';
import Image from 'next/image';
import { useFormStatus } from 'react-dom';
import { getTranslation, textToSpeechAction } from '@/app/actions';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Loader2, X, Languages, CheckCircle, Volume2 } from 'lucide-react';
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
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (state.message && state.message !== 'success') {
      toast({
        variant: "destructive",
        title: t('translation_error_toast_title'),
        description: state.message,
      });
    }
    setAudioSrc(null);
  }, [state, toast, t]);

  const handleSpeak = async () => {
    if (!state.translatedText) return;
    setIsSpeaking(true);
    try {
        const result = await textToSpeechAction(state.translatedText);
        if ('audio' in result && result.audio) {
            setAudioSrc(result.audio);
            const audio = new Audio(result.audio);
            audio.play();
            audio.onended = () => setIsSpeaking(false);
        } else {
            toast({
                variant: 'destructive',
                title: 'Chyba převodu na řeč',
                description: 'Nepodařilo se převést text na řeč.'
            });
            setIsSpeaking(false);
        }
    } catch (e) {
        setIsSpeaking(false);
    }
  };

  const memoizedImage = useMemo(() => (
    <Image src={imageSrc} alt={t('title')} fill objectFit="cover" />
  ), [imageSrc, t]);
  
  const defaultLanguage = languageList.find(l => l.value.toLowerCase().startsWith(locale))?.value || 'Czech';

  return (
    <motion.div 
      className="absolute inset-0 bg-black/60 backdrop-blur-md z-10 flex flex-col items-center justify-end p-4 gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
        <Button variant="ghost" size="icon" className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/30 text-white" onClick={onBack}>
            <X className="h-5 w-5" />
        </Button>
        <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-sm"
        >
            <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border-2 border-white/50 shadow-2xl">
              {memoizedImage}
            </div>
        </motion.div>

        <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="w-full max-w-sm bg-background/80 backdrop-blur-lg p-4 rounded-xl border border-white/10"
        >
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
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-accent-foreground flex items-center gap-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-accent"/>
                          {t('translation_result_title')}
                      </h3>
                      <p className="text-sm text-foreground">{state.translatedText}</p>
                    </div>
                    <Button
                        onClick={handleSpeak}
                        disabled={isSpeaking}
                        variant="ghost"
                        size="icon"
                        className="text-accent-foreground shrink-0"
                    >
                        {isSpeaking ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Volume2 className="h-5 w-5" />
                        )}
                    </Button>
                  </div>
              </div>
            )}
        </motion.div>
    </motion.div>
  );
}
