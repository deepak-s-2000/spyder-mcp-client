import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function bundle() {
  try {
    // Read package.json to get version
    const packageJson = JSON.parse(
      readFileSync(join(__dirname, '../package.json'), 'utf-8')
    );

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
      define: {
        'process.env.SPYDERMCP_VERSION': JSON.stringify(packageJson.version)
      },
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
