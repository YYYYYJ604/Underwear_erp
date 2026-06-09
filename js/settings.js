/**
 * 系统设置模块
 */
const Settings = {
  init() {
    document.getElementById('btnSaveCompany').onclick = () => this.saveCompany();
    document.getElementById('btnAddProcess').onclick = () => this.addProcess();
    document.getElementById('btnAddEmployee').onclick = () => this.addEmployee();
    document.getElementById('btnExportData').onclick = () => this.exportBackup();
    document.getElementById('btnImportData').onchange = (e) => this.importBackup(e);
    document.getElementById('btnClearData').onclick = () => this.clearAll();
    document.getElementById('btnLoadDemo').onclick = () => DemoData.load();
    document.getElementById('btnRestoreFromIndexedDB').onclick = () => this.restoreFromIndexedDB();
  },

  render() {
    const data = Storage.get();
    document.getElementById('settingCompanyName').value = data.companyName;
    document.getElementById('sidebarCompanyName').textContent = data.companyName;
    this.renderProcesses(data.processes);
    this.renderEmployees(data.employees);
    this.renderBackupStatus();
  },

  async renderBackupStatus() {
    const el = document.getElementById('backupStatus');
    if (!el) return;
    try {
      const list = await BackupDB.getList();
      const count = list.length;
      const latest = list[0];
      const dateStr = latest ? new Date(latest.timestamp).toLocaleString('zh-CN', { hour12: false }) : '暂无';
      el.innerHTML = '<div style="padding:12px 0">' +
        '<div style="margin-bottom:8px"><strong>IndexedDB 自动备份</strong></div>' +
        '<div style="font-size:13px;color:var(--text-muted);line-height:1.8">' +
        '📦 已备份：' + count + ' / 10 份<br>' +
        '🕐 最近一次：' + dateStr + '<br>' +
        '🔄 机制：每次操作自动备份，超出10份自动删除最旧的' +
        '</div></div>';
    } catch (e) {
      el.innerHTML = '<div style="padding:12px 0;font-size:13px;color:var(--text-muted)">备份状态读取失败</div>';
    }
  },

  renderProcesses(processes) {
    const el = document.getElementById('processPriceList');
    if (!el) return;
    el.innerHTML = processes.map((p, i) => `
      <div class="process-row" data-idx="${i}">
        <input class="input" value="${p.name}" data-field="name" placeholder="工序名">
        <input class="input price" type="number" step="0.01" min="0" value="${p.price}" data-field="price" placeholder="单价">
        <span style="font-size:13px;color:var(--text-muted)">元/件</span>
        <button class="btn-icon danger" onclick="Settings.removeProcess(${i})">删</button>
      </div>
    `).join('');

    el.querySelectorAll('.process-row input').forEach(input => {
      input.onchange = () => this.saveProcesses();
    });
  },

  saveProcesses() {
    const rows = document.querySelectorAll('.process-row');
    const data = Storage.get();
    const processes = [];

    rows.forEach((row, i) => {
      const name = row.querySelector('[data-field="name"]').value.trim();
      const price = parseFloat(row.querySelector('[data-field="price"]').value) || 0;
      const oldId = data.processes[i]?.id || Utils.uid();
      if (name) processes.push({ id: oldId, name, price });
    });

    Storage.updateProcesses(processes);
    Utils.showToast('工序已保存');
  },

  addProcess() {
    const data = Storage.get();
    data.processes.push({ id: Utils.uid(), name: '新工序', price: 0 });
    Storage.updateProcesses(data.processes);
    this.renderProcesses(data.processes);
  },

  removeProcess(idx) {
    const data = Storage.get();
    if (data.processes.length <= 1) {
      Utils.showToast('至少保留一个工序');
      return;
    }
    data.processes.splice(idx, 1);
    Storage.updateProcesses(data.processes);
    this.renderProcesses(data.processes);
    Utils.showToast('工序已删除');
  },

  renderEmployees(employees) {
    const el = document.getElementById('employeeList');
    if (!el) return;
    if (!employees.length) {
      el.innerHTML = '<span style="color:var(--text-muted);font-size:13px">暂无员工，请添加</span>';
      return;
    }
    el.innerHTML = employees.map(name => `
      <span class="tag">
        ${name}
        <button class="tag-remove" onclick="Settings.removeEmployee('${name}')">&times;</button>
      </span>
    `).join('');
  },

  addEmployee() {
    const input = document.getElementById('newEmployeeName');
    const name = input.value.trim();
    if (!name) {
      Utils.showToast('请输入员工姓名');
      return;
    }
    Storage.addEmployee(name);
    input.value = '';
    this.renderEmployees(Storage.get().employees);
    Utils.showToast('员工已添加');
  },

  removeEmployee(name) {
    Storage.removeEmployee(name);
    this.renderEmployees(Storage.get().employees);
    Utils.showToast('已移除');
  },

  saveCompany() {
    const name = document.getElementById('settingCompanyName').value.trim();
    if (!name) {
      Utils.showToast('公司名称不能为空');
      return;
    }
    Storage.updateSettings({ companyName: name });
    document.getElementById('sidebarCompanyName').textContent = name;
    document.title = name + ' — 车间生产管理系统';
    Utils.showToast('公司已保存');
  },

  exportBackup() {
    const json = Storage.exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '海誉车间数据备份_' + Utils.today() + '.json';
    link.click();
    URL.revokeObjectURL(link.href);
    Utils.showToast('备份已导出');
  },

  importBackup(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const ok = await Utils.confirm('导入将覆盖当前全部数据，确定继续？');
        if (!ok) return;
        Storage.importData(ev.target.result);
        Utils.showToast('数据导入成功');
        App.refreshAll();
      } catch {
        Utils.showToast('文件格式错误，导入失败');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  },

  async clearAll() {
    const ok = await Utils.confirm('此操作不可恢复！确定清空全部数据？');
    if (!ok) return;
    Storage.clearAll();
    Utils.showToast('数据已清空');
    App.refreshAll();
  },

  async restoreFromIndexedDB() {
    try {
      const list = await BackupDB.getList();
      if (!list.length) {
        Utils.showToast('IndexedDB 中暂无备份数据');
        return;
      }

      const latest = list[0];
      const dateStr = new Date(latest.timestamp).toLocaleString('zh-CN', { hour12: false });

      const ok = await Utils.confirm('将从 IndexedDB 恢复最新备份（' + dateStr + '），当前数据将被覆盖，确定继续？');
      if (!ok) return;

      const data = await BackupDB.getById(latest.id);
      if (!data) {
        Utils.showToast('备份数据读取失败');
        return;
      }

      Storage.set(data);
      Utils.showToast('已从 ' + dateStr + ' 的备份恢复数据');
      App.refreshAll();
    } catch (e) {
      Utils.showToast('恢复失败：' + e.message);
    }
  }
};
