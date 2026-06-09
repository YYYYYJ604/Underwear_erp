/**
 * 事件总线 — 数据变更统一通知（DeepSeek 建议：避免 DOM 直接同步混乱）
 */
const EventBus = {
  emit(event, detail) {
    document.dispatchEvent(new CustomEvent(event, { detail }));
  },
  on(event, handler) {
    document.addEventListener(event, handler);
  }
};

/**
 * 工具函数
 */
const Utils = {
  uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  },

  today() {
    return new Date().toISOString().slice(0, 10);
  },

  currentMonth() {
    return new Date().toISOString().slice(0, 7);
  },

  formatDate(d) {
    if (!d) return '-';
    return d.slice(0, 10);
  },

  formatMoney(n) {
    return (Math.round(n * 100) / 100).toFixed(2);
  },

  /** 订单状态：normal / warning / overdue / done */
  getOrderStatus(order) {
    const produced = order.produced || 0;
    const total = order.quantity || 0;

    if (produced >= total) return 'done';

    const deadline = new Date(order.deadline);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil((deadline - now) / 86400000);

    if (daysLeft < 0) return 'overdue';
    if (daysLeft <= 3) return 'warning';
    return 'normal';
  },

  statusLabel(status) {
    const map = {
      normal: '正常',
      warning: '预警',
      overdue: '延期',
      done: '已完成'
    };
    return map[status] || status;
  },

  statusBadge(status) {
    const cls = { normal: 'badge-normal', warning: 'badge-warning', overdue: 'badge-overdue', done: 'badge-done' };
    return `<span class="badge ${cls[status] || ''}">${this.statusLabel(status)}</span>`;
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  /** 近 N 天日期列表（含今天） */
  lastNDays(n) {
    const days = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  },

  formatShortDate(dateStr) {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  },

  /** 计件录入后同步累加流水线进度 */
  syncProgressFromPiecework(styleNo, processId, quantity) {
    if (!styleNo || !processId || !quantity) return false;
    const data = Storage.get();
    const order = data.orders.find(o => o.styleNo === styleNo);
    if (!order) return false;

    const progress = { ...(order.progress || {}) };
    const current = progress[processId] || 0;
    progress[processId] = Math.min(order.quantity, current + quantity);
    Storage.updateOrder(order.id, { progress });
    Utils.syncOrderProduced(order.id);
    return true;
  },

  /** 根据流水线最后一道工序（包装）更新订单已生产数 */
  syncOrderProduced(orderId) {
    const data = Storage.get();
    const order = data.orders.find(o => o.id === orderId);
    if (!order) return;

    const processes = data.processes;
    const lastProcess = processes[processes.length - 1];
    if (!lastProcess) return;

    const lastStep = (order.progress || {})[lastProcess.id] || 0;
    Storage.updateOrder(orderId, { produced: lastStep });
  },

  showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2500);
  },

  /* ---- 模态框 ---- */
  openModal(title, bodyHtml, footerHtml, opts = {}) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHtml;
    document.getElementById('modalFooter').innerHTML = footerHtml || '';
    document.getElementById('modal').classList.toggle('modal-lg', !!opts.large);
    document.getElementById('modalOverlay').classList.add('show');
  },

  closeModal() {
    document.getElementById('modalOverlay').classList.remove('show');
    document.getElementById('modal').classList.remove('modal-lg');
  },

  confirm(msg) {
    return new Promise(resolve => {
      Utils.openModal('确认操作', `<p>${msg}</p>`, `
        <button class="btn btn-secondary" id="confirmCancel">取消</button>
        <button class="btn btn-danger" id="confirmOk">确定</button>
      `);
      document.getElementById('confirmCancel').onclick = () => { Utils.closeModal(); resolve(false); };
      document.getElementById('confirmOk').onclick = () => { Utils.closeModal(); resolve(true); };
    });
  },

  /** 导出 CSV（Excel 兼容，带 BOM） */
  exportCSV(filename, headers, rows) {
    const bom = '\uFEFF';
    const csv = [headers.join(','), ...rows.map(r =>
      r.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
    )].join('\n');
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  },

  emptyState(icon, text) {
    return `<div class="empty-state"><div class="empty-state-icon">${icon}</div><p>${text}</p></div>`;
  },

  /** 应用主题 */
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('btnToggleTheme');
    if (btn) btn.textContent = theme === 'dark' ? '☀️ 浅色' : '🌙 深色';
  },

  toggleTheme() {
    const data = Storage.get();
    const next = data.theme === 'dark' ? 'light' : 'dark';
    Storage.updateSettings({ theme: next });
    Utils.applyTheme(next);
    if (typeof App !== 'undefined' && App.currentPage === 'dashboard') Dashboard.render();
    Utils.showToast(next === 'dark' ? '已切换深色模式' : '已切换浅色模式');
  },

  /** 打印工资条 */
  printWageSlips(month) {
    const data = Storage.get();
    const records = data.pieceworks.filter(p => p.date && p.date.startsWith(month));
    if (!records.length) {
      Utils.showToast('本月无计件数据');
      return;
    }

    const byEmployee = {};
    records.forEach(p => {
      if (!byEmployee[p.employee]) byEmployee[p.employee] = { items: [], totalPieces: 0, totalWage: 0 };
      const wage = p.quantity * p.unitPrice;
      byEmployee[p.employee].items.push(p);
      byEmployee[p.employee].totalPieces += p.quantity;
      byEmployee[p.employee].totalWage += wage;
    });

    const slips = Object.entries(byEmployee).map(([name, info]) => `
      <div class="slip">
        <h2>${Utils.escapeHtml(data.companyName)}</h2>
        <h3>计件工资条 — ${month}</h3>
        <p class="meta">员工：<strong>${Utils.escapeHtml(name)}</strong> &nbsp;|&nbsp; 打印日期：${Utils.today()}</p>
        <table>
          <thead><tr><th>日期</th><th>工序</th><th>款号</th><th>件数</th><th>单价</th><th>金额</th></tr></thead>
          <tbody>
            ${info.items.map(p => `<tr>
              <td>${p.date}</td><td>${Utils.escapeHtml(p.processName)}</td><td>${Utils.escapeHtml(p.styleNo || '-')}</td>
              <td>${p.quantity}</td><td>${Utils.formatMoney(p.unitPrice)}</td><td>${Utils.formatMoney(p.quantity * p.unitPrice)}</td>
            </tr>`).join('')}
          </tbody>
          <tfoot>
            <tr><td colspan="3"><strong>合计</strong></td><td><strong>${info.totalPieces}</strong></td><td></td><td><strong>¥${Utils.formatMoney(info.totalWage)}</strong></td></tr>
          </tfoot>
        </table>
        <p class="sign">员工签字：____________ &nbsp;&nbsp; 主管签字：____________</p>
      </div>
    `).join('');

    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8">
      <title>工资条_${month}</title>
      <style>
        body{font-family:"Microsoft YaHei",sans-serif;padding:20px;color:#111}
        .slip{page-break-after:always;margin-bottom:40px}
        .slip:last-child{page-break-after:auto}
        h2{font-size:18px;margin:0 0 4px} h3{font-size:15px;color:#333;margin:0 0 12px}
        .meta{font-size:13px;color:#555;margin-bottom:16px}
        table{width:100%;border-collapse:collapse;font-size:13px}
        th,td{border:1px solid #ccc;padding:8px;text-align:left}
        th{background:#f0f0f0} tfoot td{background:#f9f9f9}
        .sign{margin-top:32px;font-size:13px}
        @media print{body{padding:0}.slip{margin-bottom:0}}
      </style></head><body>${slips}</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
  }
};

// 模态框关闭
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('modalClose').onclick = Utils.closeModal;
  document.getElementById('modalOverlay').onclick = (e) => {
    if (e.target.id === 'modalOverlay') Utils.closeModal();
  };
});
