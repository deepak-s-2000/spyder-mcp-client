import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { CloudServerClient } from './cloudServerClient.js';
import { VendorExecutor } from './vendorExecutor.js';
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema,
  Tool,
  CallToolResult,
  CallToolRequest
} from '@modelcontextprotocol/sdk/types.js';

export interface McpClientConfig {
  serverName: string;
  cloudUrl: string;
  serverArgs: Record<string, any>;
  apiKey?: string;
}

export interface CloudServerTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface CloudServerResponse {
  success: boolean;
  error?: string;
  tools?: CloudServerTool[];
  result?: any;
  vendorInstructions?: VendorInstruction[];
}

export interface VendorInstruction {
  type: 'mongodb' | 'postgresql' | 'mysql' | 'http';
  operation: string;
  parameters: any;
  connectionString?: string;
}

export class McpClient {
  private server: McpServer;
  private cloudClient: CloudServerClient;
  private vendorExecutor: VendorExecutor;
  private tools: Tool[] = [];
  private config: McpClientConfig;

  constructor(config: McpClientConfig) {
    this.config = config;
    this.server = new McpServer({
      name: `${config.serverName}-client`,
      version: '1.0.0'
    }, {
      capabilities: {
        tools: {}
      }
    });

    this.cloudClient = new CloudServerClient(config.cloudUrl, config.apiKey);
    this.vendorExecutor = new VendorExecutor();

    this.setupHandlers();
  }

  private setupHandlers() {
    // Handle list tools request
    this.server.server.setRequestHandler(ListToolsRequestSchema, async () => {
      console.error('Fetching tools from cloud server...');
      
      try {
        const response = await this.cloudClient.listTools(
          this.config.serverName,
          this.config.serverArgs
        );

        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch tools from cloud server');
        }

        this.tools = (response.tools || []).map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
        }));

        console.error(`Loaded ${this.tools.length} tools from cloud server`);
        return { tools: this.tools };
      } catch (error) {
        console.error('Error fetching tools:', error);
        return { tools: [] };
      }
    });

    // Handle call tool request
    this.server.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest): Promise<CallToolResult> => {
      const { name, arguments: args } = request.params;
      
      console.error(`Calling tool: ${name} with args:`, args);
      
      try {
        // Call the cloud server with the tool request
        const response = await this.cloudClient.callTool(
          this.config.serverName,
          this.config.serverArgs,
          name,
          args || {}
        );

        if (!response.success) {
          return {
            content: [{
              type: 'text',
              text: `Error: ${response.error || 'Unknown error'}`
            }],
            isError: true
          };
        }

        // If there are vendor instructions, execute them locally
        if (response.vendorInstructions && response.vendorInstructions.length > 0) {
          console.error(`Executing ${response.vendorInstructions.length} vendor instructions...`);
          
          const vendorResults = [];
          for (const instruction of response.vendorInstructions) {
            try {
              const result = await this.vendorExecutor.execute(instruction);
              vendorResults.push(result);
            } catch (error) {
              console.error('Vendor instruction error:', error);
              vendorResults.push({ 
                error: error instanceof Error ? error.message : 'Unknown error' 
              });
            }
          }

          // Send the vendor results back to the cloud server to get the final response
          const finalResponse = await this.cloudClient.processVendorResults(
            this.config.serverName,
            this.config.serverArgs,
            name,
            args || {},
            vendorResults
          );

          if (!finalResponse.success) {
            return {
              content: [{
                type: 'text',
                text: `Error processing vendor results: ${finalResponse.error || 'Unknown error'}`
              }],
              isError: true
            };
          }

          return {
            content: [{
              type: 'text',
              text: typeof finalResponse.result === 'string' 
                ? finalResponse.result 
                : JSON.stringify(finalResponse.result, null, 2)
            }]
          };
        }

        // No vendor instructions, return the cloud server result directly
        return {
          content: [{
            type: 'text',
            text: typeof response.result === 'string' 
              ? response.result 
              : JSON.stringify(response.result, null, 2)
          }]
        };

      } catch (error) {
        console.error('Error calling tool:', error);
        return {
          content: [{
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    });
  }

  async start(transport: Transport): Promise<void> {
    console.error('Starting MCP client server...');
    await this.server.connect(transport);
    console.error('MCP client server started');
  }

  async stop(): Promise<void> {
    await this.server.close();
  }
}