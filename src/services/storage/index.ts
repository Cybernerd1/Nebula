import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { StorageSchema, Workspace, GlobalSettings, ImportExportData } from '../../types';

const STORAGE_KEY = 'nebula-storage';
const SETTINGS_KEY = 'nebula-settings';
const DB_NAME = 'nebula-db';
const DB_VERSION = 1;

interface NebulaDB extends DBSchema {
  wallpapers: {
    key: string;
    value: {
      id: string;
      data: ArrayBuffer;
      mimeType: string;
      name: string;
      createdAt: number;
    };
    indexes: { 'by-name': string; 'by-created': number };
  };
  backups: {
    key: string;
    value: {
      id: string;
      data: ImportExportData;
      createdAt: number;
      name: string;
    };
    indexes: { 'by-created': number };
  };
}

class StorageService {
  private db: IDBPDatabase<NebulaDB> | null = null;
  private initPromise: Promise<IDBPDatabase<NebulaDB>> | null = null;
  private cache: Map<string, unknown> = new Map();
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private pendingWrites: Map<string, { data: unknown; useSync: boolean }> = new Map();

  // Fallback layer used when chrome.storage is unavailable (e.g. running as a
  // plain website in dev). Reads/writes go to localStorage so every feature
  // keeps working and persisting.
  private get fallbackAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && !!window.localStorage;
    } catch {
      return false;
    }
  }

  private fallbackRead(key: string): unknown {
    if (!this.fallbackAvailable) return null;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error(`Failed to read fallback storage for ${key}:`, error);
      return null;
    }
  }

  private fallbackWrite(key: string, data: unknown): void {
    if (!this.fallbackAvailable) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Failed to write fallback storage for ${key}:`, error);
    }
  }

  async initialize(): Promise<void> {
    if (this.db) return;
    if (!this.initPromise) {
      this.initPromise = this.openDatabase();
    }
    this.db = await this.initPromise;
  }

  private async openDatabase(): Promise<IDBPDatabase<NebulaDB>> {
    return openDB<NebulaDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('wallpapers')) {
          const wallpaperStore = db.createObjectStore('wallpapers', { keyPath: 'id' });
          wallpaperStore.createIndex('by-name', 'name');
          wallpaperStore.createIndex('by-created', 'createdAt');
        }
        if (!db.objectStoreNames.contains('backups')) {
          const backupStore = db.createObjectStore('backups', { keyPath: 'id' });
          backupStore.createIndex('by-created', 'createdAt');
        }
      },
    });
  }

  async getStorage(): Promise<StorageSchema | null> {
    if (this.cache.has(STORAGE_KEY)) {
      return this.cache.get(STORAGE_KEY) as StorageSchema;
    }

    // Check if chrome.storage is available
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      const fallback = this.fallbackRead(STORAGE_KEY) as StorageSchema | null;
      if (fallback) this.cache.set(STORAGE_KEY, fallback);
      return fallback;
    }

    try {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      const data = (result as Record<string, StorageSchema>)[STORAGE_KEY];
      if (data) {
        this.cache.set(STORAGE_KEY, data);
      }
      return data || null;
    } catch (error) {
      console.error('Failed to get storage:', error);
      return null;
    }
  }

  async setStorage(data: StorageSchema): Promise<void> {
    this.cache.set(STORAGE_KEY, data);
    this.scheduleWrite(STORAGE_KEY, data);
  }

  async getSettings(): Promise<GlobalSettings | null> {
    if (this.cache.has(SETTINGS_KEY)) {
      return this.cache.get(SETTINGS_KEY) as GlobalSettings;
    }

    // Check if chrome.storage is available
    if (typeof chrome === 'undefined' || !chrome.storage?.sync) {
      const fallback = this.fallbackRead(SETTINGS_KEY) as GlobalSettings | null;
      if (fallback) this.cache.set(SETTINGS_KEY, fallback);
      return fallback;
    }

    try {
      const result = await chrome.storage.sync.get(SETTINGS_KEY);
      const data = (result as Record<string, GlobalSettings>)[SETTINGS_KEY];
      if (data) {
        this.cache.set(SETTINGS_KEY, data);
      }
      return data || null;
    } catch (error) {
      console.error('Failed to get settings:', error);
      return null;
    }
  }

  async setSettings(data: GlobalSettings): Promise<void> {
    this.cache.set(SETTINGS_KEY, data);
    this.scheduleWrite(SETTINGS_KEY, data, true);
  }

  private scheduleWrite(key: string, data: unknown, useSync = false): void {
    this.pendingWrites.set(key, { data, useSync });
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => this.flushWrites(), 300);
  }

  private async flushWrites(): Promise<void> {
    const chromeAvailable =
      typeof chrome !== 'undefined' && !!chrome.storage?.local && !!chrome.storage?.sync;

    const writes = Array.from(this.pendingWrites.entries());
    this.pendingWrites.clear();

    if (!chromeAvailable) {
      // Fallback: persist to localStorage so data survives reloads outside the extension
      writes.forEach(([key, { data }]) => this.fallbackWrite(key, data));
      return;
    }

    await Promise.all(
      writes.map(async ([key, { data, useSync }]) => {
        try {
          if (useSync && chrome.storage?.sync) {
            await chrome.storage.sync.set({ [key]: data });
          } else if (chrome.storage?.local) {
            await chrome.storage.local.set({ [key]: data });
          } else {
            this.fallbackWrite(key, data);
          }
        } catch (error) {
          console.error(`Failed to write ${key}:`, error);
          this.pendingWrites.set(key, { data, useSync });
        }
      })
    );
  }

  async saveWallpaper(id: string, file: File): Promise<string> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    const arrayBuffer = await file.arrayBuffer();
    await this.db.put('wallpapers', {
      id,
      data: arrayBuffer,
      mimeType: file.type,
      name: file.name,
      createdAt: Date.now(),
    });

    return id;
  }

  async getWallpaper(id: string): Promise<Blob | null> {
    await this.initialize();
    if (!this.db) return null;

    const record = await this.db.get('wallpapers', id);
    if (!record) return null;

    return new Blob([record.data], { type: record.mimeType });
  }

  async getWallpaperUrl(id: string): Promise<string | null> {
    const blob = await this.getWallpaper(id);
    if (!blob) return null;
    return URL.createObjectURL(blob);
  }

  async deleteWallpaper(id: string): Promise<void> {
    await this.initialize();
    if (!this.db) return;
    await this.db.delete('wallpapers', id);
  }

  async listWallpapers(): Promise<Array<{ id: string; name: string; createdAt: number }>> {
    await this.initialize();
    if (!this.db) return [];

    const records = await this.db.getAllFromIndex('wallpapers', 'by-created');
    return records.map((r) => ({ id: r.id, name: r.name, createdAt: r.createdAt }));
  }

  async createBackup(data: ImportExportData, name: string): Promise<string> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    const id = `backup-${Date.now()}`;
    await this.db.put('backups', {
      id,
      data,
      createdAt: Date.now(),
      name,
    });

    return id;
  }

  async getBackup(id: string): Promise<ImportExportData | null> {
    await this.initialize();
    if (!this.db) return null;

    const record = await this.db.get('backups', id);
    return record?.data || null;
  }

  async listBackups(): Promise<Array<{ id: string; name: string; createdAt: number }>> {
    await this.initialize();
    if (!this.db) return [];

    const records = await this.db.getAllFromIndex('backups', 'by-created');
    return records.map((r) => ({ id: r.id, name: r.name, createdAt: r.createdAt }));
  }

  async deleteBackup(id: string): Promise<void> {
    await this.initialize();
    if (!this.db) return;
    await this.db.delete('backups', id);
  }

  async clearAll(): Promise<void> {
    await this.initialize();

    const chromeAvailable = typeof chrome !== 'undefined' && !!chrome.storage?.local && !!chrome.storage?.sync;
    const clears: Promise<unknown>[] = [];

    if (this.db) {
      clears.push(this.db.clear('wallpapers'), this.db.clear('backups'));
    }
    if (chromeAvailable) {
      clears.push(chrome.storage.local.clear(), chrome.storage.sync.clear());
    }
    if (this.fallbackAvailable) {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(SETTINGS_KEY);
    }

    await Promise.all(clears);
    this.cache.clear();
  }

  async getStorageUsage(): Promise<{ used: number; quota: number }> {
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage || 0,
          quota: estimate.quota || 0,
        };
      }
    } catch {
      // Ignore
    }
    return { used: 0, quota: 0 };
  }

  async migrateIfNeeded(data: StorageSchema): Promise<StorageSchema> {
    const currentVersion = 1;
    if (!data.version || data.version < currentVersion) {
      console.log(`Migrating storage from version ${data.version || 0} to ${currentVersion}`);
      return { ...data, version: currentVersion };
    }
    return data;
  }
}

export const storageService = new StorageService();
export default storageService;