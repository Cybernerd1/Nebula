/// <reference types="chrome" />

declare namespace chrome {
  export namespace storage {
    export interface StorageArea {
      get(keys?: string | string[] | Object): Promise<Object>;
      set(items: Object): Promise<void>;
      remove(keys: string | string[]): Promise<void>;
      clear(): Promise<void>;
      getBytesInUse(keys?: string | string[]): Promise<number>;
    }
    export const local: StorageArea;
    export const sync: StorageArea;
    export const managed: StorageArea;
    export const session: StorageArea;
    export const onChanged: chrome.events.Event<(changes: Object, areaName: string) => void>;
  }

  export namespace runtime {
    export interface MessageSender {
      tab?: chrome.tabs.Tab;
      frameId?: number;
      id?: string;
      url?: string;
      tlsChannelId?: string;
    }
    export function sendMessage(extensionId: string, message: any, options?: Object, callback?: (response: any) => void): void;
    export function sendMessage(message: any, options?: Object, callback?: (response: any) => void): void;
    export const onMessage: chrome.events.Event<(message: any, sender: MessageSender, sendResponse: (response?: any) => void) => void>;
    export const onInstalled: chrome.events.Event<(details: { reason: 'install' | 'update' | 'chrome_update' | 'shared_module_update'; previousVersion?: string }) => void>;
    export const onStartup: chrome.events.Event<() => void>;
    export const onMessageExternal: chrome.events.Event<(message: any, sender: MessageSender, sendResponse: (response?: any) => void) => void>;
    export function getManifest(): chrome.runtime.Manifest;
    export function openOptionsPage(): void;
    export const id: string;
    export function getURL(path: string): string;
    export function getBackgroundPage(callback: (backgroundPage: Window) => void): void;
    export function getPlatformInfo(callback: (info: { os: string; arch: string; nacl_arch: string }) => void): void;
    export function getPackageDirectoryEntry(callback: (entry: DirectoryEntry) => void): void;
    export function setUninstallURL(url: string, callback?: () => void): void;
    export function reload(): void;
    export function requestUpdateCheck(callback: (result: 'throttled' | 'no_update' | 'update_available', details?: { version: string }) => void): void;
    export function restart(): void;
    export function restartAfterDelay(seconds: number): void;
    export function connect(extensionId?: string, connectInfo?: { name?: string; includeTlsChannelId?: boolean }): chrome.runtime.Port;
    export function connectNative(application: string): chrome.runtime.Port;
    export interface Port {
      name: string;
      disconnect(): void;
      onDisconnect: chrome.events.Event<(port: Port) => void>;
      onMessage: chrome.events.Event<(message: any, port: Port) => void>;
      postMessage(message: any): void;
      sender?: MessageSender;
    }
    export interface Manifest {
      name: string;
      version: string;
      manifest_version: number;
      [key: string]: any;
    }
  }

  export namespace tabs {
    export interface Tab {
      id?: number;
      index: number;
      windowId: number;
      selected: boolean;
      highlighted: boolean;
      active: boolean;
      pinned: boolean;
      url?: string;
      title?: string;
      favIconUrl?: string;
      status?: string;
      incognito: boolean;
      width?: number;
      height?: number;
      sessionId?: string;
    }
    export function query(queryInfo: { active?: boolean; currentWindow?: boolean; windowId?: number; index?: number; url?: string | string[]; title?: string; status?: string; audible?: boolean; muted?: boolean; highlighted?: boolean; discarded?: boolean; autoDiscardable?: boolean; groupId?: number }, callback: (result: Tab[]) => void): void;
    export function sendMessage(tabId: number, message: any, options?: { frameId?: number }, responseCallback?: (response: any) => void): void;
  }

  export namespace commands {
    export interface Command {
      name: string;
      description?: string;
      shortcut?: string;
      global?: boolean;
    }
    export function getAll(callback: (commands: Command[]) => void): void;
    export const onCommand: chrome.events.Event<(command: string) => void>;
  }

  export namespace events {
    export interface Event<T extends Function> {
      addListener(callback: T): void;
      removeListener(callback: T): void;
      hasListener(callback: T): boolean;
      hasListeners(): boolean;
    }
  }

  export namespace action {
    export function setTitle(details: { title: string; tabId?: number }): Promise<void>;
    export function getTitle(details: { tabId?: number }): Promise<string>;
    export function setIcon(details: { path?: string | { [size: number]: string }; tabId?: number }): Promise<void>;
    export function setPopup(details: { popup: string; tabId?: number }): Promise<void>;
    export function getPopup(details: { tabId?: number }): Promise<string>;
    export function setBadgeText(details: { text: string | null; tabId?: number }): Promise<void>;
    export function getBadgeText(details: { tabId?: number }): Promise<string>;
    export function setBadgeBackgroundColor(details: { color: string | { r: number; g: number; b: number; a?: number }; tabId?: number }): Promise<void>;
    export function getBadgeBackgroundColor(details: { tabId?: number }): Promise<string>;
    export function enable(tabId?: number): Promise<void>;
    export function disable(tabId?: number): Promise<void>;
    export function isEnabled(tabId?: number): Promise<boolean>;
    export function openPopup(): Promise<void>;
    export const onClicked: chrome.events.Event<(tab: chrome.tabs.Tab) => void>;
  }
}

declare global {
  interface ImportMeta {
    readonly env: {
      readonly DEV: boolean;
      readonly PROD: boolean;
      readonly MODE: string;
      readonly BASE_URL: string;
      [key: string]: string | boolean | undefined;
    };
  }
}

// CSS module declarations
declare module '*.css' {
  const content: string;
  export default content;
}