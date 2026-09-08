// 任务队列：看每条任务的出图进度（模拟"服务器 7×24 批量出图"）
import { useStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const statusMap = {
  queued: { text: '排队中', cls: 'bg-slate-100 text-slate-600' },
  running: { text: '生成中', cls: 'bg-indigo-100 text-indigo-700' },
  done: { text: '已完成 → 待审核', cls: 'bg-emerald-100 text-emerald-700' },
} as const;

export default function TaskQueue() {
  const { tasks, loras } = useStore();
  const loraName = (id: string) => loras.find(l => l.id === id)?.name ?? id;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">任务队列</h1>
        <p className="text-sm text-muted-foreground mt-1">提交的生图任务在这里排队执行。真实环境中这是服务器集群在跑，人不用守着。</p>
      </div>

      {tasks.length === 0 && (
        <Card><CardContent className="py-12 text-center text-muted-foreground">还没有任务，去「批量生图」提交第一条吧 🚀</CardContent></Card>
      )}

      <div className="space-y-3">
        {tasks.map(t => (
          <Card key={t.id}>
            <CardContent className="py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{t.row.name}</span>
                  <Badge variant="outline">{loraName(t.row.loraId)}</Badge>
                  <span className="text-xs text-muted-foreground">×{t.row.count} 张</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusMap[t.status].cls}`}>{statusMap[t.status].text}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">{t.row.prompt}</p>
                <Progress value={t.progress} className="h-1.5 mt-2" />
              </div>
              <span className="text-sm text-muted-foreground w-12 text-right">{Math.round(t.progress)}%</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
