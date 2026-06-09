/**
 * 员工计件模块
 */
const Piecework = {
  init() {
    document.getElementById('btnAddPiecework').onclick = () => this.showForm();
    document.getElementById('btnExportPiecework').onclick = () => this.exportExcel();
    document.getElementById('btnPrintWage').onclick = () => {
      Utils.printWageSlips(document.getElementById('pieceworkMonth').value);
    };
    document.getElementById('pieceworkMonth').value = Utils.currentMonth();
    document.getElementById('pieceworkMonth').onchange = () => this.render();
  },

  render() {
    const month = document.getElementById('pieceworkMonth').value;
    const all = Storage.getPieceworks();
    const filtered = all.filter(p => p.date && p.date.startsWith(month));
    filtered.sort((a, b) => b.date.localeCompare(a.date));

    const today = Utils.today();
    const todayPieces = all.filter(p => p.date === today).reduce((s, p) => s + p.quantity, 0);
    const monthPieces = filtered.reduce((s, p) => s + p.quantity, 0);
    const monthWage = filtered.reduce((s, p) => s + p.quantity * p.unitPrice, 0);

    document.getElementById('statTodayPieces').textContent = todayPieces;
    document.getElementById('statMonthPieces').textContent = monthPieces;
    document.getElementById('statMonthWage').textContent = Utils.formatMoney(monthWage);

    const tbody = document.getElementById('pieceworkTableBody');
    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="table-empty">本月暂无计件记录</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(p => `
      <tr>
        <td>${p.date}</td>
        <td>${p.employee}</td>
        <td>${p.processName}</td>
        <td>${p.styleNo || '-'}</td>
        <td>${p.quantity}</td>
        <td>¥${Utils.formatMoney(p.unitPrice)}</td>
        <td><strong>¥${Utils.formatMoney(p.quantity * p.unitPrice)}</strong></td>
        <td>
          <button class="btn-icon danger" onclick="Piecework.remove('${p.id}')">删除</button>
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

    const procOptions = processes.map(p =>
      `<option value="${p.id}" data-price="${p.price}">${p.name} (¥${p.price}/件)</option>`
    ).join('');

    const orderOptions = '<option value="">不关联订单</option>' +
      orders.map(o => `<option value="${o.styleNo}">${o.styleNo} — ${o.customer}</option>`).join('');

    Utils.openModal('录入计件', `
      <div class="form-row">
        <div class="form-group">
          <label>日期</label>
          <input class="input" id="fPwDate" type="date" value="${Utils.today()}">
        </div>
        <div class="form-group">
          <label>员工</label>
          <select class="select" id="fPwEmployee" style="width:100%">${empOptions}</select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>工序</label>
          <select class="select" id="fPwProcess" style="width:100%">${procOptions}</select>
        </div>
        <div class="form-group">
          <label>件数</label>
          <input class="input" id="fPwQty" type="number" min="1" placeholder="完成件数">
        </div>
      </div>
      <div class="form-group">
        <label>关联款号</label>
        <select class="select" id="fPwStyleNo" style="width:100%">${orderOptions}</select>
      </div>
      <div class="form-group">
        <label class="checkbox-label">
          <input type="checkbox" id="fPwSyncProgress" checked>
          同步更新流水线进度（累加至对应工序）
        </label>
      </div>
    `, `
      <button class="btn btn-secondary" onclick="Utils.closeModal()">取消</button>
      <button class="btn btn-primary" id="btnSavePiecework">保存</button>
    `);

    document.getElementById('btnSavePiecework').onclick = () => {
      const date = document.getElementById('fPwDate').value;
      const employee = document.getElementById('fPwEmployee').value;
      const processSelect = document.getElementById('fPwProcess');
      const processId = processSelect.value;
      const processName = processSelect.selectedOptions[0]?.text.split(' (')[0] || '';
      const unitPrice = parseFloat(processSelect.selectedOptions[0]?.dataset.price) || 0;
      const quantity = parseInt(document.getElementById('fPwQty').value, 10);
      const styleNo = document.getElementById('fPwStyleNo').value;

      if (!date || !employee || !processId || !quantity) {
        Utils.showToast('请填写完整信息');
        return;
      }

      Storage.addPiecework({
        id: Utils.uid(),
        date, employee, processId, processName, unitPrice, quantity, styleNo,
        createdAt: new Date().toISOString()
      });

      let toastMsg = '计件已录入';
      const syncProgress = document.getElementById('fPwSyncProgress').checked;
      if (syncProgress && styleNo) {
        const synced = Utils.syncProgressFromPiecework(styleNo, processId, quantity);
        if (synced) {
          Production.refreshOrderSelect();
          Orders.render();
          toastMsg = '计件已录入，进度已同步';
        } else {
          toastMsg = '计件已保存，但未找到匹配订单，进度未同步';
        }
      }

      Utils.closeModal();
      Utils.showToast(toastMsg);
      this.render();
      Dashboard.render();
    };
  },

  exportExcel() {
    const month = document.getElementById('pieceworkMonth').value;
    const data = Storage.getPieceworks().filter(p => p.date.startsWith(month));

    if (!data.length) {
      Utils.showToast('本月无数据可导出');
      return;
    }

    // 按员工汇总
    const summary = {};
    data.forEach(p => {
      if (!summary[p.employee]) summary[p.employee] = { pieces: 0, wage: 0 };
      summary[p.employee].pieces += p.quantity;
      summary[p.employee].wage += p.quantity * p.unitPrice;
    });

    const detailRows = data.map(p => [
      p.date, p.employee, p.processName, p.styleNo || '',
      p.quantity, p.unitPrice, Utils.formatMoney(p.quantity * p.unitPrice)
    ]);

    const summaryRows = Object.entries(summary).map(([name, v]) => [
      name, v.pieces, Utils.formatMoney(v.wage)
    ]);

    // 导出明细
    Utils.exportCSV(`计件明细_${month}.csv`,
      ['日期', '员工', '工序', '款号', '件数', '单价', '工资'],
      detailRows
    );

    setTimeout(() => {
      Utils.exportCSV(`计件汇总_${month}.csv`,
        ['员工', '总件数', '总工资(元)'],
        summaryRows
      );
      Utils.showToast('已导出明细和汇总两个文件');
    }, 300);
  },

  async remove(id) {
    const ok = await Utils.confirm('确定删除此计件记录？');
    if (!ok) return;
    Storage.deletePiecework(id);
    Utils.showToast('已删除');
    this.render();
    Dashboard.render();
  }
};
