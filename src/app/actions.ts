'use server';

import { realTimeTextTranslation } from '@/ai/flows/real-time-text-translation';
import { objectIdentification } from '@/ai/flows/object-identification';
import { describeObject } from '@/ai/flows/describe-object-flow';
import { getArObjectDetails } from '@/ai/flows/get-ar-object-details';
import { z } from 'zod';
import {NextRequest} from 'next/server';
import {headers} from 'next/headers';

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
        // Use the locale from the request headers to determine the target language.
        const headersList = headers();
        const referer = headersList.get('referer');
        const locale = referer?.split('/')[3] || 'cs';
        const targetLanguage = locale === 'cs' ? 'Czech' : 'English';

        const result = await getArObjectDetails({ photoDataUri, targetLanguage });
        return {
            identifiedObject: result.objectName,
            description: result.description,
        };
    } catch (error) {
        console.error('Object ID or description failed', error);
        return { error: 'AI object identification or description failed.' };
    }
}