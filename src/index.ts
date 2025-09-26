#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { McpClient } from './mcpClient.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// All supported MongoDB MCP server arguments (from original config.ts)
const MONGODB_OPTIONS = {
  string: [
    'apiBaseUrl', 'apiClientId', 'apiClientSecret', 'connectionString',
    'httpHost', 'httpPort', 'idleTimeoutMs', 'logPath', 'notificationTimeoutMs',
    'telemetry', 'transport', 'apiVersion', 'authenticationDatabase',
    'authenticationMechanism', 'browser', 'db', 'gssapiHostName',
    'gssapiServiceName', 'host', 'oidcFlows', 'oidcRedirectUri', 'password',
    'port', 'sslCAFile', 'sslCRLFile', 'sslCertificateSelector',
    'sslDisabledProtocols', 'sslPEMKeyFile', 'sslPEMKeyPassword',
    'sspiHostnameCanonicalization', 'sspiRealmOverride', 'tlsCAFile',
    'tlsCRLFile', 'tlsCertificateKeyFile', 'tlsCertificateKeyFilePassword',
    'tlsCertificateSelector', 'tlsDisabledProtocols', 'username'
  ],
  boolean: [
    'apiDeprecationErrors', 'apiStrict', 'help', 'indexCheck', 'ipv6',
    'nodb', 'oidcIdTokenAsAccessToken', 'oidcNoNonce', 'oidcTrustedEndpoint',
    'readOnly', 'retryWrites', 'ssl', 'sslAllowInvalidCertificates',
    'sslAllowInvalidHostnames', 'sslFIPSMode', 'tls', 'tlsAllowInvalidCertificates',
    'tlsAllowInvalidHostnames', 'tlsFIPSMode', 'version'
  ],
  array: ['disabledTools', 'loggers']
};

async function main() {
  // Check for GUI flag first
  const args = process.argv.slice(2);
  if (args.includes('--gui')) {
    console.log('Launching SpyderMCP GUI...');
    console.log('Please use: npm run electron');
    console.log('Or use the electron binary directly: electron dist/electron-main.js');
    return;
  }

  // First, get the server name (required by our client)
  const initialArgv = await yargs(hideBin(process.argv))
    .option('server', {
      type: 'string',
      demandOption: true,
      description: 'The MCP server name to proxy (e.g., mongodb-mcp-server)'
    })
    .option('cloudUrl', {
      type: 'string',
      default: 'http://localhost:3001',
      description: 'URL of the cloud server'
    })
    .option('gui', {
      type: 'boolean',
      description: 'Launch GUI interface'
    })
    .help()
    .parse();

  // Now parse ALL arguments including MongoDB-specific ones
  let yargsBuilder = yargs(hideBin(process.argv))
    .option('server', {
      type: 'string',
      demandOption: true,
      description: 'The MCP server name to proxy (e.g., mongodb-mcp-server)'
    })
    .option('cloudUrl', {
      type: 'string',
      default: 'http://localhost:3001',
      description: 'URL of the cloud server'
    })
    .option('apiKey', {
      type: 'string',
      description: 'API key for cloud server authentication'
    });

  // Add all MongoDB MCP server options
  for (const option of MONGODB_OPTIONS.string) {
    yargsBuilder = yargsBuilder.option(option, {
      type: 'string',
      description: `MongoDB MCP server option: ${option}`
    });
  }
  
  for (const option of MONGODB_OPTIONS.boolean) {
    yargsBuilder = yargsBuilder.option(option, {
      type: 'boolean',
      description: `MongoDB MCP server option: ${option}`
    });
  }
  
  for (const option of MONGODB_OPTIONS.array) {
    yargsBuilder = yargsBuilder.option(option, {
      type: 'array',
      description: `MongoDB MCP server option: ${option}`
    });
  }
  
  const argv = await yargsBuilder.help().parse();

  // Extract server arguments (all arguments except 'server', 'cloudUrl', and 'apiKey')
  const serverArgs: Record<string, any> = {};
  for (const [key, value] of Object.entries(argv)) {
    if (key !== 'server' && key !== 'cloudUrl' && key !== 'apiKey' && key !== '_' && key !== '$0' && value !== undefined) {
      serverArgs[key] = value;
    }
  }

  console.error(`Starting SpyderMCP proxy for server: ${argv.server}`);
  console.error(`Cloud server URL: ${argv.cloudUrl}`);
  console.error(`Server arguments:`, JSON.stringify(serverArgs, null, 2));

  const client = new McpClient({
    serverName: argv.server,
    cloudUrl: argv.cloudUrl,
    serverArgs,
    apiKey: argv.apiKey
  });

  const transport = new StdioServerTransport();
  
  // Handle shutdown gracefully
  const shutdown = () => {
    console.error('Shutting down SpyderMCP...');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  try {
    await client.start(transport);
  } catch (error) {
    console.error('Error starting SpyderMCP:', error);
    process.exit(1);
  }
}

main().catch(console.error);