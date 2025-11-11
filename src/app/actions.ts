'use server';

import { realTimeTextTranslation } from '@/ai/flows/real-time-text-translation';
import { getArObjectDetails } from '@/ai/flows/get-ar-object-details';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { z } from 'zod';
import { headers } from 'next/headers';

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
  objectName: z.string().min(1, { message: 'Object name is required.' }),
});

export async function identifyObject(objectName: string) {
    const headersList = headers();
    const referer = headersList.get('referer');
    const locale = referer?.split('/')[3] || 'cs';
    const targetLanguage = locale === 'cs' ? 'Czech' : 'English';

    const validatedFields = objectIdFormSchema.safeParse({ objectName });
    if (!validatedFields.success) {
        return { error: 'Invalid data' };
    }

    try {
        const result = await getArObjectDetails({ objectName, targetLanguage });
        return {
            description: result.description,
        };
    } catch (error) {
        console.error('AR object details failed', error);
        return { 
            description: 'Could not get a description for this object.',
            error: 'AI object description failed.' 
        };
    }
}

const textToSpeechSchema = z.object({
  text: z.string(),
});

export async function textToSpeechAction(text: string): Promise<{ audio: string } | { error: string }> {
    const validatedFields = textToSpeechSchema.safeParse({ text });

    if (!validatedFields.success) {
        return { error: 'Invalid data' };
    }

    try {
        const result = await textToSpeech({ text: validatedFields.data.text });
        return { audio: result.audio };
    } catch (error) {
        console.error('Text-to-speech failed', error);
        return { error: 'Text-to-speech conversion failed.' };
    }
}
