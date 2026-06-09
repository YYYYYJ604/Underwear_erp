/**
 * 流水线进度模块
 */
const Production = {
  init() {
    document.getElementById('btnUpdateProgress').onclick = () => this.showUpdateForm();
    this.refreshOrderSelect();
    document.getElementById('productionOrderSelect').onchange = () => this.render();
  },

  refreshOrderSelect() {
    const select = document.getElementById('productionOrderSelect');
    const orders = Storage.getOrders().filter(o => Utils.getOrderStatus(o) !== 'done');
    const current = select.value;

    select.innerHTML = orders.length
      ? orders.map(o => `<option value="${o.id}">${o.styleNo} — ${o.customer} (${o.produced || 0}/${o.quantity})</option>`).join('')
      : '<option value="">暂无进行中订单</option>';

    if (current && orders.find(o => o.id === current)) {
      select.value = current;
    }

    this.render();
  },

  render() {
    const orderId = document.getElementById('productionOrderSelect').value;
    const el = document.getElementById('productionPipeline');

    if (!orderId) {
      el.innerHTML = Utils.emptyState('🏭', '请先添加生产订单');
      return;
    }

    const order = Storage.getOrders().find(o => o.id === orderId);
    if (!order) return;

    const processes = Storage.get().processes;
    const progress = order.progress || {};
    const total = order.quantity;

    const stepsHtml = processes.map((proc, i) => {
      const qty = progress[proc.id] || 0;
      const pct = Math.min(100, Math.round((qty / total) * 100));
      const prevQty = i > 0 ? (progress[processes[i - 1].id] || 0) : total;
      const isDone = qty >= total;
      const isActive = qty > 0 && !isDone;
      const prevDone = i === 0 || (progress[processes[i - 1].id] || 0) >= total;

      let circleClass = '';
      if (isDone) circleClass = 'done';
      else if (isActive) circleClass = 'active';

      const connectorDone = isDone;

      return `
        <div class="pipeline-step">
          <div class="step-connector ${connectorDone ? 'done' : ''}"></div>
          <div class="step-circle ${circleClass}">${isDone ? '✓' : i + 1}</div>
          <div class="step-name">${proc.name}</div>
          <div class="step-qty">${qty} / ${total} 件 (${pct}%)</div>
        </div>`;
    }).join('');

    el.innerHTML = `
      <div class="pipeline-card">
        <div class="pipeline-header">
          <div>
            <div class="pipeline-title">${order.styleNo}</div>
            <div class="pipeline-meta">${order.customer} · 总量 ${total} 件 · 交期 ${Utils.formatDate(order.deadline)}</div>
          </div>
          ${Utils.statusBadge(Utils.getOrderStatus(order))}
        </div>
        <div class="pipeline-steps">${stepsHtml}</div>
        <div style="margin-top:24px">
          ${processes.map(proc => {
            const qty = progress[proc.id] || 0;
            const pct = Math.min(100, Math.round((qty / total) * 100));
            return `
              <div class="progress-item">
                <div class="progress-header">
                  <span class="progress-name">${proc.name}</span>
                  <span class="progress-pct">${qty} / ${total} (${pct}%)</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill ${pct >= 100 ? 'done' : ''}" style="width:${pct}%"></div>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>`;
  },

  showUpdateForm() {
    const orderId = document.getElementById('productionOrderSelect').value;
    if (!orderId) {
      Utils.showToast('请先选择订单');
      return;
    }

    const order = Storage.getOrders().find(o => o.id === orderId);
    const processes = Storage.get().processes;
    const progress = order.progress || {};

    const fields = processes.map(proc => `
      <div class="form-group">
        <label>${proc.name}（已完成件数，上限 ${order.quantity}）</label>
        <input class="input progress-input" data-pid="${proc.id}" type="number" min="0" max="${order.quantity}" value="${progress[proc.id] || 0}">
      </div>
    `).join('');

    Utils.openModal(`更新进度 — ${order.styleNo}`, fields, `
      <button class="btn btn-secondary" onclick="Utils.closeModal()">取消</button>
      <button class="btn btn-primary" id="btnSaveProgress">保存进度</button>
    `);

    document.getElementById('btnSaveProgress').onclick = () => {
      const newProgress = { ...progress };
      let valid = true;

      document.querySelectorAll('.progress-input').forEach(input => {
        const val = parseInt(input.value, 10) || 0;
        if (val < 0 || val > order.quantity) valid = false;
        newProgress[input.dataset.pid] = val;
      });

      if (!valid) {
        Utils.showToast('件数不能超过订单总量');
        return;
      }

      Storage.updateOrder(orderId, { progress: newProgress });
      Utils.syncOrderProduced(orderId);

      Utils.closeModal();
      Utils.showToast('进度已更新');
      this.refreshOrderSelect();
      Orders.render();
      Dashboard.render();
    };
  }
};
