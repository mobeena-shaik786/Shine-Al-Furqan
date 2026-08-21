import { createReadStream, promises as fs } from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { assertSafeStoredKey } from '../config/uploads';

export interface StoredObject {
  key: string;
  sizeBytes: number;
}

export interface StorageProvider {
  put(key: string, data: Buffer): Promise<StoredObject>;
  openReadStream(key: string): Promise<Readable>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

export class LocalDiskStorage implements StorageProvider {
  constructor(private readonly rootDir: string) {}

  private resolvePath(key: string): string {
    assertSafeStoredKey(key);
    const resolvedRoot = path.resolve(this.rootDir);
    const full = path.resolve(resolvedRoot, key);
    if (!full.startsWith(resolvedRoot + path.sep) && full !== resolvedRoot) {
      throw new Error('Path traversal blocked');
    }
    return full;
  }

  async ensureRoot(): Promise<void> {
    await fs.mkdir(this.rootDir, { recursive: true });
  }

  async put(key: string, data: Buffer): Promise<StoredObject> {
    await this.ensureRoot();
    const full = this.resolvePath(key);
    await fs.writeFile(full, data);
    return { key, sizeBytes: data.length };
  }

  async openReadStream(key: string): Promise<Readable> {
    const full = this.resolvePath(key);
    await fs.access(full);
    return createReadStream(full);
  }

  async delete(key: string): Promise<void> {
    const full = this.resolvePath(key);
    try {
      await fs.unlink(full);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== 'ENOENT') throw err;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.resolvePath(key));
      return true;
    } catch {
      return false;
    }
  }
}
