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
      case 'playwright':
        return await this.executePlaywrightInstruction(instruction);
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

  // Playwright operations - lightweight browser automation executor
  private playwrightBrowser: any = null;
  private playwrightContext: any = null;
  private playwrightPage: any = null;

  private async executePlaywrightInstruction(instruction: VendorInstruction): Promise<any> {
    const { operation, parameters } = instruction;

    console.error(`Executing Playwright operation: ${operation}`);

    try {
      // Dynamically import playwright only when needed (keeps client lightweight)
      const playwright = await import('playwright');

      // Initialize browser if needed
      if (!this.playwrightBrowser) {
        const browserType = parameters.browserType || 'chromium';
        const headless = parameters.headless !== false;

        console.error(`Launching ${browserType} browser (headless: ${headless})...`);

        if (browserType === 'chromium') {
          this.playwrightBrowser = await playwright.chromium.launch({ headless });
        } else if (browserType === 'firefox') {
          this.playwrightBrowser = await playwright.firefox.launch({ headless });
        } else if (browserType === 'webkit') {
          this.playwrightBrowser = await playwright.webkit.launch({ headless });
        } else {
          throw new Error(`Unsupported browser type: ${browserType}`);
        }

        this.playwrightContext = await this.playwrightBrowser.newContext();
        this.playwrightPage = await this.playwrightContext.newPage();

        // Set up console message logging
        this.playwrightPage.on('console', (msg: any) => {
          this.playwrightConsoleLog.push({
            type: msg.type(),
            text: msg.text(),
            timestamp: new Date().toISOString()
          });
        });

        // Set up network request logging
        this.playwrightPage.on('request', (request: any) => {
          this.playwrightNetworkLog.push({
            url: request.url(),
            method: request.method(),
            timestamp: new Date().toISOString()
          });
        });

        console.error('Browser launched successfully');
      }

      // Execute the operation (official Microsoft Playwright MCP operations)
      switch (operation) {
        // Navigation
        case 'navigate':
          return await this.playwrightNavigate(parameters);
        case 'navigate_back':
          return await this.playwrightNavigateBack(parameters);
        case 'navigate_forward':
          return await this.playwrightNavigateForward(parameters);
        case 'reload':
          return await this.playwrightReload(parameters);

        // Interaction
        case 'click':
          return await this.playwrightClick(parameters);
        case 'fill':
          return await this.playwrightFill(parameters);
        case 'type':
          return await this.playwrightType(parameters);
        case 'press_key':
          return await this.playwrightPressKey(parameters);
        case 'select_option':
          return await this.playwrightSelectOption(parameters);
        case 'hover':
          return await this.playwrightHover(parameters);
        case 'drag':
          return await this.playwrightDrag(parameters);

        // Forms
        case 'fill_form':
          return await this.playwrightFillForm(parameters);
        case 'file_upload':
          return await this.playwrightFileUpload(parameters);

        // Content Extraction
        case 'snapshot':
          return await this.playwrightSnapshot(parameters);
        case 'take_screenshot':
          return await this.playwrightTakeScreenshot(parameters);
        case 'get_text':
          return await this.playwrightGetText(parameters);
        case 'get_attribute':
          return await this.playwrightGetAttribute(parameters);
        case 'get_html':
          return await this.playwrightGetHtml(parameters);

        // State & Monitoring
        case 'wait_for':
          return await this.playwrightWaitFor(parameters);
        case 'evaluate':
          return await this.playwrightEvaluate(parameters);
        case 'console_messages':
          return await this.playwrightConsoleMessages(parameters);
        case 'network_requests':
          return await this.playwrightNetworkRequests(parameters);

        // Browser State
        case 'get_url':
          return await this.playwrightGetUrl();
        case 'get_title':
          return await this.playwrightGetTitle();

        // Dialogs
        case 'handle_dialog':
          return await this.playwrightHandleDialog(parameters);

        // Management
        case 'resize':
          return await this.playwrightResize(parameters);
        case 'pdf_save':
          return await this.playwrightPdfSave(parameters);
        case 'close':
          return await this.playwrightClose();

        default:
          throw new Error(`Unsupported Playwright operation: ${operation}`);
      }
    } catch (error) {
      console.error('Playwright operation error:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown Playwright error'
      };
    }
  }

  // Playwright operation implementations
  private async playwrightNavigate(params: any): Promise<any> {
    const { url, waitUntil = 'load' } = params;
    await this.playwrightPage.goto(url, { waitUntil });
    return { success: true, url, message: `Navigated to ${url}` };
  }

  private async playwrightClick(params: any): Promise<any> {
    const { selector, timeout = 30000 } = params;
    await this.playwrightPage.click(selector, { timeout });
    return { success: true, selector, message: `Clicked ${selector}` };
  }

  private async playwrightFill(params: any): Promise<any> {
    const { selector, text, timeout = 30000 } = params;
    await this.playwrightPage.fill(selector, text, { timeout });
    return { success: true, selector, message: `Filled ${selector} with text` };
  }

  private async playwrightType(params: any): Promise<any> {
    const { selector, text, delay = 100, timeout = 30000 } = params;
    await this.playwrightPage.type(selector, text, { delay, timeout });
    return { success: true, selector, message: `Typed into ${selector}` };
  }

  private async playwrightPressKey(params: any): Promise<any> {
    const { key, selector } = params;
    if (selector) {
      await this.playwrightPage.press(selector, key);
    } else {
      await this.playwrightPage.keyboard.press(key);
    }
    return { success: true, key, message: `Pressed ${key}` };
  }

  private async playwrightSelectOption(params: any): Promise<any> {
    const { selector, value, timeout = 30000 } = params;
    await this.playwrightPage.selectOption(selector, value, { timeout });
    return { success: true, selector, value, message: `Selected ${value} in ${selector}` };
  }

  private async playwrightHover(params: any): Promise<any> {
    const { selector, timeout = 30000 } = params;
    await this.playwrightPage.hover(selector, { timeout });
    return { success: true, selector, message: `Hovered over ${selector}` };
  }

  private async playwrightDrag(params: any): Promise<any> {
    const { sourceSelector, targetSelector, timeout = 30000 } = params;
    const source = await this.playwrightPage.locator(sourceSelector);
    const target = await this.playwrightPage.locator(targetSelector);
    await source.dragTo(target, { timeout });
    return { success: true, message: `Dragged from ${sourceSelector} to ${targetSelector}` };
  }

  private async playwrightFillForm(params: any): Promise<any> {
    const { fields } = params;
    const results = [];

    for (const field of fields) {
      try {
        await this.playwrightPage.fill(field.selector, field.value);
        results.push({ selector: field.selector, success: true });
      } catch (error) {
        results.push({
          selector: field.selector,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return { success: true, results, message: `Filled ${fields.length} form fields` };
  }

  private async playwrightFileUpload(params: any): Promise<any> {
    const { selector, files, timeout = 30000 } = params;
    await this.playwrightPage.setInputFiles(selector, files, { timeout });
    return { success: true, selector, files, message: `Uploaded ${files.length} file(s)` };
  }

  private async playwrightSnapshot(params: any): Promise<any> {
    const { selector } = params;

    if (selector) {
      const element = await this.playwrightPage.locator(selector);
      const snapshot = await element.ariaSnapshot();
      return { success: true, snapshot };
    } else {
      const snapshot = await this.playwrightPage.ariaSnapshot();
      return { success: true, snapshot };
    }
  }

  private async playwrightTakeScreenshot(params: any): Promise<any> {
    const { selector, fullPage = false, type = 'png' } = params;
    let screenshot: Buffer;

    if (selector) {
      const element = await this.playwrightPage.locator(selector);
      screenshot = await element.screenshot({ type });
    } else {
      screenshot = await this.playwrightPage.screenshot({ fullPage, type });
    }

    return {
      success: true,
      screenshot: screenshot.toString('base64'),
      type,
      message: 'Screenshot captured successfully'
    };
  }

  private async playwrightGetText(params: any): Promise<any> {
    const { selector, all = false, timeout = 30000 } = params;

    if (all) {
      const elements = await this.playwrightPage.locator(selector).all();
      const texts = await Promise.all(elements.map((el: any) => el.textContent()));
      return { success: true, texts, count: texts.length };
    } else {
      const text = await this.playwrightPage.locator(selector).textContent({ timeout });
      return { success: true, text };
    }
  }

  private async playwrightGetAttribute(params: any): Promise<any> {
    const { selector, attribute, timeout = 30000 } = params;
    const value = await this.playwrightPage.locator(selector).getAttribute(attribute, { timeout });
    return { success: true, attribute, value };
  }

  private async playwrightGetHtml(params: any): Promise<any> {
    const { selector, timeout = 30000 } = params;

    if (selector) {
      const html = await this.playwrightPage.locator(selector).innerHTML({ timeout });
      return { success: true, html };
    } else {
      const html = await this.playwrightPage.content();
      return { success: true, html };
    }
  }

  private async playwrightWaitFor(params: any): Promise<any> {
    const { selector, state = 'visible', timeout = 30000 } = params;

    // If selector is provided, wait for element state
    if (selector) {
      await this.playwrightPage.waitForSelector(selector, { state, timeout });
      return { success: true, selector, state, message: `Element ${selector} is ${state}` };
    } else {
      // Otherwise just wait for the timeout duration
      await this.playwrightPage.waitForTimeout(timeout);
      return { success: true, timeout, message: `Waited ${timeout}ms` };
    }
  }

  private async playwrightEvaluate(params: any): Promise<any> {
    const { script } = params;
    const result = await this.playwrightPage.evaluate(script);
    return { success: true, result };
  }

  private async playwrightGetUrl(): Promise<any> {
    const url = this.playwrightPage.url();
    return { success: true, url };
  }

  private async playwrightGetTitle(): Promise<any> {
    const title = await this.playwrightPage.title();
    return { success: true, title };
  }

  private async playwrightReload(params: any): Promise<any> {
    const { waitUntil = 'load' } = params;
    await this.playwrightPage.reload({ waitUntil });
    return { success: true, message: 'Page reloaded' };
  }

  private async playwrightNavigateBack(params: any): Promise<any> {
    const { waitUntil = 'load' } = params;
    await this.playwrightPage.goBack({ waitUntil });
    return { success: true, message: 'Navigated back' };
  }

  private async playwrightNavigateForward(params: any): Promise<any> {
    const { waitUntil = 'load' } = params;
    await this.playwrightPage.goForward({ waitUntil });
    return { success: true, message: 'Navigated forward' };
  }

  // Monitoring & State
  private playwrightConsoleLog: any[] = [];
  private playwrightNetworkLog: any[] = [];

  private async playwrightConsoleMessages(params: any): Promise<any> {
    const { onlyErrors = false } = params;

    if (onlyErrors) {
      const errors = this.playwrightConsoleLog.filter(msg => msg.type === 'error');
      return { success: true, messages: errors, count: errors.length };
    }

    return { success: true, messages: this.playwrightConsoleLog, count: this.playwrightConsoleLog.length };
  }

  private async playwrightNetworkRequests(params: any): Promise<any> {
    const { filter } = params;

    let requests = this.playwrightNetworkLog;
    if (filter) {
      requests = requests.filter(req => req.url.includes(filter));
    }

    return { success: true, requests, count: requests.length };
  }

  private async playwrightHandleDialog(params: any): Promise<any> {
    const { action, promptText } = params;

    // Set up dialog handler for next dialog
    this.playwrightPage.once('dialog', async (dialog: any) => {
      if (action === 'accept') {
        await dialog.accept(promptText);
      } else {
        await dialog.dismiss();
      }
    });

    return { success: true, message: `Dialog handler set to ${action}` };
  }

  private async playwrightResize(params: any): Promise<any> {
    const { width, height } = params;
    await this.playwrightPage.setViewportSize({ width, height });
    return { success: true, width, height, message: `Resized viewport to ${width}x${height}` };
  }

  private async playwrightPdfSave(params: any): Promise<any> {
    const { path, format = 'Letter', printBackground = false } = params;
    await this.playwrightPage.pdf({ path, format, printBackground });
    return { success: true, path, message: `PDF saved to ${path}` };
  }

  private async playwrightClose(): Promise<any> {
    if (this.playwrightBrowser) {
      await this.playwrightBrowser.close();
      this.playwrightBrowser = null;
      this.playwrightContext = null;
      this.playwrightPage = null;
      this.playwrightConsoleLog = [];
      this.playwrightNetworkLog = [];
      console.error('Browser closed');
      return { success: true, message: 'Browser closed' };
    }
    return { success: true, message: 'Browser was not running' };
  }

  /**
   * Close all database connections and browser
   */
  async close(): Promise<void> {
    console.error('Closing all connections...');

    // Close MongoDB connections
    for (const [connectionString, connection] of this.mongoConnections) {
      try {
        await connection.client.close();
        console.error(`Closed connection: ${connectionString.replace(/\/\/.*@/, '//***:***@')}`);
      } catch (error) {
        console.error(`Error closing connection ${connectionString}:`, error);
      }
    }

    this.mongoConnections.clear();

    // Close Playwright browser
    if (this.playwrightBrowser) {
      try {
        await this.playwrightBrowser.close();
        this.playwrightBrowser = null;
        this.playwrightContext = null;
        this.playwrightPage = null;
        console.error('Closed browser');
      } catch (error) {
        console.error('Error closing browser:', error);
      }
    }
  }
}