// Jobbuy AIGC 自动化图文生成平台 · 主框架
// 复刻文章《如何搭建日产20000张图的AIGC工具》的完整链路
import { NavLink, Route, Routes } from 'react-router';
import { StoreProvider, useStore } from '@/lib/store';
import Dashboard from '@/sections/Dashboard';
import BatchGenerate from '@/sections/BatchGenerate';
import TaskQueue from '@/sections/TaskQueue';
import Review from '@/sections/Review';
import Library from '@/sections/Library';
import LoraModels from '@/sections/LoraModels';
import CopyLab from '@/sections/CopyLab';
import SettingsPage from '@/sections/SettingsPage';

const NAV = [
  { to: '/', label: '数据看板', icon: '📊' },
  { to: '/batch', label: '批量生图', icon: '🖼️' },
  { to: '/queue', label: '任务队列', icon: '⏳' },
  { to: '/review', label: '素材审核', icon: '✅' },
  { to: '/library', label: '素材库', icon: '🗂️' },
  { to: '/loras', label: 'LoRA 模型库', icon: '🧬' },
  { to: '/copy', label: '文案工坊', icon: '✍️' },
  { to: '/settings', label: '设置', icon: '⚙️' },
];

function PendingBadge() {
  const { assets } = useStore();
  const n = assets.filter(a => a.status === 'pending').length;
  if (!n) return null;
  return <span className="ml-auto text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5">{n}</span>;
}

function Shell() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-56 flex-none bg-slate-900 text-slate-300 flex flex-col">
        <div className="px-5 py-5">
          <div className="text-white font-bold text-lg">Jobbuy <span className="text-indigo-400">AIGC</span></div>
          <div className="text-xs text-slate-500 mt-1">自动化图文生成平台</div>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'
                }`
              }
            >
              <span>{n.icon}</span>
              <span>{n.label}</span>
              {n.to === '/review' && <PendingBadge />}
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-4 text-xs text-slate-500 leading-relaxed">
          复刻《如何搭建日产20000张图的 AIGC 工具》<br />uisdc.com · 2024
        </div>
      </aside>
      <main className="flex-1 p-6 max-w-[1400px]">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/batch" element={<BatchGenerate />} />
          <Route path="/queue" element={<TaskQueue />} />
          <Route path="/review" element={<Review />} />
          <Route path="/library" element={<Library />} />
          <Route path="/loras" element={<LoraModels />} />
          <Route path="/copy" element={<CopyLab />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
