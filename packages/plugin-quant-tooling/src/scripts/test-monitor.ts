import { Provider, IAgentRuntime, State } from '@elizaos/core';
import { readFileSync } from 'fs';
import { join } from 'path';

const scriptDir = process.cwd();

async function runTest() {
  try {
    console.log('Reading config from:', join(scriptDir, 'test-config.json'));
    const config = JSON.parse(
      readFileSync(join(scriptDir, 'test-config.json'), 'utf-8')
    );
    console.log('Config loaded:', config);

    // Import dynamically to avoid ESM issues
    const { TwitterProvider } = await import('../providers/twitter');

    console.log('Creating Twitter provider...');
    const provider = new TwitterProvider();
    console.log('Provider created');

    const mockRuntime = {
      getSetting: (key: string) => {
        const value = config.settings[key];
        console.log(`Getting setting ${key}:`, value);
        return value;
      },
      setSetting: async () => {},
      logger: console,
      providers: {
        get: (name: string): Provider => {
          throw new Error('Provider not found: ' + name);
        }
      },
      memory: {
        store: async (data: { type: string; content: any }) => {
          console.log('Stored data:', JSON.stringify(data, null, 2));
        }
      },
      agentId: 'test-agent',
      character: {
        name: 'Test Character',
        templates: {},
        style: {
          voice: 'professional',
          traits: ['analytical', 'precise'],
          interests: ['cryptocurrency', 'trading'],
          personality: 'focused',
          all: [
            'You are a professional crypto analyst',
            'You focus on finding high-quality signals',
            'You are precise and analytical in your assessments'
          ],
          post: [
            'Write in a clear, professional tone',
            'Focus on factual information',
            'Be concise and direct'
          ]
        }
      },
      messageManager: {
        getMemoryById: async () => null,
        createMemory: async () => {},
        getMemoriesByRoomIds: async () => []
      },
      cacheManager: {
        get: async () => null,
        set: async () => {}
      },
      ensureConnection: async () => {},
      composeState: async () => ({}),
      updateRecentMessageState: async (state: any) => state,
      processActions: async () => {},
      getService: () => { throw new Error('Service not found'); },
      ensureUserExists: async () => {}
    } as IAgentRuntime;

    console.log('Validating provider...');
    const isValid = await provider.validate(mockRuntime);
    console.log('Validation result:', isValid);

    if (!isValid) {
      throw new Error('Invalid configuration');
    }

    console.log('Initializing provider...');
    await provider.initialize();
    console.log('Provider initialized');

    console.log('Running handler...');
    const result = await provider.handler(mockRuntime);
    console.log('Results:', JSON.stringify(result, null, 2));

    // Let it run for a minute to collect some data
    console.log('Waiting 60 seconds to collect data...');
    await new Promise(resolve => setTimeout(resolve, 60000));

    process.exit(0);
  } catch (error) {
    console.error('Test failed with error:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  }
}

runTest().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});