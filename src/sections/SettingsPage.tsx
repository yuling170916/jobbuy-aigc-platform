// 设置：演示/ComfyUI 模式切换、工程文件查看——对应文章「技术同学编写工程文件、预留 SD API」
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { WORKFLOW_TEMPLATE, testConnection } from '@/lib/comfyui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function SettingsPage() {
  const { settings, setSettings, resetAll } = useStore();
  const [endpoint, setEndpoint] = useState(settings.comfyEndpoint);
  const [testMsg, setTestMsg] = useState('');
  const [testing, setTesting] = useState(false);
  const [showWf, setShowWf] = useState(false);

  const test = async () => {
    setTesting(true); setTestMsg('连接中…');
    const r = await testConnection(endpoint);
    setTestMsg(r.ok ? `✅ ${r.msg}` : `❌ ${r.msg}`);
    setTesting(false);
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">设置</h1>
        <p className="text-sm text-muted-foreground mt-1">出图引擎配置。演示模式无需任何服务器；ComfyUI 模式连接你自己的 GPU 服务器真实出图。</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">出图模式</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button variant={settings.mode === 'demo' ? 'default' : 'outline'} onClick={() => setSettings({ ...settings, mode: 'demo' })}>🎨 演示模式</Button>
            <Button variant={settings.mode === 'comfyui' ? 'default' : 'outline'} onClick={() => setSettings({ ...settings, mode: 'comfyui', comfyEndpoint: endpoint })}>⚡ ComfyUI 模式</Button>
          </div>
          {settings.mode === 'comfyui' && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input value={endpoint} onChange={e => setEndpoint(e.target.value)} placeholder="http://127.0.0.1:8188" />
                <Button variant="outline" disabled={testing} onClick={test}>测试连接</Button>
                <Button onClick={() => setSettings({ ...settings, comfyEndpoint: endpoint })}>保存</Button>
              </div>
              {testMsg && <p className="text-sm">{testMsg}</p>}
              <p className="text-xs text-muted-foreground">ComfyUI 需以 <code>--enable-cors-header *</code> 启动，否则浏览器跨域会被拦。</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">工程文件（ComfyUI 工作流模板）</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            技术同学搭好的"生成配方"。只有 <code>③正向词 ④反向词 ⑤数量 ②LoRA</code> 四个口是活的，平台提交任务时按需求表每行替换这四个口再调 API。
          </p>
          <Button variant="outline" size="sm" onClick={() => setShowWf(v => !v)}>{showWf ? '收起' : '查看 JSON'}</Button>
          {showWf && (
            <pre className="text-xs bg-slate-950 text-slate-200 rounded-lg p-4 overflow-auto max-h-96">{JSON.stringify(WORKFLOW_TEMPLATE, null, 2)}</pre>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base text-red-600">危险区</CardTitle></CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => { if (confirm('确定清空所有任务、素材、文案数据？')) resetAll(); }}>清空全部数据</Button>
        </CardContent>
      </Card>
    </div>
  );
}
