/**
 * 应用主入口
 */
const App = {
  currentPage: 'dashboard',

  pages: {
    dashboard: { title: '数据看板', render: () => Dashboard.render() },
    orders: { title: '生产订单', render: () => Orders.render() },
    production: { title: '流水线进度', render: () => Production.render() },
    piecework: { title: '员工计件', render: () => Piecework.render() },
    rework: { title: '次品返工', render: () => Rework.render() },
    help: { title: '使用说明', render: () => Help.render() },
    settings: { title: '系统设置', render: () => Settings.render() }
  },

  pageKeys: ['dashboard', 'orders', 'production', 'piecework', 'rework', 'help', 'settings'],

  init() {
    const data = Storage.load();
    Utils.applyTheme(data.theme || 'light');

    const now = new Date();
    document.getElementById('currentDate').textContent =
      now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.onclick = () => this.navigate(btn.dataset.page);
    });

    Orders.init();
    Production.init();
    Piecework.init();
    Rework.init();
    Settings.init();
    document.getElementById('btnToggleTheme').onclick = () => Utils.toggleTheme();
    this.initShortcuts();

    EventBus.on('data:changed', () => this.onDataChanged());

    window.addEventListener('resize', () => {
      if (this.currentPage === 'dashboard') Dashboard.render();
    });

    this.navigate('dashboard');
    this.showFirstRunHint();
  },

  showFirstRunHint() {
    const data = Storage.get();
    if (!data.orders.length && !localStorage.getItem('haiyu_hint_shown')) {
      localStorage.setItem('haiyu_hint_shown', '1');
      setTimeout(() => {
        Utils.showToast('提示：可在「设置」加载演示数据，或 Ctrl+N 新增订单');
      }, 800);
    }
  },

  initShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.target.matches('input, textarea, select')) return;

      if (e.key === 'Escape') {
        Utils.closeModal();
        return;
      }

      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        Orders.showForm();
        return;
      }

      if (e.ctrlKey && e.shiftKey && (e.key === 'N' || e.key === 'n')) {
        e.preventDefault();
        Piecework.showForm();
        return;
      }

      if (e.ctrlKey && e.key >= '1' && e.key <= '6') {
        e.preventDefault();
        const idx = parseInt(e.key, 10) - 1;
        if (this.pageKeys[idx]) this.navigate(this.pageKeys[idx]);
      }
    });
  },

  onDataChanged() {
    const page = this.pages[this.currentPage];
    if (page) page.render();
    if (this.currentPage !== 'settings') Settings.render();
  },

  navigate(page) {
    this.currentPage = page;
    document.querySelectorAll('.nav-item').forEach(b => {
      b.classList.toggle('active', b.dataset.page === page);
    });
    document.querySelectorAll('.page').forEach(p => {
      p.classList.toggle('active', p.id === 'page-' + page);
    });

    const info = this.pages[page];
    document.getElementById('pageTitle').textContent = info.title;
    info.render();
  },

  refreshAll() {
    Settings.render();
    Object.values(this.pages).forEach(p => p.render());
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
