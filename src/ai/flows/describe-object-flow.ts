'use server';

/**
 * @fileOverview An AI agent that describes objects.
 *
 * - describeObject - A function that handles the object description process.
 * - DescribeObjectInput - The input type for the describeObject function.
 * - DescribeObjectOutput - The return type for the describeObject function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DescribeObjectInputSchema = z.object({
  objectName: z.string().describe('The name of the object to describe.'),
  targetLanguage: z.string().default('Czech').describe('The language for the description.'),
});
export type DescribeObjectInput = z.infer<typeof DescribeObjectInputSchema>;

const DescribeObjectOutputSchema = z.object({
  description: z.string().describe('A short, one-paragraph description of the object.'),
});
export type DescribeObjectOutput = z.infer<typeof DescribeObjectOutputSchema>;

export async function describeObject(input: DescribeObjectInput): Promise<DescribeObjectOutput> {
  return describeObjectFlow(input);
}

const prompt = ai.definePrompt({
  name: 'describeObjectPrompt',
  input: {schema: DescribeObjectInputSchema},
  output: {schema: DescribeObjectOutputSchema},
  prompt: `You are a helpful assistant. Provide a short, one-paragraph description of the following object: {{{objectName}}}. The description should be in {{{targetLanguage}}}.`,
});

const describeObjectFlow = ai.defineFlow(
  {
    name: 'describeObjectFlow',
    inputSchema: DescribeObjectInputSchema,
    outputSchema: DescribeObjectOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);