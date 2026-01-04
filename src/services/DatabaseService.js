import { openDB } from 'idb';

class DatabaseService {
  constructor() {
    this.db = null;
    this.dbName = 'MultiTrackerDB';
    this.version = 1;
  }

  async initialize() {
    try {
      this.db = await openDB(this.dbName, this.version, {
        upgrade(db) {
          // Projects store
          if (!db.objectStoreNames.contains('projects')) {
            const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
            projectStore.createIndex('name', 'name');
            projectStore.createIndex('created', 'created');
          }

          // Audio blobs store
          if (!db.objectStoreNames.contains('audioBlobs')) {
            db.createObjectStore('audioBlobs', { keyPath: 'id' });
          }

          // Settings store
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'key' });
          }
        }
      });
      return true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      return true;
    }
  }

  async saveProject(project) {
    try {
      await this.db.put('projects', {
        ...project,
        updated: Date.now()
      });
      return true;
    } catch (error) {
      console.error('Failed to save project:', error);
      return false;
    }
  }

  async loadProject(id) {
    try {
      return await this.db.get('projects', id);
    } catch (error) {
      console.error('Failed to load project:', error);
      return null;
    }
  }

  async getAllProjects() {
    try {
      return await this.db.getAll('projects');
    } catch (error) {
      console.error('Failed to get projects:', error);
      return [];
    }
  }

  async deleteProject(id) {
    try {
      await this.db.delete('projects', id);
      return true;
    } catch (error) {
      console.error('Failed to delete project:', error);
      return false;
    }
  }

  async saveAudioBlob(id, blob) {
    try {
      await this.db.put('audioBlobs', { id, blob });
      return true;
    } catch (error) {
      console.error('Failed to save audio blob:', error);
      return false;
    }
  }

  async loadAudioBlob(id) {
    try {
      const result = await this.db.get('audioBlobs', id);
      return result?.blob || null;
    } catch (error) {
      console.error('Failed to load audio blob:', error);
      return null;
    }
  }

  async saveSetting(key, value) {
    try {
      await this.db.put('settings', { key, value });
      return true;
    } catch (error) {
      console.error('Failed to save setting:', error);
      return false;
    }
  }

  async loadSetting(key, defaultValue = null) {
    try {
      const result = await this.db.get('settings', key);
      return result?.value ?? defaultValue;
    } catch (error) {
      console.error('Failed to load setting:', error);
      return defaultValue;
    }
  }
}

const databaseService = new DatabaseService();
export default databaseService;