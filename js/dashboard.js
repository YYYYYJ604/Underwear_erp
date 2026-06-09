/**
 * 数据看板模块
 */
const Dashboard = {
  render() {
    const data = Storage.get();
    const today = Utils.today();
    const month = Utils.currentMonth();

    // 今日产量：今日计件总数
    const todayPieces = data.pieceworks
      .filter(p => p.date === today)
      .reduce((s, p) => s + (p.quantity || 0), 0);

    // 订单统计
    const activeOrders = data.orders.filter(o => Utils.getOrderStatus(o) !== 'done');
    const warningOrders = data.orders.filter(o => {
      const s = Utils.getOrderStatus(o);
      return s === 'warning' || s === 'overdue';
    });

    // 今日返工
    const todayRework = data.reworks
      .filter(r => r.date === today)
      .reduce((s, r) => s + (r.quantity || 0), 0);

    document.getElementById('statTodayOutput').textContent = todayPieces;
    document.getElementById('statActiveOrders').textContent = activeOrders.length;
    document.getElementById('statWarningOrders').textContent = warningOrders.length;
    document.getElementById('statTodayRework').textContent = todayRework;

    this.renderOrderProgress(data.orders);
    this.renderEmployeeRank(data.pieceworks, month);
    this.renderProcessChart(data.pieceworks, data.processes, today);
    this.render7DayChart(data.pieceworks);
  },

  renderOrderProgress(orders) {
    const el = document.getElementById('dashboardOrderProgress');
    const active = orders.filter(o => Utils.getOrderStatus(o) !== 'done').slice(0, 6);

    if (!active.length) {
      el.innerHTML = Utils.emptyState('📋', '暂无进行中的订单');
      return;
    }

    el.innerHTML = active.map(o => {
      const pct = Math.min(100, Math.round(((o.produced || 0) / o.quantity) * 100));
      const status = Utils.getOrderStatus(o);
      return `
        <div class="order-progress-item">
          <div class="order-progress-top">
            <span><strong>${o.styleNo}</strong> · ${o.customer}</span>
            ${Utils.statusBadge(status)}
          </div>
          <div class="progress-bar">
            <div class="progress-fill ${pct >= 100 ? 'done' : ''}" style="width:${pct}%"></div>
          </div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">
            ${o.produced || 0} / ${o.quantity} 件 · 交期 ${Utils.formatDate(o.deadline)}
          </div>
        </div>`;
    }).join('');
  },

  renderEmployeeRank(pieceworks, month) {
    const el = document.getElementById('dashboardEmployeeRank');
    const monthData = pieceworks.filter(p => p.date && p.date.startsWith(month));

    const map = {};
    monthData.forEach(p => {
      map[p.employee] = (map[p.employee] || 0) + (p.quantity || 0);
    });

    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);

    if (!sorted.length) {
      el.innerHTML = Utils.emptyState('👷', '本月暂无计件记录');
      return;
    }

    el.innerHTML = sorted.map(([name, qty], i) => `
      <div class="rank-item">
        <div class="rank-num ${i < 3 ? 'top' : ''}">${i + 1}</div>
        <div class="rank-name">${name}</div>
        <div class="rank-value">${qty} 件</div>
      </div>
    `).join('');
  },

  renderProcessChart(pieceworks, processes, today) {
    const el = document.getElementById('dashboardProcessChart');
    const todayData = pieceworks.filter(p => p.date === today);

    const map = {};
    todayData.forEach(p => {
      map[p.processName] = (map[p.processName] || 0) + (p.quantity || 0);
    });

    const max = Math.max(...Object.values(map), 1);

    if (!todayData.length) {
      el.innerHTML = Utils.emptyState('📈', '今日暂无产量数据');
      return;
    }

    const items = processes.map(proc => ({
      name: proc.name,
      qty: map[proc.name] || 0
    })).filter(p => p.qty > 0);

    if (!items.length) {
      el.innerHTML = Utils.emptyState('📈', '今日暂无产量数据');
      return;
    }

    el.innerHTML = `<div class="bar-chart">${items.map(p => `
      <div class="bar-row">
        <div class="bar-label">${p.name}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${Math.round((p.qty / max) * 100)}%">${p.qty}</div>
        </div>
      </div>
    `).join('')}</div>`;
  },

  render7DayChart(pieceworks) {
    const canvas = document.getElementById('chart7Days');
    if (!canvas) return;

    const days = Utils.lastNDays(7);
    const values = days.map(d =>
      pieceworks.filter(p => p.date === d).reduce((s, p) => s + (p.quantity || 0), 0)
    );

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    const W = Math.max(rect.width - 40, 300);
    const H = 200;

    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);

    const pad = { top: 20, right: 20, bottom: 36, left: 48 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;
    const max = Math.max(...values, 1);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const lineColor = isDark ? '#60a5fa' : '#2563eb';
    const fillColor = isDark ? 'rgba(96,165,250,0.15)' : 'rgba(37,99,235,0.1)';

    ctx.clearRect(0, 0, W, H);

    // 网格线
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (chartH / 4) * i;
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + chartW, y);
      ctx.stroke();

      const val = Math.round(max - (max / 4) * i);
      ctx.fillStyle = textColor;
      ctx.font = '11px Microsoft YaHei';
      ctx.textAlign = 'right';
      ctx.fillText(val, pad.left - 8, y + 4);
    }

    const points = values.map((v, i) => ({
      x: pad.left + (chartW / (days.length - 1)) * i,
      y: pad.top + chartH - (v / max) * chartH,
      v
    }));

    // 填充区域
    ctx.beginPath();
    ctx.moveTo(points[0].x, pad.top + chartH);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, pad.top + chartH);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();

    // 折线
    ctx.beginPath();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();

    // 数据点 + 标签
    points.forEach((p, i) => {
      ctx.fillStyle = lineColor;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = textColor;
      ctx.font = '11px Microsoft YaHei';
      ctx.textAlign = 'center';
      ctx.fillText(Utils.formatShortDate(days[i]), p.x, H - 10);

      if (p.v > 0) {
        ctx.fillStyle = lineColor;
        ctx.font = 'bold 11px Microsoft YaHei';
        ctx.fillText(p.v, p.x, p.y - 10);
      }
    });

    if (values.every(v => v === 0)) {
      ctx.fillStyle = textColor;
      ctx.font = '14px Microsoft YaHei';
      ctx.textAlign = 'center';
      ctx.fillText('近 7 日暂无产量', W / 2, H / 2);
    }
  }
};
