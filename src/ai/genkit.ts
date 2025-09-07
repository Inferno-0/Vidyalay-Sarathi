import {genkit, GenkitMemory, GenkitTracer} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {genkitPlugin} from "genkit";

// Note: This is a workaround for the fact that the Genkit CLI
// does not currently support the NextJS integration.
const noOpPlugin = genkitPlugin('no-op', async () => ({
    traces: {
        async list(query) {
            return {traces: [], nextPageToken: undefined};
        },
        async get(id) {
            return null;
        },
    },
    memory: {
        async list(query) {
            return {conversations: [], nextPageToken: undefined};
        },
        async get(id) {
            return null;
        },
        async delete(id) {
        },
        async create(conversation) {
            return conversation;
        },
        async update(conversation) {
            return conversation;
        }
    }
}));


export const ai = genkit({
    plugins: [googleAI(), noOpPlugin],
    devTool: process.env.NODE_ENV !== 'production'
});