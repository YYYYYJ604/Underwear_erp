/**
 * 使用说明模块
 */
const Help = {
  render() {
    const container = document.getElementById("helpContent");
    if (!container) return;
    container.innerHTML = `
<div style="max-width:800px;margin:0 auto;padding:20px">
  <h2 style="font-size:24px;margin-bottom:20px;color:var(--text-color);border-bottom:2px solid var(--primary);padding-bottom:10px">使用说明书</h2>

  <div style="background:var(--card-bg);border:1px solid var(--border-color);border-radius:10px;padding:20px;margin-bottom:24px">
    <h3 style="margin-top:0;color:var(--primary)">一、系统简介</h3>
    <p style="line-height:1.8">本系统是一个车间生产管理工具，用于管理服装厂的生产订单、流水线进度、员工计件工资、次品返工等日常业务。</p>
    <p style="line-height:1.8"><strong>运行方式</strong>：浏览器打开即可使用，无需安装任何软件。</p>
    <p style="line-height:1.8"><strong>数据存储</strong>：所有数据保存在您当前使用的浏览器中，不上传任何服务器。</p>
  </div>

  <div style="background:var(--card-bg);border:1px solid var(--border-color);border-radius:10px;padding:20px;margin-bottom:24px">
    <h3 style="margin-top:0;color:var(--primary)">二、如何打开系统</h3>
    <p style="line-height:1.8">在浏览器地址栏输入：</p>
    <div style="background:var(--bg-color);padding:12px 16px;border-radius:6px;font-family:monospace;font-size:16px;margin:8px 0">
      https://YYYYYJ604.github.io/Underwear_erp/
    </div>
    <p style="line-height:1.8">建议使用 Microsoft Edge 或 Google Chrome 浏览器打开。</p>
  </div>

  <div style="background:var(--card-bg);border:1px solid var(--border-color);border-radius:10px;padding:20px;margin-bottom:24px">
    <h3 style="margin-top:0;color:var(--primary)">三、首次使用建议</h3>
    <ol style="line-height:2;padding-left:20px">
      <li>点击左侧导航栏 <strong>「系统设置」</strong></li>
      <li>点击 <strong>「加载演示数据（体验全貌）」</strong></li>
      <li>点击左侧 <strong>「数据看板」</strong> 查看效果</li>
    </ol>
  </div>

  <div style="background:var(--card-bg);border:1px solid var(--border-color);border-radius:10px;padding:20px;margin-bottom:24px">
    <h3 style="margin-top:0;color:var(--primary)">四、功能说明</h3>

    <h4 style="color:var(--primary);margin-top:16px">📊 数据看板</h4>
    <p style="line-height:1.8">首页展示全局统计数据：今日产量、进行中订单、预警订单、今日返工数、订单进度、员工效率排行、工序产量分布、近7日产量趋势。</p>

    <h4 style="color:var(--primary);margin-top:20px">📋 生产订单</h4>
    <p style="line-height:1.8"><strong>新增订单：</strong>点击「+ 新增订单」，填写客户、款号、数量、交货日期。</p>
    <table style="width:100%;border-collapse:collapse;margin:12px 0">
      <tr><th style="text-align:left;padding:8px;border:1px solid var(--border-color);background:var(--bg-color)">状态</th><th style="text-align:left;padding:8px;border:1px solid var(--border-color);background:var(--bg-color)">说明</th></tr>
      <tr><td style="padding:8px;border:1px solid var(--border-color)">正常</td><td style="padding:8px;border:1px solid var(--border-color)">离交期还有3天以上</td></tr>
      <tr><td style="padding:8px;border:1px solid var(--border-color)">预警</td><td style="padding:8px;border:1px solid var(--border-color)">离交期不到3天，需要抓紧</td></tr>
      <tr><td style="padding:8px;border:1px solid var(--border-color)">延期</td><td style="padding:8px;border:1px solid var(--border-color)">已经超过交期</td></tr>
      <tr><td style="padding:8px;border:1px solid var(--border-color)">已完成</td><td style="padding:8px;border:1px solid var(--border-color)">已生产完毕</td></tr>
    </table>

    <h4 style="color:var(--primary);margin-top:20px">🏭 流水线进度</h4>
    <p style="line-height:1.8">选择订单 → 点击「更新进度」→ 填写各工序完成数量 → 保存。</p>

    <h4 style="color:var(--primary);margin-top:20px">💰 员工计件</h4>
    <p style="line-height:1.8"><strong>录入计件：</strong>点击「+ 录入计件」，选择员工、工序、款号，填写件数，工资自动计算。</p>
    <p style="line-height:1.8">支持按月筛选、导出 Excel、打印工资条。</p>

    <h4 style="color:var(--primary);margin-top:20px">⚠️ 次品返工</h4>
    <p style="line-height:1.8">点击「+ 记录返工」，记录员工、款号、工序、问题描述、件数。</p>

    <h4 style="color:var(--primary);margin-top:20px">⚙️ 系统设置</h4>
    <p style="line-height:1.8">配置公司名称、工序单价、员工名单。</p>
    <p style="line-height:1.8"><strong>数据管理：</strong></p>
    <ul style="line-height:1.8">
      <li><strong>导出备份</strong> — 下载全部数据到电脑保存</li>
      <li><strong>导入备份</strong> — 恢复之前导出的数据</li>
      <li><strong>从 IndexedDB 恢复</strong> — 浏览器缓存丢失时恢复</li>
      <li><strong>清空数据</strong> — 删除全部数据（不可恢复）</li>
    </ul>
  </div>

  <div style="background:var(--card-bg);border:1px solid var(--border-color);border-radius:10px;padding:20px;margin-bottom:24px">
    <h3 style="margin-top:0;color:var(--primary)">五、数据安全须知</h3>
    <table style="width:100%;border-collapse:collapse;margin:12px 0">
      <tr><th style="text-align:left;padding:8px;border:1px solid var(--border-color);background:var(--bg-color)">场景</th><th style="text-align:left;padding:8px;border:1px solid var(--border-color);background:var(--bg-color)">数据</th><th style="text-align:left;padding:8px;border:1px solid var(--border-color);background:var(--bg-color)">怎么办</th></tr>
      <tr><td style="padding:8px;border:1px solid var(--border-color)">清浏览器缓存</td><td style="padding:8px;border:1px solid var(--border-color)">部分丢失</td><td style="padding:8px;border:1px solid var(--border-color)">设置页 → 从 IndexedDB 恢复</td></tr>
      <tr><td style="padding:8px;border:1px solid var(--border-color)">换电脑</td><td style="padding:8px;border:1px solid var(--border-color)">旧电脑有数据</td><td style="padding:8px;border:1px solid var(--border-color)">旧电脑导出 → 新电脑导入</td></tr>
      <tr><td style="padding:8px;border:1px solid var(--border-color)">重装系统</td><td style="padding:8px;border:1px solid var(--border-color)">会丢</td><td style="padding:8px;border:1px solid var(--border-color)">之前导出过 JSON 就能恢复</td></tr>
    </table>
    <p style="line-height:1.8;margin-top:12px;color:var(--danger);font-weight:bold">建议：每周手动导出一次备份（JSON 文件）保存到 U盘或网盘。</p>
  </div>

  <div style="background:var(--card-bg);border:1px solid var(--border-color);border-radius:10px;padding:20px;margin-bottom:24px">
    <h3 style="margin-top:0;color:var(--primary)">六、快捷键</h3>
    <table style="width:100%;border-collapse:collapse;margin:12px 0">
      <tr><th style="text-align:left;padding:8px;border:1px solid var(--border-color);background:var(--bg-color)">快捷键</th><th style="text-align:left;padding:8px;border:1px solid var(--border-color);background:var(--bg-color)">功能</th></tr>
      <tr><td style="padding:8px;border:1px solid var(--border-color)">Ctrl + N</td><td style="padding:8px;border:1px solid var(--border-color)">快速新增订单</td></tr>
      <tr><td style="padding:8px;border:1px solid var(--border-color)">Ctrl + Shift + N</td><td style="padding:8px;border:1px solid var(--border-color)">快速录入计件</td></tr>
      <tr><td style="padding:8px;border:1px solid var(--border-color)">Ctrl + 1 ~ 6</td><td style="padding:8px;border:1px solid var(--border-color)">快速切换页面</td></tr>
      <tr><td style="padding:8px;border:1px solid var(--border-color)">Esc</td><td style="padding:8px;border:1px solid var(--border-color)">关闭弹窗</td></tr>
    </table>
  </div>

  <div style="background:var(--card-bg);border:1px solid var(--border-color);border-radius:10px;padding:20px;margin-bottom:24px">
    <h3 style="margin-top:0;color:var(--primary)">七、常见问题</h3>
    <p style="line-height:1.8"><strong>问：</strong>数据会不会上传到网上？<br><strong>答：</strong>不会。所有数据只保存在您自己的浏览器里。</p>
    <p style="line-height:1.8"><strong>问：</strong>换电脑怎么用？<br><strong>答：</strong>原电脑导出备份 → 新电脑打开网址 → 导入备份。</p>
    <p style="line-height:1.8"><strong>问：</strong>为什么数据突然没了？<br><strong>答：</strong>可能清理了浏览器缓存。到设置页点击「从 IndexedDB 恢复」即可。</p>
    <p style="line-height:1.8"><strong>问：</strong>多人同时用能看到同一份数据吗？<br><strong>答：</strong>不能。每人只能看到自己浏览器中的数据。</p>
  </div>

  <div style="text-align:center;padding:12px;color:var(--text-muted);font-size:13px">
    版本 1.0 · 钦州市海誉服装有限公司
  </div>
</div>`;
  }
};
