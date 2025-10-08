#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';

interface McpServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

interface McpConfig {
  mcpServers: Record<string, McpServerConfig>;
}

export class McpConfigManager {
  private getDefaultConfigPath(): string {
    const platform = os.platform();

    if (platform === 'darwin') {
      return path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
    } else if (platform === 'win32') {
      return path.join(os.homedir(), 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json');
    } else {
      // Linux
      return path.join(os.homedir(), '.config', 'Claude', 'claude_desktop_config.json');
    }
  }

  /**
   * Generate MCP server configuration JSON
   */
  generateConfig(
    serverName: string,
    mcpServerName: string,
    args: Record<string, any>,
    cloudUrl?: string
  ): McpServerConfig {
    const commandArgs: string[] = [
      '--server', mcpServerName
    ];

    // Add cloud URL if provided
    if (cloudUrl) {
      commandArgs.push('--cloudUrl', cloudUrl);
    }

    // Add all server-specific arguments
    for (const [key, value] of Object.entries(args)) {
      if (value !== undefined && value !== null && value !== '') {
        // Convert camelCase to kebab-case for CLI args
        const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        commandArgs.push(`--${kebabKey}`);

        if (typeof value === 'boolean') {
          // Boolean flags don't need a value
          continue;
        } else if (Array.isArray(value)) {
          // Arrays: add each value separately
          value.forEach(v => commandArgs.push(String(v)));
        } else {
          commandArgs.push(String(value));
        }
      }
    }

    return {
      command: 'spydermcp',  // Assumes spydermcp is globally installed
      args: commandArgs
    };
  }

  /**
   * Generate complete configuration block for Claude Desktop
   */
  generateClaudeConfig(
    serverName: string,
    mcpServerName: string,
    args: Record<string, any>,
    cloudUrl?: string
  ): string {
    const config = this.generateConfig(serverName, mcpServerName, args, cloudUrl);

    const fullConfig = {
      mcpServers: {
        [serverName]: config
      }
    };

    return JSON.stringify(fullConfig, null, 2);
  }

  /**
   * Read existing Claude Desktop config
   */
  async readConfig(configPath?: string): Promise<McpConfig | null> {
    const targetPath = configPath || this.getDefaultConfigPath();

    try {
      const content = await fs.readFile(targetPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Write/Update Claude Desktop config
   */
  async writeConfig(config: McpConfig, configPath?: string): Promise<void> {
    const targetPath = configPath || this.getDefaultConfigPath();

    // Ensure directory exists
    await fs.mkdir(path.dirname(targetPath), { recursive: true });

    // Write config with pretty formatting
    await fs.writeFile(targetPath, JSON.stringify(config, null, 2), 'utf-8');
  }

  /**
   * Add a new MCP server to the config
   */
  async addServer(
    serverName: string,
    mcpServerName: string,
    args: Record<string, any>,
    cloudUrl?: string,
    configPath?: string,
    force: boolean = false
  ): Promise<void> {
    const config = await this.readConfig(configPath) || { mcpServers: {} };

    // Check if server already exists
    if (config.mcpServers[serverName] && !force) {
      throw new Error(`Server '${serverName}' already exists. Use --force to overwrite.`);
    }

    // Generate and add new server config
    config.mcpServers[serverName] = this.generateConfig(serverName, mcpServerName, args, cloudUrl);

    // Write back to file
    await this.writeConfig(config, configPath);
  }

  /**
   * Remove an MCP server from the config
   */
  async removeServer(serverName: string, configPath?: string): Promise<void> {
    const config = await this.readConfig(configPath);

    if (!config || !config.mcpServers[serverName]) {
      throw new Error(`Server '${serverName}' not found in config.`);
    }

    delete config.mcpServers[serverName];

    await this.writeConfig(config, configPath);
  }

  /**
   * List all configured MCP servers
   */
  async listServers(configPath?: string): Promise<Record<string, McpServerConfig>> {
    const config = await this.readConfig(configPath);
    return config?.mcpServers || {};
  }
}

// CLI interface
async function main() {
  const manager = new McpConfigManager();

  await yargs(hideBin(process.argv))
    .command(
      'add <name>',
      'Add a new MCP server configuration',
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
          .option('config-path', {
            type: 'string',
            description: 'Path to Claude Desktop config file (auto-detected if not specified)'
          })
          .option('json-only', {
            alias: 'j',
            type: 'boolean',
            description: 'Output JSON only without writing to config file',
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
        const { name, server, cloudUrl, jsonOnly, configPath, force, ...serverArgs } = argv;

        // Filter out yargs internal properties
        const filteredArgs: Record<string, any> = {};
        for (const [key, value] of Object.entries(serverArgs)) {
          if (key !== '_' && key !== '$0' && value !== undefined) {
            filteredArgs[key] = value;
          }
        }

        if (jsonOnly) {
          // Just output the JSON configuration
          const json = manager.generateClaudeConfig(
            name as string,
            server as string,
            filteredArgs,
            cloudUrl as string
          );
          console.log('\nCopy this configuration to your Claude Desktop config file:');
          console.log('================================================================================');
          console.log(json);
          console.log('================================================================================\n');
          console.log('Configuration file location:');
          console.log(`  ${configPath || manager['getDefaultConfigPath']()}\n`);
        } else {
          // Add to config file
          try {
            await manager.addServer(
              name as string,
              server as string,
              filteredArgs,
              cloudUrl as string,
              configPath as string | undefined,
              force as boolean
            );
            console.log(`✓ Successfully added MCP server '${name}' to config`);
            console.log(`  Config file: ${configPath || manager['getDefaultConfigPath']()}`);
          } catch (error) {
            console.error(`✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            process.exit(1);
          }
        }
      }
    )
    .command(
      'remove <name>',
      'Remove an MCP server configuration',
      (yargs) => {
        return yargs
          .positional('name', {
            describe: 'Name of the MCP server to remove',
            type: 'string',
            demandOption: true
          })
          .option('config-path', {
            type: 'string',
            description: 'Path to Claude Desktop config file'
          });
      },
      async (argv) => {
        try {
          await manager.removeServer(argv.name, argv.configPath);
          console.log(`✓ Successfully removed MCP server '${argv.name}' from config`);
        } catch (error) {
          console.error(`✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          process.exit(1);
        }
      }
    )
    .command(
      'list',
      'List all configured MCP servers',
      (yargs) => {
        return yargs.option('config-path', {
          type: 'string',
          description: 'Path to Claude Desktop config file'
        });
      },
      async (argv) => {
        try {
          const servers = await manager.listServers(argv.configPath);

          if (Object.keys(servers).length === 0) {
            console.log('No MCP servers configured.');
            return;
          }

          console.log('\nConfigured MCP servers:');
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
    .demandCommand(1, 'You must specify a command (add, remove, or list)')
    .help()
    .argv;
}

// Note: CLI execution is handled by index.ts via runMcpCommand()
// This file only exports the McpConfigManager class

export default McpConfigManager;
