import { TwitterProvider } from '../providers/twitter';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const scriptDir = dirname(__filename);

async function runTest() {
  try {
    console.log('Reading config from:', join(scriptDir, '../../test-config.json'));
    const config = JSON.parse(
      readFileSync(join(scriptDir, '../../test-config.json'), 'utf-8')
    );
    console.log('Config loaded:', config);

    console.log('Creating Twitter provider...');
    const provider = new TwitterProvider();
    console.log('Provider created');

    const mockRuntime = {
      getSetting: (key) => {
        const value = config.settings[key];
        console.log(`Getting setting ${key}:`, value);
        return value;
      },
      setSetting: async () => {},
      logger: console,
      providers: {
        get: (name) => {
          throw new Error('Provider not found: ' + name);
        }
      },
      memory: {
        store: async (data) => {
          console.log('Stored data:', JSON.stringify(data, null, 2));
        }
      }
    };

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

    console.log('Getting safety stats...');
    const stats = await provider.getSafetyReport();
    console.log('Safety stats:', JSON.stringify(stats, null, 2));

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
