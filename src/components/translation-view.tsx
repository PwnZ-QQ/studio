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

interface TranslationViewProps {
  imageSrc: string;
  onBack: () => void;
}

const languages = [
  { value: 'Czech', label: 'Čeština' },
  { value: 'Spanish', label: 'Španělština' },
  { value: 'French', label: 'Francouzština' },
  { value: 'German', label: 'Němčina' },
  { value: 'Japanese', label: 'Japonština' },
  { value: 'Chinese', label: 'Čínština' },
  { value: 'Russian', label: 'Ruština' },
  { value: 'Arabic', label: 'Arabština' },
  { value: 'English', label: 'Angličtina' },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Languages className="mr-2 h-4 w-4" />}
      Přeložit text
    </Button>
  );
}

export default function TranslationView({ imageSrc, onBack }: TranslationViewProps) {
  const initialState = { message: '', translatedText: '' };
  const [state, dispatch] = useActionState(getTranslation, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.message && state.message !== 'success') {
      toast({
        variant: "destructive",
        title: "Chyba překladu",
        description: state.message,
      });
    }
  }, [state, toast]);

  const memoizedImage = useMemo(() => (
    <Image src={imageSrc} alt="Snímek k překladu" fill objectFit="contain" />
  ), [imageSrc]);

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-10 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm h-[95%] flex flex-col">
        <CardHeader className="relative">
          <CardTitle>Přeložit obrázek</CardTitle>
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
            <Select name="targetLanguage" defaultValue="Czech" required>
              <SelectTrigger>
                <SelectValue placeholder="Vyberte jazyk" />
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
                    Výsledek překladu
                </h3>
                <p className="text-sm text-foreground">{state.translatedText}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
