/**
 * 次品 / 返工模块
 */
const Rework = {
  init() {
    document.getElementById('btnAddRework').onclick = () => this.showForm();
    document.getElementById('reworkMonth').value = Utils.currentMonth();
    document.getElementById('reworkMonth').onchange = () => this.render();
  },

  render() {
    const month = document.getElementById('reworkMonth').value;
    const all = Storage.getReworks();
    const filtered = all.filter(r => r.date && r.date.startsWith(month));
    filtered.sort((a, b) => b.date.localeCompare(a.date));

    const monthQty = filtered.reduce((s, r) => s + (r.quantity || 0), 0);
    const employees = new Set(filtered.map(r => r.employee));

    // 返工率 = 返工件数 / 同月计件总数
    const monthPieces = Storage.getPieceworks()
      .filter(p => p.date.startsWith(month))
      .reduce((s, p) => s + p.quantity, 0);
    const rate = monthPieces > 0 ? ((monthQty / monthPieces) * 100).toFixed(1) : '0.0';

    document.getElementById('statMonthRework').textContent = monthQty;
    document.getElementById('statReworkRate').textContent = rate + '%';
    document.getElementById('statReworkEmployees').textContent = employees.size;

    const tbody = document.getElementById('reworkTableBody');
    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="table-empty">本月暂无返工记录</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(r => `
      <tr>
        <td>${r.date}</td>
        <td>${r.employee}</td>
        <td>${r.styleNo || '-'}</td>
        <td>${r.processName}</td>
        <td>${r.issue}</td>
        <td>${r.quantity}</td>
        <td>
          <button class="btn-icon danger" onclick="Rework.remove('${r.id}')">删除</button>
        </td>
      </tr>
    `).join('');
  },

  showForm() {
    const data = Storage.get();
    const employees = data.employees;
    const processes = data.processes;
    const orders = data.orders;

    const empOptions = employees.length
      ? employees.map(e => `<option value="${e}">${e}</option>`).join('')
      : '<option value="">请先在设置中添加员工</option>';

    const procOptions = processes.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    const orderOptions = '<option value="">不指定款号</option>' +
      orders.map(o => `<option value="${o.styleNo}">${o.styleNo}</option>`).join('');

    const issueOptions = ['线头未剪', '针距不均', '尺寸偏差', '污渍', '跳线/断线', '包装不良', '其他'].map(i =>
      `<option value="${i}">${i}</option>`
    ).join('');

    Utils.openModal('记录返工', `
      <div class="form-row">
        <div class="form-group">
          <label>日期</label>
          <input class="input" id="fRwDate" type="date" value="${Utils.today()}">
        </div>
        <div class="form-group">
          <label>责任员工</label>
          <select class="select" id="fRwEmployee" style="width:100%">${empOptions}</select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>款号</label>
          <select class="select" id="fRwStyleNo" style="width:100%">${orderOptions}</select>
        </div>
        <div class="form-group">
          <label>工序</label>
          <select class="select" id="fRwProcess" style="width:100%">${procOptions}</select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>问题类型</label>
          <select class="select" id="fRwIssue" style="width:100%">${issueOptions}</select>
        </div>
        <div class="form-group">
          <label>返工件数</label>
          <input class="input" id="fRwQty" type="number" min="1" placeholder="件数">
        </div>
      </div>
      <div class="form-group">
        <label>详细说明（可选）</label>
        <input class="input" id="fRwNote" placeholder="补充说明">
      </div>
    `, `
      <button class="btn btn-secondary" onclick="Utils.closeModal()">取消</button>
      <button class="btn btn-primary" id="btnSaveRework">保存</button>
    `);

    document.getElementById('btnSaveRework').onclick = () => {
      const date = document.getElementById('fRwDate').value;
      const employee = document.getElementById('fRwEmployee').value;
      const styleNo = document.getElementById('fRwStyleNo').value;
      const processSelect = document.getElementById('fRwProcess');
      const processId = processSelect.value;
      const processName = processSelect.selectedOptions[0]?.text || '';
      let issue = document.getElementById('fRwIssue').value;
      const note = document.getElementById('fRwNote').value.trim();
      const quantity = parseInt(document.getElementById('fRwQty').value, 10);

      if (note) issue += '：' + note;

      if (!date || !employee || !processId || !quantity) {
        Utils.showToast('请填写完整信息');
        return;
      }

      Storage.addRework({
        id: Utils.uid(),
        date, employee, styleNo, processId, processName, issue, quantity,
        createdAt: new Date().toISOString()
      });

      Utils.closeModal();
      Utils.showToast('返工已记录');
      this.render();
      Dashboard.render();
    };
  },

  async remove(id) {
    const ok = await Utils.confirm('确定删除此返工记录？');
    if (!ok) return;
    Storage.deleteRework(id);
    Utils.showToast('已删除');
    this.render();
    Dashboard.render();
  }
};
