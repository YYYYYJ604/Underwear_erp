/**
 * IndexedDB 自动备份模块
 *
 * 在 localStorage 之外，额外将数据备份到 IndexedDB，
 * 避免清浏览器缓存导致数据丢失。
 *
 * 特性：
 *   - 最多保留 10 份历史备份（队列，先进先出）
 *   - 每次操作自动备份，静默无干扰
 *   - 可一键从最新备份恢复
 */
const BackupDB = {
  DB_NAME: 'haiyu_workshop_backup',
  DB_VERSION: 1,
  STORE_NAME: 'backups',
  MAX_BACKUPS: 10,

  /**
   * 打开 IndexedDB 连接
   */
  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id', autoIncrement: true });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
  },

  /**
   * 保存一份备份到 IndexedDB
   * 超出最大数量(10)时，自动删除最旧的备份
   */
  async save(data) {
    try {
      const db = await this.openDB();
      const tx = db.transaction(this.STORE_NAME, 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);

      // 先统计当前数量
      const count = await new Promise((resolve, reject) => {
        const countReq = store.count();
        countReq.onsuccess = () => resolve(countReq.result);
        countReq.onerror = () => reject(countReq.error);
      });

      // 如果已满 10 个，删除最旧的一条
      if (count >= this.MAX_BACKUPS) {
        const index = store.index('timestamp');
        const cursorReq = index.openCursor(null, 'next');

        await new Promise((resolve, reject) => {
          cursorReq.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
              store.delete(cursor.primaryKey);
              resolve();
            } else {
              resolve();
            }
          };
          cursorReq.onerror = () => reject(cursorReq.error);
        });
      }

      // 写入新备份
      const backupItem = {
        data: JSON.parse(JSON.stringify(data)),
        timestamp: Date.now(),
        dateLabel: new Date().toLocaleString('zh-CN', { hour12: false })
      };

      await new Promise((resolve, reject) => {
        const addReq = store.add(backupItem);
        addReq.onsuccess = () => resolve();
        addReq.onerror = () => reject(addReq.error);
      });

      tx.oncomplete = () => db.close();
    } catch (e) {
      console.warn('[IndexedDB 备份] 保存失败（不影响使用）:', e);
    }
  },

  /**
   * 获取备份列表（按时间倒序，最新的在前）
   */
  async getList() {
    try {
      const db = await this.openDB();
      const tx = db.transaction(this.STORE_NAME, 'readonly');
      const store = tx.objectStore(this.STORE_NAME);
      const index = store.index('timestamp');

      const items = await new Promise((resolve, reject) => {
        const results = [];
        const cursorReq = index.openCursor(null, 'prev');
        cursorReq.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            results.push({
              id: cursor.primaryKey,
              timestamp: cursor.value.timestamp,
              dateLabel: cursor.value.dateLabel
            });
            cursor.continue();
          } else {
            resolve(results);
          }
        };
        cursorReq.onerror = () => reject(cursorReq.error);
      });

      tx.oncomplete = () => db.close();
      return items;
    } catch (e) {
      console.warn('[IndexedDB 备份] 获取列表失败:', e);
      return [];
    }
  },

  /**
   * 获取最新的一份备份数据
   */
  async getLatest() {
    try {
      const db = await this.openDB();
      const tx = db.transaction(this.STORE_NAME, 'readonly');
      const store = tx.objectStore(this.STORE_NAME);
      const index = store.index('timestamp');

      const data = await new Promise((resolve, reject) => {
        const cursorReq = index.openCursor(null, 'prev');
        cursorReq.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            resolve(cursor.value.data);
          } else {
            resolve(null);
          }
        };
        cursorReq.onerror = () => reject(cursorReq.error);
      });

      tx.oncomplete = () => db.close();
      return data;
    } catch (e) {
      console.warn('[IndexedDB 备份] 获取最新备份失败:', e);
      return null;
    }
  },

  /**
   * 根据 id 获取指定备份
   */
  async getById(id) {
    try {
      const db = await this.openDB();
      const tx = db.transaction(this.STORE_NAME, 'readonly');
      const store = tx.objectStore(this.STORE_NAME);

      const data = await new Promise((resolve, reject) => {
        const getReq = store.get(id);
        getReq.onsuccess = () => resolve(getReq.result?.data || null);
        getReq.onerror = () => reject(getReq.error);
      });

      tx.oncomplete = () => db.close();
      return data;
    } catch (e) {
      console.warn('[IndexedDB 备份] 获取指定备份失败:', e);
      return null;
    }
  }
};
