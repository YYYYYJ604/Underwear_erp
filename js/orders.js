/**
 * 生产订单模块
 */
const Orders = {
  init() {
    document.getElementById('btnAddOrder').onclick = () => this.showForm();
    document.getElementById('orderSearch').oninput = () => this.render();
    document.getElementById('orderFilter').onchange = () => this.render();
  },

  render() {
    const search = document.getElementById('orderSearch').value.trim().toLowerCase();
    const filter = document.getElementById('orderFilter').value;
    let orders = Storage.getOrders();

    if (search) {
      orders = orders.filter(o =>
        o.customer.toLowerCase().includes(search) ||
        o.styleNo.toLowerCase().includes(search)
      );
    }

    if (filter !== 'all') {
      orders = orders.filter(o => Utils.getOrderStatus(o) === filter);
    }

    orders.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    const tbody = document.getElementById('orderTableBody');

    if (!orders.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="table-empty">暂无订单，点击「新增订单」开始</td></tr>`;
      return;
    }

    tbody.innerHTML = orders.map(o => {
      const produced = o.produced || 0;
      const remaining = Math.max(0, o.quantity - produced);
      const status = Utils.getOrderStatus(o);
      return `
        <tr>
          <td>${o.customer}</td>
          <td><strong>${o.styleNo}</strong></td>
          <td>${o.quantity}</td>
          <td>${produced}</td>
          <td>${remaining}</td>
          <td>${Utils.formatDate(o.deadline)}</td>
          <td>${Utils.statusBadge(status)}</td>
          <td>
            <button class="btn-icon" onclick="Orders.showDetail('${o.id}')">详情</button>
            <button class="btn-icon" onclick="Orders.showForm('${o.id}')">编辑</button>
            <button class="btn-icon danger" onclick="Orders.remove('${o.id}')">删除</button>
          </td>
        </tr>`;
    }).join('');
  },

  showForm(id) {
    const order = id ? Storage.getOrders().find(o => o.id === id) : null;
    const isEdit = !!order;

    Utils.openModal(isEdit ? '编辑订单' : '新增订单', `
      <div class="form-group">
        <label>客户名称</label>
        <input class="input" id="fCustomer" value="${order?.customer || ''}" placeholder="如：某某贸易公司">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>款号</label>
          <input class="input" id="fStyleNo" value="${order?.styleNo || ''}" placeholder="如：HY-2026-001">
        </div>
        <div class="form-group">
          <label>数量（件）</label>
          <input class="input" id="fQuantity" type="number" min="1" value="${order?.quantity || ''}">
        </div>
      </div>
      <div class="form-group">
        <label>交期</label>
        <input class="input" id="fDeadline" type="date" value="${order?.deadline?.slice(0, 10) || ''}">
      </div>
      <div class="form-group">
        <label>备注</label>
        <input class="input" id="fRemark" value="${order?.remark || ''}" placeholder="可选">
      </div>
    `, `
      <button class="btn btn-secondary" onclick="Utils.closeModal()">取消</button>
      <button class="btn btn-primary" id="btnSaveOrder">保存</button>
    `);

    document.getElementById('btnSaveOrder').onclick = () => {
      const customer = document.getElementById('fCustomer').value.trim();
      const styleNo = document.getElementById('fStyleNo').value.trim();
      const quantity = parseInt(document.getElementById('fQuantity').value, 10);
      const deadline = document.getElementById('fDeadline').value;
      const remark = document.getElementById('fRemark').value.trim();

      if (!customer || !styleNo || !quantity || !deadline) {
        Utils.showToast('请填写完整信息');
        return;
      }

      if (isEdit) {
        Storage.updateOrder(id, { customer, styleNo, quantity, deadline, remark });
      } else {
        const processes = Storage.get().processes;
        const progress = {};
        processes.forEach(p => { progress[p.id] = 0; });

        Storage.addOrder({
          id: Utils.uid(),
          customer, styleNo, quantity, deadline, remark,
          produced: 0,
          progress,
          createdAt: new Date().toISOString()
        });
      }

      Utils.closeModal();
      Utils.showToast(isEdit ? '订单已更新' : '订单已添加');
      this.render();
      Dashboard.render();
      Production.refreshOrderSelect();
    };
  },

  showDetail(id) {
    const data = Storage.get();
    const order = data.orders.find(o => o.id === id);
    if (!order) return;

    const status = Utils.getOrderStatus(order);
    const produced = order.produced || 0;
    const pct = Math.min(100, Math.round((produced / order.quantity) * 100));
    const progress = order.progress || {};

    const progressHtml = data.processes.map(proc => {
      const qty = progress[proc.id] || 0;
      const p = Math.min(100, Math.round((qty / order.quantity) * 100));
      return `
        <div class="progress-item">
          <div class="progress-header">
            <span class="progress-name">${proc.name}</span>
            <span class="progress-pct">${qty} / ${order.quantity} (${p}%)</span>
          </div>
          <div class="progress-bar"><div class="progress-fill ${p >= 100 ? 'done' : ''}" style="width:${p}%"></div></div>
        </div>`;
    }).join('');

    const pieceworks = data.pieceworks.filter(p => p.styleNo === order.styleNo).slice(0, 20);
    const reworks = data.reworks.filter(r => r.styleNo === order.styleNo).slice(0, 20);

    const pwHtml = pieceworks.length
      ? `<table class="table table-sm"><thead><tr><th>日期</th><th>员工</th><th>工序</th><th>件数</th></tr></thead><tbody>
          ${pieceworks.map(p => `<tr><td>${p.date}</td><td>${Utils.escapeHtml(p.employee)}</td><td>${Utils.escapeHtml(p.processName)}</td><td>${p.quantity}</td></tr>`).join('')}
        </tbody></table>`
      : '<p class="hint">暂无关联计件记录</p>';

    const rwHtml = reworks.length
      ? `<table class="table table-sm"><thead><tr><th>日期</th><th>员工</th><th>工序</th><th>问题</th><th>件数</th></tr></thead><tbody>
          ${reworks.map(r => `<tr><td>${r.date}</td><td>${Utils.escapeHtml(r.employee)}</td><td>${Utils.escapeHtml(r.processName)}</td><td>${Utils.escapeHtml(r.issue)}</td><td>${r.quantity}</td></tr>`).join('')}
        </tbody></table>`
      : '<p class="hint">暂无返工记录</p>';

    Utils.openModal(`订单详情 — ${order.styleNo}`, `
      <div class="detail-grid">
        <div class="detail-section">
          <h4>基本信息</h4>
          <p>客户：${Utils.escapeHtml(order.customer)}</p>
          <p>款号：<strong>${Utils.escapeHtml(order.styleNo)}</strong></p>
          <p>数量：${order.quantity} 件 · 已生产：${produced} 件 · 剩余：${Math.max(0, order.quantity - produced)} 件</p>
          <p>交期：${Utils.formatDate(order.deadline)} · 状态：${Utils.statusBadge(status)}</p>
          ${order.remark ? `<p>备注：${Utils.escapeHtml(order.remark)}</p>` : ''}
          <div class="progress-item" style="margin-top:12px">
            <div class="progress-header"><span>总进度</span><span>${pct}%</span></div>
            <div class="progress-bar"><div class="progress-fill ${pct >= 100 ? 'done' : ''}" style="width:${pct}%"></div></div>
          </div>
        </div>
        <div class="detail-section">
          <h4>工序进度</h4>
          ${progressHtml}
        </div>
        <div class="detail-section">
          <h4>关联计件（最近 20 条）</h4>
          ${pwHtml}
        </div>
        <div class="detail-section">
          <h4>返工记录（最近 20 条）</h4>
          ${rwHtml}
        </div>
      </div>
    `, `
      <button class="btn btn-secondary" onclick="Utils.closeModal()">关闭</button>
      <button class="btn btn-primary" onclick="Utils.closeModal();App.navigate('production');document.getElementById('productionOrderSelect').value='${order.id}';Production.render();">查看流水线</button>
    `, { large: true });
  },

  async remove(id) {
    const ok = await Utils.confirm('确定删除此订单？相关进度数据也会丢失。');
    if (!ok) return;
    Storage.deleteOrder(id);
    Utils.showToast('订单已删除');
    this.render();
    Dashboard.render();
    Production.refreshOrderSelect();
  }
};
