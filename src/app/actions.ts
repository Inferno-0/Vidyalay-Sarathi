
'use server';

import { generateWelcomeNotification } from '@/ai/flows/generate-welcome-notification';

export async function getWelcomeMessage(name: string): Promise<{ message: string } | { error: string }> {
  if (!name || name.trim() === 'unknown') {
    return { error: 'Cannot generate a welcome message for an unknown person.' };
  }
  
  try {
    const result = await generateWelcomeNotification({ name });
    return { message: result.welcomeMessage };
  } catch (error) {
    console.error('Error generating welcome notification:', error);
    return { error: 'Failed to generate a welcome message.' };
  }
}
