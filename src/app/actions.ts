'use server';

import { realTimeTextTranslation } from '@/ai/flows/real-time-text-translation';
import { z } from 'zod';

const formSchema = z.object({
  photoDataUri: z.string().min(1, { message: 'Image data is required.' }),
  targetLanguage: z.string().min(1, { message: 'Target language is required.' }),
});

type TranslationState = {
  message: string;
  translatedText?: string;
  errors?: {
    photoDataUri?: string[];
    targetLanguage?: string[];
  };
}

export async function getTranslation(prevState: TranslationState, formData: FormData): Promise<TranslationState> {
  const validatedFields = formSchema.safeParse({
    photoDataUri: formData.get('photoDataUri'),
    targetLanguage: formData.get('targetLanguage'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Invalid form data.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const { photoDataUri, targetLanguage } = validatedFields.data;
    const result = await realTimeTextTranslation({ photoDataUri, targetLanguage });
    return {
      message: 'success',
      translatedText: result.translatedText,
    };
  } catch (error) {
    console.error('Translation failed:', error);
    return {
      message: 'AI translation failed. Please check the console for more details.',
    };
  }
}
