import { config } from 'dotenv';
config();
import { googleAI } from '@genkit-ai/google-genai';


import '@/ai/flows/real-time-text-translation.ts';
import '@/ai/flows/object-identification.ts';
import '@/ai/flows/describe-object-flow.ts';
import '@/ai/flows/get-ar-object-details.ts';
import '@/ai/flows/text-to-speech.ts';
