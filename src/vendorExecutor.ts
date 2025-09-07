import { MongoClient, Db, Collection } from 'mongodb';
import { VendorInstruction } from './mcpClient.js';

interface MongoConnection {
  client: MongoClient;
  db: Db;
}

export class VendorExecutor {
  private mongoConnections = new Map<string, MongoConnection>();

  /**
   * Execute a vendor instruction locally
   */
  async execute(instruction: VendorInstruction): Promise<any> {
    console.error(`Executing vendor instruction: ${instruction.type}.${instruction.operation}`);
    
    switch (instruction.type) {
      case 'mongodb':
        return await this.executeMongoInstruction(instruction);
      case 'postgresql':
        throw new Error('PostgreSQL vendor instructions not yet implemented');
      case 'mysql':
        throw new Error('MySQL vendor instructions not yet implemented');
      case 'http':
        return await this.executeHttpInstruction(instruction);
      default:
        throw new Error(`Unsupported vendor instruction type: ${instruction.type}`);
    }
  }

  private async executeMongoInstruction(instruction: VendorInstruction): Promise<any> {
    const { operation, parameters, connectionString } = instruction;

    if (!connectionString) {
      throw new Error('MongoDB connection string is required');
    }

    // Get or create MongoDB connection
    const connection = await this.getMongoConnection(connectionString);
    const { client, db } = connection;

    switch (operation) {
      // Connection operations
      case 'connect':
        return { connected: true, connectionString };
        
      // Metadata operations
      case 'listDatabases':
        return await this.mongoListDatabases(client);
        
      case 'listCollections':
        return await this.mongoListCollections(client.db(parameters.database), parameters);
        
      case 'collectionSchema':
        return await this.mongoCollectionSchema(client.db(parameters.database), parameters);
        
      case 'collectionStorageSize':
        return await this.mongoCollectionStorageSize(client.db(parameters.database), parameters);
        
      case 'dbStats':
        return await this.mongoDbStats(client.db(parameters.database));
        
      case 'explain':
        return await this.mongoExplain(client.db(parameters.database), parameters);
        
      case 'logs':
        return await this.mongoLogs(db, parameters);
        
      // Read operations
      case 'find':
        return await this.mongoFind(client.db(parameters.database), parameters);
        
      case 'count':
        return await this.mongoCount(client.db(parameters.database), parameters);
        
      case 'aggregate':
        return await this.mongoAggregate(client.db(parameters.database), parameters);
        
      case 'listIndexes':
        return await this.mongoListIndexes(client.db(parameters.database), parameters);
        
      case 'export':
        return await this.mongoExport(client.db(parameters.database), parameters);
        
      // Create operations
      case 'insertMany':
        return await this.mongoInsertMany(client.db(parameters.database), parameters);
        
      case 'createIndex':
        return await this.mongoCreateIndex(client.db(parameters.database), parameters);
        
      case 'createCollection':
        return await this.mongoCreateCollection(client.db(parameters.database), parameters);
        
      // Update operations
      case 'updateMany':
        return await this.mongoUpdateMany(client.db(parameters.database), parameters);
        
      case 'renameCollection':
        return await this.mongoRenameCollection(client.db(parameters.database), parameters);
        
      // Delete operations
      case 'deleteMany':
        return await this.mongoDeleteMany(client.db(parameters.database), parameters);
        
      case 'dropCollection':
        return await this.mongoDropCollection(client.db(parameters.database), parameters);
        
      case 'dropDatabase':
        return await this.mongoDropDatabase(client.db(parameters.database));
        
      default:
        throw new Error(`Unsupported MongoDB operation: ${operation}`);
    }
  }

  private async executeHttpInstruction(instruction: VendorInstruction): Promise<any> {
    const { operation, parameters } = instruction;
    
    if (operation === 'atlasApiCall') {
      // Atlas API calls - placeholder for now
      return {
        operation,
        parameters,
        result: `Atlas API call: ${parameters.toolName} - not yet implemented in client`,
        note: 'Atlas operations require API implementation'
      };
    }
    
    return {
      operation,
      parameters,
      result: 'HTTP instruction execution not yet implemented'
    };
  }

  private async getMongoConnection(connectionString: string): Promise<MongoConnection> {
    if (this.mongoConnections.has(connectionString)) {
      return this.mongoConnections.get(connectionString)!;
    }

    console.error(`Connecting to MongoDB: ${connectionString.replace(/\/\/.*@/, '//***:***@')}`);
    
    const client = new MongoClient(connectionString);
    await client.connect();
    
    // Extract database name from connection string
    const url = new URL(connectionString);
    const dbName = url.pathname.substring(1) || 'test';
    const db = client.db(dbName);

    const connection = { client, db };
    this.mongoConnections.set(connectionString, connection);
    
    return connection;
  }

  // MongoDB operation implementations - All 21 operations
  
  // Metadata operations
  private async mongoListDatabases(client: MongoClient): Promise<any> {
    const result = await client.db().admin().listDatabases();
    return {
      databases: result.databases.map(db => db.name)
    };
  }
  
  private async mongoListCollections(db: Db, params: any): Promise<any> {
    const collections = await db.listCollections().toArray();
    return {
      collections: collections.map(c => c.name)
    };
  }
  
  private async mongoCollectionSchema(db: Db, params: any): Promise<any> {
    const { collection } = params;
    const coll = db.collection(collection);
    
    // Sample some documents to infer schema
    const samples = await coll.find({}).limit(100).toArray();
    const schema = this.inferSchema(samples);
    
    return { schema };
  }
  
  private async mongoCollectionStorageSize(db: Db, params: any): Promise<any> {
    const { collection } = params;
    
    try {
      const stats = await db.command({ collStats: collection });
      return {
        storageSize: stats.storageSize,
        size: stats.size,
        count: stats.count
      };
    } catch (error) {
      return {
        error: `Failed to get collection storage size: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  private async mongoDbStats(db: Db): Promise<any> {
    const stats = await db.stats();
    return { stats };
  }
  
  private async mongoExplain(db: Db, params: any): Promise<any> {
    const { collection, method } = params;
    const coll = db.collection(collection);
    
    // Execute explain based on method type
    const methodObj = method[0];
    if (methodObj.name === 'find') {
      return await coll.find(methodObj.filter || {}).explain();
    } else if (methodObj.name === 'aggregate') {
      return await coll.aggregate(methodObj.pipeline || []).explain();
    } else if (methodObj.name === 'count') {
      return await coll.find(methodObj.query || {}).explain();
    }
    
    return { error: 'Unsupported explain method' };
  }
  
  private async mongoLogs(db: Db, params: any): Promise<any> {
    const { type = 'global', limit = 50 } = params;
    
    try {
      const adminDb = db.admin();
      const logs = await adminDb.command({
        getLog: type
      });
      
      return {
        logs: logs.log.slice(-limit)
      };
    } catch (error) {
      return {
        logs: [],
        note: 'Log access may require elevated privileges'
      };
    }
  }
  
  // Read operations
  private async mongoFind(db: Db, params: any): Promise<any> {
    const { collection, filter = {}, projection, limit = 10, sort } = params;
    const coll = db.collection(collection);
    
    let cursor = coll.find(filter);
    if (projection) cursor = cursor.project(projection);
    if (limit) cursor = cursor.limit(limit);
    if (sort) cursor = cursor.sort(sort);
    
    const documents = await cursor.toArray();
    
    return {
      documents,
      count: documents.length
    };
  }
  
  private async mongoCount(db: Db, params: any): Promise<any> {
    const { collection, query = {} } = params;
    const coll = db.collection(collection);
    
    const count = await coll.countDocuments(query);
    return { count };
  }
  
  private async mongoAggregate(db: Db, params: any): Promise<any> {
    const { collection, pipeline } = params;
    const coll = db.collection(collection);
    
    const cursor = coll.aggregate(pipeline);
    const results = await cursor.toArray();
    
    return {
      results,
      count: results.length
    };
  }
  
  private async mongoListIndexes(db: Db, params: any): Promise<any> {
    const { collection } = params;
    const coll = db.collection(collection);
    
    const indexes = await coll.listIndexes().toArray();
    return { indexes };
  }
  
  private async mongoExport(db: Db, params: any): Promise<any> {
    const { collection, exportTarget, jsonExportFormat = 'relaxed' } = params;
    const coll = db.collection(collection);
    
    // Execute the export target operation
    const operation = exportTarget[0];
    let results: any[] = [];
    
    if (operation.name === 'find') {
      const cursor = coll.find(operation.filter || {});
      results = await cursor.toArray();
    } else if (operation.name === 'aggregate') {
      const cursor = coll.aggregate(operation.pipeline || []);
      results = await cursor.toArray();
    }
    
    return {
      exportedDocuments: results,
      count: results.length,
      format: jsonExportFormat
    };
  }
  
  // Create operations
  private async mongoInsertMany(db: Db, params: any): Promise<any> {
    const { collection, documents } = params;
    const coll = db.collection(collection);
    
    const result = await coll.insertMany(documents);
    return {
      insertedIds: result.insertedIds,
      insertedCount: result.insertedCount,
      acknowledged: result.acknowledged
    };
  }
  
  private async mongoCreateIndex(db: Db, params: any): Promise<any> {
    const { collection, keys, name } = params;
    const coll = db.collection(collection);
    
    const options = name ? { name } : {};
    const result = await coll.createIndex(keys, options);
    return { indexName: result };
  }
  
  private async mongoCreateCollection(db: Db, params: any): Promise<any> {
    const { collection } = params;
    
    const result = await db.createCollection(collection);
    return { 
      name: result.collectionName,
      acknowledged: true 
    };
  }
  
  // Update operations
  private async mongoUpdateMany(db: Db, params: any): Promise<any> {
    const { collection, filter = {}, update, upsert } = params;
    const coll = db.collection(collection);
    
    const options = upsert ? { upsert: true } : {};
    const result = await coll.updateMany(filter, update, options);
    
    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      acknowledged: result.acknowledged,
      upsertedId: result.upsertedId
    };
  }
  
  private async mongoRenameCollection(db: Db, params: any): Promise<any> {
    const { collection, newName, dropTarget = false } = params;
    const coll = db.collection(collection);
    
    const result = await coll.rename(newName, { dropTarget });
    return { acknowledged: true };
  }
  
  // Delete operations
  private async mongoDeleteMany(db: Db, params: any): Promise<any> {
    const { collection, filter = {} } = params;
    const coll = db.collection(collection);
    
    const result = await coll.deleteMany(filter);
    return {
      deletedCount: result.deletedCount,
      acknowledged: result.acknowledged
    };
  }
  
  private async mongoDropCollection(db: Db, params: any): Promise<any> {
    const { collection } = params;
    
    const result = await db.collection(collection).drop();
    return { acknowledged: result };
  }
  
  private async mongoDropDatabase(db: Db): Promise<any> {
    const result = await db.dropDatabase();
    return { acknowledged: result };
  }
  
  // Helper method to infer schema from documents
  private inferSchema(documents: any[]): any {
    if (documents.length === 0) return {};
    
    const schema: any = {};
    for (const doc of documents) {
      for (const [key, value] of Object.entries(doc)) {
        if (!schema[key]) {
          schema[key] = {
            type: typeof value,
            examples: []
          };
        }
        if (schema[key].examples.length < 3 && !schema[key].examples.includes(value)) {
          schema[key].examples.push(value);
        }
      }
    }
    
    return schema;
  }

  /**
   * Close all database connections
   */
  async close(): Promise<void> {
    console.error('Closing all database connections...');
    
    for (const [connectionString, connection] of this.mongoConnections) {
      try {
        await connection.client.close();
        console.error(`Closed connection: ${connectionString.replace(/\/\/.*@/, '//***:***@')}`);
      } catch (error) {
        console.error(`Error closing connection ${connectionString}:`, error);
      }
    }
    
    this.mongoConnections.clear();
  }
}