/**
 * 演示数据 — 一键加载体验全貌
 */
const DemoData = {
  generate() {
    const processes = [
      { id: 'p1', name: '裁片', price: 0.5 },
      { id: 'p2', name: '车缝', price: 1.2 },
      { id: 'p3', name: '剪线', price: 0.3 },
      { id: 'p4', name: '品检', price: 0.4 },
      { id: 'p5', name: '包装', price: 0.3 }
    ];

    const employees = ['张美华', '李桂花', '王菊兰', '陈玉凤', '刘菊英', '赵金凤', '黄小梅', '周丽华'];

    const day = (offset) => {
      const d = new Date();
      d.setDate(d.getDate() + offset);
      return d.toISOString().slice(0, 10);
    };

    const orders = [
      {
        id: 'demo-o1', customer: '广州雅致贸易', styleNo: 'HY-2026-001', quantity: 5000,
        deadline: day(12), remark: '蕾丝款内衣', produced: 3200,
        progress: { p1: 5000, p2: 4500, p3: 4000, p4: 3500, p5: 3200 },
        createdAt: day(-20) + 'T08:00:00'
      },
      {
        id: 'demo-o2', customer: '深圳优品服饰', styleNo: 'HY-2026-002', quantity: 3000,
        deadline: day(2), remark: '无缝内裤', produced: 2100,
        progress: { p1: 3000, p2: 2800, p3: 2500, p4: 2300, p5: 2100 },
        createdAt: day(-15) + 'T08:00:00'
      },
      {
        id: 'demo-o3', customer: '东莞兴达针织', styleNo: 'HY-2026-003', quantity: 8000,
        deadline: day(-3), remark: '运动内衣', produced: 6500,
        progress: { p1: 8000, p2: 7500, p3: 7000, p4: 6800, p5: 6500 },
        createdAt: day(-30) + 'T08:00:00'
      },
      {
        id: 'demo-o4', customer: '南宁百佳商贸', styleNo: 'HY-2026-004', quantity: 2000,
        deadline: day(25), remark: '新款文胸', produced: 450,
        progress: { p1: 2000, p2: 1200, p3: 800, p4: 500, p5: 450 },
        createdAt: day(-5) + 'T08:00:00'
      }
    ];

    const pieceworks = [];
    const styles = ['HY-2026-001', 'HY-2026-002', 'HY-2026-003', 'HY-2026-004'];
    let pwId = 0;

    for (let d = -6; d <= 0; d++) {
      const date = day(d);
      const count = 8 + Math.floor(Math.random() * 6);
      for (let i = 0; i < count; i++) {
        const proc = processes[i % processes.length];
        const emp = employees[(d + i + 3) % employees.length];
        const qty = 30 + Math.floor(Math.random() * 120);
        pieceworks.push({
          id: 'demo-pw' + (pwId++),
          date, employee: emp,
          processId: proc.id, processName: proc.name, unitPrice: proc.price,
          quantity: qty, styleNo: styles[i % styles.length],
          createdAt: date + 'T10:00:00'
        });
      }
    }

    const reworks = [
      { id: 'demo-rw1', date: day(-2), employee: '王菊兰', styleNo: 'HY-2026-002', processId: 'p2', processName: '车缝', issue: '针距不均', quantity: 15, createdAt: day(-2) + 'T14:00:00' },
      { id: 'demo-rw2', date: day(-1), employee: '陈玉凤', styleNo: 'HY-2026-001', processId: 'p3', processName: '剪线', issue: '线头未剪', quantity: 22, createdAt: day(-1) + 'T11:00:00' },
      { id: 'demo-rw3', date: day(0), employee: '李桂花', styleNo: 'HY-2026-003', processId: 'p4', processName: '品检', issue: '尺寸偏差', quantity: 8, createdAt: day(0) + 'T09:30:00' },
      { id: 'demo-rw4', date: day(-4), employee: '赵金凤', styleNo: 'HY-2026-002', processId: 'p5', processName: '包装', issue: '包装不良', quantity: 10, createdAt: day(-4) + 'T16:00:00' }
    ];

    return {
      companyName: '钦州市海誉服装有限公司',
      theme: 'light',
      processes,
      employees,
      orders,
      pieceworks,
      reworks
    };
  },

  async load() {
    const ok = await Utils.confirm('加载演示数据将覆盖当前全部数据，确定继续？');
    if (!ok) return;
    Storage.set(this.generate());
    if (typeof App !== 'undefined') App.refreshAll();
    Utils.showToast('演示数据已加载');
  }
};
