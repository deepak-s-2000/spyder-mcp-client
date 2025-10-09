#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { McpClient } from './mcpClient.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { McpConfigManager } from './commands/mcpCommand.js';
import { AutoUpdater } from './autoUpdater.js';
// Version is injected during build
const currentVersion = process.env.SPYDERMCP_VERSION || '1.0.1';

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
  // Check for updates in the background (non-blocking)
  const updater = new AutoUpdater(currentVersion);
  // Auto-update if new version available
  updater.checkAndUpdate().catch(() => {
    // Silently fail - don't interrupt user
  });

  // Check for version flag
  const args = process.argv.slice(2);
  if (args.includes('--version') || args.includes('-v')) {
    console.log(`spydermcp v${currentVersion}`);
    return;
  }

  // Check if this is an MCP config command
  if (args[0] === 'mcp') {
    await runMcpCommand();
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
      default: process.env.SPYDERMCP_CLOUD_URL || 'http://localhost:3001',
      description: 'URL of the cloud server (env: SPYDERMCP_CLOUD_URL)'
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
      default: process.env.SPYDERMCP_CLOUD_URL || 'http://localhost:3001',
      description: 'URL of the cloud server (env: SPYDERMCP_CLOUD_URL)'
    })
    .option('apiKey', {
      type: 'string',
      default: process.env.SPYDERMCP_API_KEY,
      description: 'API key for cloud server authentication (env: SPYDERMCP_API_KEY)'
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

async function runMcpCommand() {
  const manager = new McpConfigManager();
  const args = process.argv.slice(3); // Skip 'node', script name, and 'mcp'

  await yargs(args)
    .command(
      'add <subcommand>',
      'Add MCP server configuration',
      (yargs) => {
        return yargs
          .command(
            'json <name>',
            'Generate JSON configuration for Claude Desktop',
            (yargs) => {
              return yargs
                .positional('name', {
                  describe: 'Name for this MCP server configuration',
                  type: 'string',
                  demandOption: true
                })
                .option('server', {
                  alias: 's',
                  type: 'string',
                  demandOption: true,
                  description: 'MCP server name (e.g., mongodb-mcp-server)'
                })
                .option('cloudUrl', {
                  alias: 'c',
                  type: 'string',
                  description: 'Cloud server URL',
                  default: process.env.SPYDERMCP_CLOUD_URL || 'http://localhost:3001'
                })
                .option('connectionString', {
                  type: 'string',
                  description: 'MongoDB connection string'
                })
                .option('write', {
                  alias: 'w',
                  type: 'boolean',
                  description: 'Write directly to Claude Desktop config file',
                  default: false
                })
                .option('force', {
                  alias: 'f',
                  type: 'boolean',
                  description: 'Overwrite existing server configuration',
                  default: false
                });
            },
            async (argv) => {
              const { name, server, cloudUrl, write, force, ...serverArgs } = argv;

              // Filter out yargs internal properties
              const filteredArgs: Record<string, any> = {};
              for (const [key, value] of Object.entries(serverArgs)) {
                if (key !== '_' && key !== '$0' && key !== 'subcommand' && value !== undefined) {
                  filteredArgs[key] = value;
                }
              }

              if (write) {
                // Write directly to config file
                try {
                  await manager.addServer(
                    name as string,
                    server as string,
                    filteredArgs,
                    cloudUrl as string,
                    undefined,
                    force as boolean
                  );
                  console.log(`✓ Successfully added MCP server '${name}' to Claude Desktop config`);
                  console.log(`  Restart Claude Desktop to use the new server.`);
                } catch (error) {
                  console.error(`✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  process.exit(1);
                }
              } else {
                // Just output the JSON configuration
                const json = manager.generateClaudeConfig(
                  name as string,
                  server as string,
                  filteredArgs,
                  cloudUrl as string
                );
                console.log('\nAdd this to your Claude Desktop configuration:');
                console.log('================================================================================');
                console.log(json);
                console.log('================================================================================\n');
                console.log('Configuration file location:');
                const configPath = manager['getDefaultConfigPath']();
                console.log(`  ${configPath}\n`);
                console.log('Tip: Use --write flag to automatically update the config file');
              }
            }
          )
          .demandCommand(1, 'Specify a subcommand: json');
      }
    )
    .command(
      'list',
      'List all configured MCP servers',
      () => {},
      async () => {
        try {
          const servers = await manager.listServers();

          if (Object.keys(servers).length === 0) {
            console.log('No MCP servers configured in Claude Desktop.');
            return;
          }

          console.log('\nConfigured MCP servers in Claude Desktop:');
          console.log('================================================================================');
          for (const [name, config] of Object.entries(servers)) {
            console.log(`\n${name}:`);
            console.log(`  Command: ${config.command}`);
            console.log(`  Args: ${config.args.join(' ')}`);
            if (config.env) {
              console.log(`  Env: ${JSON.stringify(config.env)}`);
            }
          }
          console.log('\n================================================================================\n');
        } catch (error) {
          console.error(`✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          process.exit(1);
        }
      }
    )
    .demandCommand(1, 'You must specify a command (add, list)')
    .help()
    .argv;
}

main().catch(console.error);