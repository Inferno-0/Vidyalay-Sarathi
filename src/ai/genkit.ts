import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
    plugins: [googleAI()],
    devTool: process.env.NODE_ENV !== 'production'
});
