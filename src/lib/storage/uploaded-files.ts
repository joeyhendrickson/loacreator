const DB_NAME = "loa-creator-uploads";
const DB_VERSION = 1;
const STORE_NAME = "files";

interface StoredUploadRecord {
  id: string;
  slot: "template" | "context";
  name: string;
  type: string;
  lastModified: number;
  order: number;
  data: ArrayBuffer;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB."));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

function toFile(record: StoredUploadRecord): File {
  return new File([record.data], record.name, {
    type: record.type,
    lastModified: record.lastModified,
  });
}

async function fileToRecord(
  id: string,
  slot: StoredUploadRecord["slot"],
  file: File,
  order: number,
): Promise<StoredUploadRecord> {
  return {
    id,
    slot,
    name: file.name,
    type: file.type,
    lastModified: file.lastModified,
    order,
    data: await file.arrayBuffer(),
  };
}

export async function saveUploadedFiles(
  templateFiles: File[],
  contextFiles: File[],
): Promise<void> {
  const db = await openDatabase();
  const records: StoredUploadRecord[] = [];

  if (templateFiles[0]) {
    records.push(await fileToRecord("template", "template", templateFiles[0], 0));
  }

  for (let index = 0; index < contextFiles.length; index++) {
    records.push(
      await fileToRecord(`context-${index}`, "context", contextFiles[index], index),
    );
  }

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.clear();

    for (const record of records) {
      store.put(record);
    }

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Failed to save uploads."));
  });

  db.close();
}

export async function loadUploadedFiles(): Promise<{
  templateFiles: File[];
  contextFiles: File[];
}> {
  const db = await openDatabase();

  const records = await new Promise<StoredUploadRecord[]>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as StoredUploadRecord[]);
    request.onerror = () => reject(request.error ?? new Error("Failed to load uploads."));
  });

  db.close();

  const templateRecord = records.find((record) => record.slot === "template");
  const contextRecords = records
    .filter((record) => record.slot === "context")
    .sort((a, b) => a.order - b.order);

  return {
    templateFiles: templateRecord ? [toFile(templateRecord)] : [],
    contextFiles: contextRecords.map(toFile),
  };
}

export async function clearUploadedFiles(): Promise<void> {
  const db = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.clear();
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Failed to clear uploads."));
  });

  db.close();
}
