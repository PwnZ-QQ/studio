'use server';

/**
 * @fileOverview An object identification AI agent.
 *
 * - objectIdentification - A function that handles the object identification process.
 * - ObjectIdentificationInput - The input type for the objectIdentification function.
 * - ObjectIdentificationOutput - The return type for the objectIdentification function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ObjectIdentificationInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of an object to identify, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ObjectIdentificationInput = z.infer<typeof ObjectIdentificationInputSchema>;

const ObjectIdentificationOutputSchema = z.object({
  identifiedObject: z.string().describe('The name of the identified object.'),
});
export type ObjectIdentificationOutput = z.infer<typeof ObjectIdentificationOutputSchema>;

export async function objectIdentification(input: ObjectIdentificationInput): Promise<ObjectIdentificationOutput> {
  return objectIdentificationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'objectIdentificationPrompt',
  input: {schema: ObjectIdentificationInputSchema},
  output: {schema: ObjectIdentificationOutputSchema},
  prompt: `You are an object identification AI. You will be given an image of an object. You will identify the object in the image and return its name.

Identify the object in the following image.

Image: {{media url=photoDataUri}}
`,
});

const objectIdentificationFlow = ai.defineFlow(
  {
    name: 'objectIdentificationFlow',
    inputSchema: ObjectIdentificationInputSchema,
    outputSchema: ObjectIdentificationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
