'use server';

/**
 * @fileOverview An AI agent that identifies an object and provides a description.
 *
 * - getArObjectDetails - A function that handles the object identification and description process.
 * - ArObjectDetailsInput - The input type for the getArObjectDetails function.
 * - ArObjectDetailsOutput - The return type for the getArObjectDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ArObjectDetailsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of an object to identify, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
    targetLanguage: z.string().default('Czech').describe('The language for the object name and description.'),
});
export type ArObjectDetailsInput = z.infer<typeof ArObjectDetailsInputSchema>;

const ArObjectDetailsOutputSchema = z.object({
  objectName: z.string().describe('The name of the identified object.'),
  description: z.string().describe('A short, one-paragraph description of the object.'),
});
export type ArObjectDetailsOutput = z.infer<typeof ArObjectDetailsOutputSchema>;

export async function getArObjectDetails(input: ArObjectDetailsInput): Promise<ArObjectDetailsOutput> {
  return getArObjectDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getArObjectDetailsPrompt',
  input: {schema: ArObjectDetailsInputSchema},
  output: {schema: ArObjectDetailsOutputSchema},
  prompt: `You are an object identification AI. You will be given an image of an object.
1. Identify the main object in the image.
2. Provide a short, one-paragraph description of that object.
3. Translate both the object name and the description into the specified language.

Image: {{media url=photoDataUri}}
Target Language: {{{targetLanguage}}}
`,
});

const getArObjectDetailsFlow = ai.defineFlow(
  {
    name: 'getArObjectDetailsFlow',
    inputSchema: ArObjectDetailsInputSchema,
    outputSchema: ArObjectDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);