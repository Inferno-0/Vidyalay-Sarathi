'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a personalized welcome message when a known face is detected.
 *
 * - generateWelcomeNotification - A function that generates a welcome notification for a detected face.
 * - GenerateWelcomeNotificationInput - The input type for the generateWelcomeNotification function.
 * - GenerateWelcomeNotificationOutput - The return type for the generateWelcomeNotification function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWelcomeNotificationInputSchema = z.object({
  name: z.string().describe('The name of the detected person.'),
});
export type GenerateWelcomeNotificationInput = z.infer<typeof GenerateWelcomeNotificationInputSchema>;

const GenerateWelcomeNotificationOutputSchema = z.object({
  welcomeMessage: z.string().describe('A personalized welcome message for the detected person.'),
});
export type GenerateWelcomeNotificationOutput = z.infer<typeof GenerateWelcomeNotificationOutputSchema>;

export async function generateWelcomeNotification(
  input: GenerateWelcomeNotificationInput
): Promise<GenerateWelcomeNotificationOutput> {
  return generateWelcomeNotificationFlow(input);
}

const welcomePrompt = ai.definePrompt({
  name: 'welcomePrompt',
  input: {schema: GenerateWelcomeNotificationInputSchema},
  output: {schema: GenerateWelcomeNotificationOutputSchema},
  prompt: `You are a friendly assistant that greets people by name.\n\nGenerate a short and welcoming message for {{name}}.`,
});

const generateWelcomeNotificationFlow = ai.defineFlow(
  {
    name: 'generateWelcomeNotificationFlow',
    inputSchema: GenerateWelcomeNotificationInputSchema,
    outputSchema: GenerateWelcomeNotificationOutputSchema,
  },
  async input => {
    const {output} = await welcomePrompt(input);
    return output!;
  }
);
