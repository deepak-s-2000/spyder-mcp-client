import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { builtinModules } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function bundle() {
  try {
    // Bundle the CLI into a single file
    await esbuild.build({
      entryPoints: [join(__dirname, '../dist/index.js')],
      bundle: true,
      platform: 'node',
      target: 'node20',
      outfile: join(__dirname, '../dist/spydermcp-bundle.cjs'),
      format: 'cjs',
      external: [
        // External native modules that can't be bundled
        'mongodb-client-encryption'
      ],
      minify: false, // Keep readable for debugging
      sourcemap: false
    });

    console.log('✓ CLI bundled successfully to dist/spydermcp-bundle.cjs');
  } catch (error) {
    console.error('✗ Bundle failed:', error);
    process.exit(1);
  }
}

bundle();
