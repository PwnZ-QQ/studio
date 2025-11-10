'use client';

import { useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useFormState, useFormStatus } from 'react-dom';
import { getTranslation } from '@/app/actions';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Loader2, X, Languages, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TranslationViewProps {
  imageSrc: string;
  onBack: () => void;
}

const languages = [
  { value: 'Spanish', label: 'Spanish' },
  { value: 'French', label: 'French' },
  { value: 'German', label: 'German' },
  { value: 'Japanese', label: 'Japanese' },
  { value: 'Chinese', label: 'Chinese' },
  { value: 'Russian', label: 'Russian' },
  { value: 'Arabic', label: 'Arabic' },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Languages className="mr-2 h-4 w-4" />}
      Translate Text
    </Button>
  );
}

export default function TranslationView({ imageSrc, onBack }: TranslationViewProps) {
  const initialState = { message: '', translatedText: '' };
  const [state, dispatch] = useFormState(getTranslation, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.message && state.message !== 'success') {
      toast({
        variant: "destructive",
        title: "Translation Error",
        description: state.message,
      });
    }
  }, [state, toast]);

  const memoizedImage = useMemo(() => (
    <Image src={imageSrc} alt="Captured for translation" layout="fill" objectFit="contain" />
  ), [imageSrc]);

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-10 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm h-[95%] flex flex-col">
        <CardHeader className="relative">
          <CardTitle>Translate Image</CardTitle>
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
            <Select name="targetLanguage" defaultValue="Spanish" required>
              <SelectTrigger>
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map(lang => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
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
                    Translation Result
                </h3>
                <p className="text-sm text-foreground">{state.translatedText}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
