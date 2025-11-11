'use server';

/**
 * @fileOverview An AI agent that translates text from an image.
 *
 * - realTimeTextTranslation - A function that handles the text translation process.
 * - RealTimeTextTranslationInput - The input type for the realTimeTextTranslation function.
 * - RealTimeTextTranslationOutput - The return type for the realTimeTextTranslation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RealTimeTextTranslationInputSchema = z.object({
  imageData: z.string().describe('A base64-encoded image of the text to translate.'),
  toLanguage: z.string().describe('The language to translate the text to.'),
});
export type RealTimeTextTranslationInput = z.infer<typeof RealTimeTextTranslationInputSchema>;

const RealTimeTextTranslationOutputSchema = z.object({
    translatedText: z.string().describe('The translated text.'),
});
export type RealTimeTextTranslationOutput = z.infer<typeof RealTimeTextTranslationOutputSchema>;

export async function realTimeTextTranslation(
  input: RealTimeTextTranslationInput
): Promise<RealTimeTextTranslationOutput> {
  return realTimeTextTranslationFlow(input);
}

const prompt = ai.definePrompt({
    name: 'realTimeTextTranslationPrompt',
    input: {schema: RealTimeTextTranslationInputSchema},
    output: {schema: RealTimeTextTranslationOutputSchema},
    prompt: `You are a text translation AI. You will be given an image containing text.
1. Identify the text in the image.
2. Translate the text into the specified language.

Image: {{media url=imageData}}
Translate to: {{{toLanguage}}}
`,
});

const realTimeTextTranslationFlow = ai.defineFlow(
  {
    name: 'realTimeTextTranslationFlow',
    inputSchema: RealTimeTextTranslationInputSchema,
    outputSchema: RealTimeTextTranslationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
