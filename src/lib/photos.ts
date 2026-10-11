/**
 * Recipe photos. They are too big for localStorage, so they live in IndexedDB as Blobs keyed by
 * recipe id, shrunk on the way in. The export file carries them as data URLs, so export/import
 * moves them to another computer along with the rest of the user's data.
 */

/** Longest side after shrinking. Enough for a 393px-wide screen at 3x. */
const MAX_SIDE = 1200;
/** Refuse anything bigger in an imported file; a shrunk photo is a few hundred KB. */
const MAX_DATA_URL = 4_000_000;

const DB = 'flavorfam';
const STORE = 'photos';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => { db.close(); resolve(req ? req.result : undefined); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function loadPhotos(): Promise<Map<string, Blob>> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const out = new Map<string, Blob>();
    const req = db.transaction(STORE).objectStore(STORE).openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) { db.close(); resolve(out); return; }
      out.set(String(cursor.key), cursor.value as Blob);
      cursor.continue();
    };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

export const savePhoto = (id: string, blob: Blob) => run('readwrite', (s) => s.put(blob, id));
export const deletePhoto = (id: string) => run('readwrite', (s) => s.delete(id));

export async function replacePhotos(photos: Map<string, Blob>) {
  await run('readwrite', (s) => {
    s.clear();
    photos.forEach((blob, id) => s.put(blob, id));
  });
}

/** Scales a picked image down to MAX_SIDE and re-encodes it (WebP, or JPEG where WebP can't be encoded). */
export async function shrinkImage(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const encode = (type: string, quality: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  const webp = await encode('image/webp', 0.8);
  if (webp?.type === 'image/webp') return webp;
  const jpeg = await encode('image/jpeg', 0.82);
  if (!jpeg) throw new Error('encode-failed');
  return jpeg;
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function dataUrlToBlob(url: string): Promise<Blob> {
  return (await fetch(url)).blob();
}

/** Keeps only well-formed photo entries for recipes that exist. Never throws: a bad photo is dropped, not fatal. */
export function parsePhotos(input: unknown, recipeIds: readonly string[]): Record<string, string> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  return Object.fromEntries(
    Object.entries(input).filter(
      ([id, url]) =>
        recipeIds.includes(id) &&
        typeof url === 'string' &&
        /^data:image\/(webp|jpeg|png);base64,/.test(url) &&
        url.length <= MAX_DATA_URL,
    ),
  );
}
