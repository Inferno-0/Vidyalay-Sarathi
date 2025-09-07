
import { GenkitMetric, Traces, genkitPlugin } from 'genkit';
import { Config } from 'genkit/config';

// Note: This is a workaround for the fact that the Genkit CLI
// does not currently support the NextJS integration.
export default {
  plugins: [
    genkitPlugin('p', async () => ({
      traces: {
        async list(query) {
          return {} as Traces;
        },
        async get(id) {
          return null;
        },
      },
      metrics: {
        list() {
          return [] as GenkitMetric[];
        },
        get(id, time) {
          return null;
        },
      },
    })),
  ],
  devTool: false,
} as Config;
