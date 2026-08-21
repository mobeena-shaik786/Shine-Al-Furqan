import path from 'path';
import { env } from '../config/env';
import { LocalDiskStorage, type StorageProvider } from './localDiskStorage';

let provider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!provider) {
    provider = new LocalDiskStorage(path.resolve(env.UPLOAD_ROOT));
  }
  return provider;
}

/** Test helper to reset singleton between suites if needed. */
export function resetStorageProviderForTests(): void {
  provider = null;
}
