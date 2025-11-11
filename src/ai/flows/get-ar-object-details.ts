'use server';

/**
 * @fileOverview An AI agent that provides a description for a given object.
 *
 * - getArObjectDetails - A function that handles the object description process.
 * - ArObjectDetailsInput - The input type for the getArObjectDetails function.
 * - ArObjectDetailsOutput - The return type for the getArObjectDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const ArObjectDetailsInputSchema = z.object({
  objectName: z.string().describe('The name of the object to describe.'),
  targetLanguage: z.string().default('Czech').describe('The language for the object description.'),
});
export type ArObjectDetailsInput = z.infer<typeof ArObjectDetailsInputSchema>;

const ArObjectDetailsOutputSchema = z.object({
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
  prompt: `You are an object description AI. You will be given the name of an object.
1. Provide a short, one-paragraph description of that object. Use Google Search to find interesting and relevant facts to include in the description.
2. Translate the description into the specified language.

Object Name: {{{objectName}}}
Target Language: {{{targetLanguage}}}
`,
  tools: [googleAI.googleSearchTool],
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
