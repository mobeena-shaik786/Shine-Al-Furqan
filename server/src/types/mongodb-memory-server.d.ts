/** Ambient types for optional local-dev dependency (not installed in production). */
declare module 'mongodb-memory-server' {
  export class MongoMemoryServer {
    static create(): Promise<MongoMemoryServer>;
    getUri(dbName?: string): string;
    stop(): Promise<boolean>;
  }
}
