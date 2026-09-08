// 数据看板：对应文章 SOP 第 2 步「指标体系」——良率 / 多样性 / 稳定性 / 日产量
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Dashboard() {
  const { assets, tasks, loras } = useStore();
  const reviewed = assets.filter(a => a.status !== 'pending');
  const approved = assets.filter(a => a.status === 'approved').length;
  const yieldRate = reviewed.length ? Math.round((approved / reviewed.length) * 100) : 0;
  const today = new Date().toDateString();
  const todayCount = assets.filter(a => new Date(a.createdAt).toDateString() === today).length;
  const usedScenes = new Set(assets.map(a => a.loraId)).size;

  // 近 7 天产量（演示种子数据 + 真实数据叠加）
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    const seedBase = [320, 455, 380, 520, 610, 480, 0][i];
    const real = assets.filter(a => new Date(a.createdAt).toDateString() === d.toDateString()).length;
    return { label, count: i === 6 ? seedBase + real : seedBase };
  });
  const maxCount = Math.max(...days.map(d => d.count), 1);

  const metrics = [
    { label: '今日产量', value: todayCount, unit: '张', note: '目标 500 张/日', color: 'text-indigo-600' },
    { label: '良率（一次通过率）', value: reviewed.length ? yieldRate : '—', unit: reviewed.length ? '%' : '', note: '目标 ≥60%', color: 'text-emerald-600' },
    { label: '多样性（已用场景）', value: usedScenes, unit: `/${loras.length}`, note: '目标 120+ 场景', color: 'text-amber-600' },
    { label: '任务总数', value: tasks.length, unit: '个', note: '含历史任务', color: 'text-slate-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">数据看板</h1>
        <p className="text-sm text-muted-foreground mt-1">文章的 SOP 第 2 步：没有指标就无法判断工具好不好。所有优化都对着这几个数字。</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(m => (
          <Card key={m.label}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{m.label}</CardTitle></CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${m.color}`}>{m.value}<span className="text-base font-normal ml-1">{m.unit}</span></div>
              <p className="text-xs text-muted-foreground mt-1">{m.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">近 7 天出图量</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 h-44">
            {days.map(d => (
              <div key={d.label} className="flex-1 h-full flex flex-col items-center justify-end gap-1">
                <span className="text-xs text-muted-foreground">{d.count}</span>
                <div className="w-full rounded-t bg-indigo-500/80" style={{ height: `${Math.max((d.count / maxCount) * 120, 4)}px` }} />
                <span className="text-xs text-muted-foreground">{d.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 文章总链路图 */}
      <Card>
        <CardHeader><CardTitle className="text-base">平台生产链路（对应文章「需求梳理」总图）</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="px-3 py-2 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 font-medium">输入：SKU ID<br /><span className="text-xs font-normal">商品图 · 信息 · 评论</span></span>
            <span className="text-muted-foreground">→</span>
            <span className="px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">图像线<br /><span className="text-xs font-normal">输入规则 → LoRA → 结构化Prompt → ControlNet → 输出模板</span></span>
            <span className="text-muted-foreground">+</span>
            <span className="px-3 py-2 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 font-medium">文本线<br /><span className="text-xs font-normal">输入规则 → LLM → 资料库 → 输出规则</span></span>
            <span className="text-muted-foreground">→</span>
            <span className="px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">批量输出<br /><span className="text-xs font-normal">背景图 · 引流标题 · 设计图</span></span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
