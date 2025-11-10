'use server';

import { realTimeTextTranslation } from '@/ai/flows/real-time-text-translation';
import { objectIdentification } from '@/ai/flows/object-identification';
import { z } from 'zod';

const translationFormSchema = z.object({
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
  const validatedFields = translationFormSchema.safeParse({
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

const objectIdFormSchema = z.object({
  photoDataUri: z.string().min(1, { message: 'Image data is required.' }),
});

export async function identifyObject(photoDataUri: string) {
    const validatedFields = objectIdFormSchema.safeParse({ photoDataUri });
    if (!validatedFields.success) {
        return { error: 'Invalid data' };
    }
    try {
        const result = await objectIdentification({ photoDataUri });
        return { identifiedObject: result.identifiedObject };
    } catch (error) {
        console.error('Object ID failed', error);
        return { error: 'AI object identification failed.' };
    }
}
