import axios, { AxiosInstance } from 'axios';
import { CloudServerResponse } from './mcpClient.js';

export class CloudServerClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add request logging
    this.client.interceptors.request.use(
      (config) => {
        console.error(`→ ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response logging
    this.client.interceptors.response.use(
      (response) => {
        console.error(`← ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        if (error.response) {
          console.error(`← ${error.response.status} ${error.config.url}: ${error.response.statusText}`);
        } else {
          console.error('Response error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get the list of tools available from a specific MCP server
   */
  async listTools(serverName: string, serverArgs: Record<string, any>): Promise<CloudServerResponse> {
    try {
      const response = await this.client.post('/tools/list', {
        serverName,
        serverArgs
      });
      return response.data;
    } catch (error) {
      console.error('Error listing tools:', error);
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: `HTTP ${error.response.status}: ${error.response.statusText}`
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Call a tool on the MCP server via the cloud server
   */
  async callTool(
    serverName: string, 
    serverArgs: Record<string, any>, 
    toolName: string, 
    toolArgs: any
  ): Promise<CloudServerResponse> {
    try {
      const response = await this.client.post('/tools/call', {
        serverName,
        serverArgs,
        toolName,
        toolArgs
      });
      return response.data;
    } catch (error) {
      console.error('Error calling tool:', error);
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: `HTTP ${error.response.status}: ${error.response.statusText}`
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send vendor execution results back to cloud server for processing
   */
  async processVendorResults(
    serverName: string,
    serverArgs: Record<string, any>,
    toolName: string,
    toolArgs: any,
    vendorResults: any[]
  ): Promise<CloudServerResponse> {
    try {
      const response = await this.client.post('/vendor/results', {
        serverName,
        serverArgs,
        toolName,
        toolArgs,
        vendorResults
      });
      return response.data;
    } catch (error) {
      console.error('Error processing vendor results:', error);
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: `HTTP ${error.response.status}: ${error.response.statusText}`
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}