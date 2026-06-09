/**
 * 数据存储层 — localStorage
 *
 * 数据持久化策略：
 *   1. localStorage —— 实时读写（主要存储）
 *   2. IndexedDB —— 自动备份队列（最多 10 份，防清缓存丢失）
 *   3. JSON 导出 —— 用户主动备份（换浏览器/换电脑用）
 */
const Storage = {
  KEY: 'haiyu_workshop_erp',

  defaults() {
    return {
      companyName: '钦州市海誉服装有限公司',
      theme: 'light',
      processes: [
        { id: 'p1', name: '裁片', price: 0.5 },
        { id: 'p2', name: '车缝', price: 1.2 },
        { id: 'p3', name: '剪线', price: 0.3 },
        { id: 'p4', name: '品检', price: 0.4 },
        { id: 'p5', name: '包装', price: 0.3 }
      ],
      employees: [],
      orders: [],
      pieceworks: [],
      reworks: []
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return this.defaults();
      const data = JSON.parse(raw);
      return { ...this.defaults(), ...data };
    } catch {
      return this.defaults();
    }
  },

  save(data) {
    localStorage.setItem(this.KEY, JSON.stringify(data));
    // 同步备份到 IndexedDB（静默队列，最多 10 份）
    if (typeof BackupDB !== 'undefined') {
      BackupDB.save(data);
    }
    if (typeof EventBus !== 'undefined') EventBus.emit('data:changed');
  },

  get() { return this.load(); },

  set(data) { this.save(data); },

  /* ---- 订单 ---- */
  getOrders() { return this.get().orders; },

  addOrder(order) {
    const data = this.get();
    data.orders.push(order);
    this.save(data);
    return order;
  },

  updateOrder(id, updates) {
    const data = this.get();
    const idx = data.orders.findIndex(o => o.id === id);
    if (idx >= 0) {
      data.orders[idx] = { ...data.orders[idx], ...updates };
      this.save(data);
    }
  },

  deleteOrder(id) {
    const data = this.get();
    data.orders = data.orders.filter(o => o.id !== id);
    this.save(data);
  },

  /* ---- 计件 ---- */
  getPieceworks() { return this.get().pieceworks; },

  addPiecework(item) {
    const data = this.get();
    data.pieceworks.push(item);
    this.save(data);
    return item;
  },

  deletePiecework(id) {
    const data = this.get();
    data.pieceworks = data.pieceworks.filter(p => p.id !== id);
    this.save(data);
  },

  /* ---- 返工 ---- */
  getReworks() { return this.get().reworks; },

  addRework(item) {
    const data = this.get();
    data.reworks.push(item);
    this.save(data);
    return item;
  },

  deleteRework(id) {
    const data = this.get();
    data.reworks = data.reworks.filter(r => r.id !== id);
    this.save(data);
  },

  /* ---- 设置 ---- */
  updateSettings(updates) {
    const data = { ...this.get(), ...updates };
    this.save(data);
  },

  addEmployee(name) {
    const data = this.get();
    if (!data.employees.includes(name)) {
      data.employees.push(name);
      this.save(data);
    }
  },

  removeEmployee(name) {
    const data = this.get();
    data.employees = data.employees.filter(e => e !== name);
    this.save(data);
  },

  updateProcesses(processes) {
    const data = this.get();
    data.processes = processes;
    this.save(data);
  },

  clearAll() {
    localStorage.removeItem(this.KEY);
  },

  importData(json) {
    const parsed = JSON.parse(json);
    const merged = { ...this.defaults(), ...parsed };
    this.save(merged);
    return merged;
  },

  exportData() {
    return JSON.stringify(this.get(), null, 2);
  }
};
