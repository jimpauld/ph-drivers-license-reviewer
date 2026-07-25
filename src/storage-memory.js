export function createMemoryStorage() {
  const exams = [];
  const flags = new Map();
  const bookmarks = new Map();
  const settings = new Map();
  let resume = null;
  let storedBank = null;

  return {
    async saveExam(exam) {
      const id = exam.id || `exam-${Date.now()}`;
      exams.push({ ...exam, id });
    },
    async getHistory() {
      return [...exams].sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0));
    },
    async flagQuestion(flag) {
      flags.set(flag.questionId, { ...flag });
    },
    async getFlags() {
      return [...flags.values()];
    },
    async exportFlags() {
      return { version: 1, exportedAt: Date.now(), flags: [...flags.values()] };
    },
    async addBookmark(bookmark) {
      bookmarks.set(bookmark.questionId, { ...bookmark });
    },
    async getBookmarks() {
      return [...bookmarks.values()];
    },
    async removeBookmark(questionId) {
      bookmarks.delete(questionId);
    },
    async saveResume(state) {
      resume = { ...state, answers: [...(state.answers || [])], questionIds: [...(state.questionIds || [])] };
    },
    async loadResume() {
      return resume ? { ...resume, answers: [...resume.answers], questionIds: [...resume.questionIds] } : null;
    },
    async clearResume() {
      resume = null;
    },
    async getSetting(key, defaultValue) {
      return settings.has(key) ? settings.get(key) : defaultValue;
    },
    async setSetting(key, value) {
      settings.set(key, value);
    },
    async getBank() {
      return storedBank;
    },
    async setBank(b) {
      storedBank = b;
    }
  };
}
