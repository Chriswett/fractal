import { Preset, Scene } from "../state/types";

const DB_NAME = "fraktaler-db";
const DB_VERSION = 1;
const PRESETS_STORE = "presets";
const SCENES_STORE = "scenes";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PRESETS_STORE)) {
        db.createObjectStore(PRESETS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(SCENES_STORE)) {
        db.createObjectStore(SCENES_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(storeName: string, mode: IDBTransactionMode, fn: (store: IDBObjectStore) => void) {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    fn(store);
    tx.oncomplete = () => resolve(undefined as T);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getUserPresets(): Promise<Preset[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PRESETS_STORE, "readonly");
    const store = tx.objectStore(PRESETS_STORE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as Preset[]);
    request.onerror = () => reject(request.error);
  });
}

export async function saveUserPreset(preset: Preset) {
  await withStore<void>(PRESETS_STORE, "readwrite", (store) => {
    store.put(preset);
  });
}

export async function deleteUserPreset(presetId: string) {
  await withStore<void>(PRESETS_STORE, "readwrite", (store) => {
    store.delete(presetId);
  });
}

export async function saveScene(scene: Scene) {
  await withStore<void>(SCENES_STORE, "readwrite", (store) => {
    store.put(scene);
  });
}

export async function getSavedScenes(): Promise<Scene[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SCENES_STORE, "readonly");
    const store = tx.objectStore(SCENES_STORE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as Scene[]);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteScene(sceneId: string) {
  await withStore<void>(SCENES_STORE, "readwrite", (store) => {
    store.delete(sceneId);
  });
}
