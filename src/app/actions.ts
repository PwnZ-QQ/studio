'use server';

import { realTimeTextTranslation } from '@/ai/flows/real-time-text-translation';
import { objectIdentification } from '@/ai/flows/object-identification';
import { describeObject } from '@/ai/flows/describe-object-flow';
import { getArObjectDetails } from '@/ai/flows/get-ar-object-details';
import { textToSpeech } from '@/ai/flows/text-to-speech';
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

export async function identifyObject(photoDataUri: string, objectNameFromClient?: string) {
    const headersList = headers();
    const referer = headersList.get('referer');
    const locale = referer?.split('/')[3] || 'cs';
    const targetLanguage = locale === 'cs' ? 'Czech' : 'English';

    let objectNameToDescribe = objectNameFromClient;

    if (!objectNameToDescribe) {
        const validatedFields = objectIdFormSchema.safeParse({ photoDataUri });
        if (!validatedFields.success) {
            return { error: 'Invalid data' };
        }
        try {
            const identificationResult = await objectIdentification({ photoDataUri, targetLanguage });
            objectNameToDescribe = identificationResult.identifiedObject;
        } catch (error) {
            console.error('Object identification from image failed', error);
            // We can still proceed without a name, description will also fail, but the snapshot view will be shown
        }
    }

    if (!objectNameToDescribe) {
        return { 
            identifiedObject: 'Object not identified', 
            description: 'Could not identify an object in the snapshot.', 
        };
    }

    try {
        const descriptionResult = await describeObject({ objectName: objectNameToDescribe, targetLanguage });
        return {
            identifiedObject: objectNameToDescribe,
            description: descriptionResult.description,
        };
    } catch (error) {
        console.error('Object description failed', error);
        return { 
            identifiedObject: objectNameToDescribe, 
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
