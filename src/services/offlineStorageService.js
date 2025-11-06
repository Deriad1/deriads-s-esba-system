/**
 * Offline Storage Service using IndexedDB
 *
 * This service provides a local cache for student data, marks, subjects, etc.
 * to enable offline functionality in the eSBA system.
 */

const DB_NAME = 'esbaDatabaseOffline';
const DB_VERSION = 1;

// Object stores (tables)
const STORES = {
  STUDENTS: 'students',
  MARKS: 'marks',
  SUBJECTS: 'subjects',
  CLASSES: 'classes',
  TEACHERS: 'teachers',
  REMARKS: 'remarks',
  SCHOOL_INFO: 'schoolInfo',
  METADATA: 'metadata'
};

class OfflineStorageService {
  constructor() {
    this.db = null;
  }

  /**
   * Initialize IndexedDB
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains(STORES.STUDENTS)) {
          const studentsStore = db.createObjectStore(STORES.STUDENTS, { keyPath: 'id' });
          studentsStore.createIndex('id_number', 'id_number', { unique: true });
          studentsStore.createIndex('class_name', 'class_name', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.MARKS)) {
          const marksStore = db.createObjectStore(STORES.MARKS, { keyPath: 'id' });
          marksStore.createIndex('student_id', 'student_id', { unique: false });
          marksStore.createIndex('subject', 'subject', { unique: false });
          marksStore.createIndex('class_name', 'class_name', { unique: false });
          marksStore.createIndex('term_year', ['term', 'academic_year'], { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.SUBJECTS)) {
          db.createObjectStore(STORES.SUBJECTS, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORES.CLASSES)) {
          db.createObjectStore(STORES.CLASSES, { keyPath: 'class_name' });
        }

        if (!db.objectStoreNames.contains(STORES.TEACHERS)) {
          const teachersStore = db.createObjectStore(STORES.TEACHERS, { keyPath: 'id' });
          teachersStore.createIndex('email', 'email', { unique: true });
        }

        if (!db.objectStoreNames.contains(STORES.REMARKS)) {
          const remarksStore = db.createObjectStore(STORES.REMARKS, { keyPath: 'id' });
          remarksStore.createIndex('student_id', 'student_id', { unique: false });
          remarksStore.createIndex('term_year', ['term', 'academic_year'], { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.SCHOOL_INFO)) {
          db.createObjectStore(STORES.SCHOOL_INFO, { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains(STORES.METADATA)) {
          db.createObjectStore(STORES.METADATA, { keyPath: 'key' });
        }

        console.log('IndexedDB object stores created/upgraded');
      };
    });
  }

  /**
   * Generic method to add/update data in a store
   */
  async put(storeName, data) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generic method to add multiple items in bulk
   */
  async putBulk(storeName, dataArray) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      let count = 0;
      dataArray.forEach(item => {
        store.put(item);
        count++;
      });

      transaction.oncomplete = () => resolve(count);
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Generic method to get data by ID
   */
  async get(storeName, id) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generic method to get all data from a store
   */
  async getAll(storeName) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generic method to query by index
   */
  async getByIndex(storeName, indexName, indexValue) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(indexValue);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generic method to delete data
   */
  async delete(storeName, id) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all data from a store
   */
  async clear(storeName) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== STUDENTS ====================

  async saveStudents(students) {
    return this.putBulk(STORES.STUDENTS, students);
  }

  async getStudent(id) {
    return this.get(STORES.STUDENTS, id);
  }

  async getStudentByIdNumber(idNumber) {
    const results = await this.getByIndex(STORES.STUDENTS, 'id_number', idNumber);
    return results[0] || null;
  }

  async getStudentsByClass(className) {
    return this.getByIndex(STORES.STUDENTS, 'class_name', className);
  }

  async getAllStudents() {
    return this.getAll(STORES.STUDENTS);
  }

  // ==================== MARKS ====================

  async saveMarks(marks) {
    if (Array.isArray(marks)) {
      return this.putBulk(STORES.MARKS, marks);
    }
    return this.put(STORES.MARKS, marks);
  }

  async getMark(id) {
    return this.get(STORES.MARKS, id);
  }

  async getMarksByStudent(studentId) {
    return this.getByIndex(STORES.MARKS, 'student_id', studentId);
  }

  async getMarksByClass(className) {
    return this.getByIndex(STORES.MARKS, 'class_name', className);
  }

  async getMarksBySubject(subject) {
    return this.getByIndex(STORES.MARKS, 'subject', subject);
  }

  async getMarksByTermYear(term, year) {
    return this.getByIndex(STORES.MARKS, 'term_year', [term, year]);
  }

  async getAllMarks() {
    return this.getAll(STORES.MARKS);
  }

  // ==================== SUBJECTS ====================

  async saveSubjects(subjects) {
    return this.putBulk(STORES.SUBJECTS, subjects);
  }

  async getAllSubjects() {
    return this.getAll(STORES.SUBJECTS);
  }

  // ==================== CLASSES ====================

  async saveClasses(classes) {
    return this.putBulk(STORES.CLASSES, classes);
  }

  async getAllClasses() {
    return this.getAll(STORES.CLASSES);
  }

  // ==================== TEACHERS ====================

  async saveTeachers(teachers) {
    return this.putBulk(STORES.TEACHERS, teachers);
  }

  async getTeacher(id) {
    return this.get(STORES.TEACHERS, id);
  }

  async getAllTeachers() {
    return this.getAll(STORES.TEACHERS);
  }

  // ==================== REMARKS ====================

  async saveRemarks(remarks) {
    if (Array.isArray(remarks)) {
      return this.putBulk(STORES.REMARKS, remarks);
    }
    return this.put(STORES.REMARKS, remarks);
  }

  async getRemarksByStudent(studentId) {
    return this.getByIndex(STORES.REMARKS, 'student_id', studentId);
  }

  async getRemarksByTermYear(term, year) {
    return this.getByIndex(STORES.REMARKS, 'term_year', [term, year]);
  }

  async getAllRemarks() {
    return this.getAll(STORES.REMARKS);
  }

  // ==================== SCHOOL INFO ====================

  async saveSchoolInfo(key, value) {
    return this.put(STORES.SCHOOL_INFO, { key, value });
  }

  async getSchoolInfo(key) {
    const result = await this.get(STORES.SCHOOL_INFO, key);
    return result ? result.value : null;
  }

  // ==================== METADATA ====================

  async saveMetadata(key, value) {
    return this.put(STORES.METADATA, {
      key,
      value,
      lastUpdated: new Date().toISOString()
    });
  }

  async getMetadata(key) {
    const result = await this.get(STORES.METADATA, key);
    return result ? result.value : null;
  }

  async getLastSyncTime(storeName) {
    const result = await this.get(STORES.METADATA, `${storeName}_lastSync`);
    return result ? new Date(result.lastUpdated) : null;
  }

  async setLastSyncTime(storeName) {
    return this.saveMetadata(`${storeName}_lastSync`, true);
  }

  // ==================== CACHE MANAGEMENT ====================

  /**
   * Check if cache is fresh (less than 1 hour old)
   */
  async isCacheFresh(storeName, maxAgeMinutes = 60) {
    const lastSync = await this.getLastSyncTime(storeName);
    if (!lastSync) return false;

    const now = new Date();
    const diffMinutes = (now - lastSync) / 1000 / 60;
    return diffMinutes < maxAgeMinutes;
  }

  /**
   * Clear all offline data
   */
  async clearAllData() {
    const stores = Object.values(STORES);
    for (const store of stores) {
      await this.clear(store);
    }
    console.log('All offline data cleared');
  }

  /**
   * Get storage statistics
   */
  async getStorageStats() {
    const stats = {};
    for (const [name, storeName] of Object.entries(STORES)) {
      const data = await this.getAll(storeName);
      stats[name] = {
        count: data.length,
        lastSync: await this.getLastSyncTime(storeName)
      };
    }
    return stats;
  }
}

// Export singleton instance
const offlineStorage = new OfflineStorageService();
export default offlineStorage;
export { STORES };
