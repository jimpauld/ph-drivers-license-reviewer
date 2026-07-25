const DB_NAME = 'phdlr';
const DB_VERSION = 1;
const STORES = ['exams', 'flags', 'bookmarks', 'settings', 'resume'];

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name);
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function tx(db, store, mode) {
  return db.transaction(store, mode).objectStore(store);
}

function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function createIndexedDBStorage() {
  let dbPromise = null;
  function db() {
    if (!dbPromise) dbPromise = openDB();
    return dbPromise;
  }

  return {
    async saveExam(exam) {
      const d = await db();
      const key = exam.id || `exam-${Date.now()}`;
      await promisifyRequest(tx(d, 'exams', 'readwrite').put({ ...exam, id: key }, key));
    },
    async getHistory() {
      const d = await db();
      const all = await promisifyRequest(tx(d, 'exams', 'readonly').getAll());
      return all.sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0));
    },
    async flagQuestion(flag) {
      const d = await db();
      await promisifyRequest(tx(d, 'flags', 'readwrite').put({ ...flag }, flag.questionId));
    },
    async getFlags() {
      const d = await db();
      return promisifyRequest(tx(d, 'flags', 'readonly').getAll());
    },
    async exportFlags() {
      const d = await db();
      const flags = await promisifyRequest(tx(d, 'flags', 'readonly').getAll());
      return { version: 1, exportedAt: Date.now(), flags };
    },
    async addBookmark(bookmark) {
      const d = await db();
      await promisifyRequest(tx(d, 'bookmarks', 'readwrite').put({ ...bookmark }, bookmark.questionId));
    },
    async getBookmarks() {
      const d = await db();
      return promisifyRequest(tx(d, 'bookmarks', 'readonly').getAll());
    },
    async saveResume(state) {
      const d = await db();
      await promisifyRequest(tx(d, 'resume', 'readwrite').put({ ...state }, 'current'));
    },
    async loadResume() {
      const d = await db();
      const out = await promisifyRequest(tx(d, 'resume', 'readonly').get('current'));
      return out || null;
    },
    async clearResume() {
      const d = await db();
      await promisifyRequest(tx(d, 'resume', 'readwrite').delete('current'));
    },
    async getSetting(key, defaultValue) {
      const d = await db();
      const out = await promisifyRequest(tx(d, 'settings', 'readonly').get(key));
      return out === undefined ? defaultValue : out;
    },
    async setSetting(key, value) {
      const d = await db();
      await promisifyRequest(tx(d, 'settings', 'readwrite').put(value, key));
    }
  };
}
