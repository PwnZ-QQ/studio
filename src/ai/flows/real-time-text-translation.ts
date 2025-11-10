'use server';

/**
 * @fileOverview A real-time text translation AI agent.
 *
 * - realTimeTextTranslation - A function that handles the real-time text translation process.
 * - RealTimeTextTranslationInput - The input type for the realTimeTextTranslation function.
 * - RealTimeTextTranslationOutput - The return type for the realTimeTextTranslation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RealTimeTextTranslationInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of text to translate, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  targetLanguage: z.string().describe('The target language to translate the text to.'),
});
export type RealTimeTextTranslationInput = z.infer<typeof RealTimeTextTranslationInputSchema>;

const RealTimeTextTranslationOutputSchema = z.object({
  translatedText: z.string().describe('The translated text.'),
});
export type RealTimeTextTranslationOutput = z.infer<typeof RealTimeTextTranslationOutputSchema>;

export async function realTimeTextTranslation(input: RealTimeTextTranslationInput): Promise<RealTimeTextTranslationOutput> {
  return realTimeTextTranslationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'realTimeTextTranslationPrompt',
  input: {schema: RealTimeTextTranslationInputSchema},
  output: {schema: RealTimeTextTranslationOutputSchema},
  prompt: `You are a real-time text translation AI. You will be given an image of text and a target language. You will translate the text in the image to the target language and return the translated text.

Translate the text in the following image to {{{targetLanguage}}}.

Image: {{media url=photoDataUri}}
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
