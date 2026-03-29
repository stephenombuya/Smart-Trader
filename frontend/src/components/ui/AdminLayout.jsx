import { Outlet, Link } from 'react-router-dom'

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-surface-950">
      <header className="bg-surface-900 border-b border-slate-800 px-6 py-4 flex items-center gap-4">
        <Link to="/dashboard" className="text-slate-400 hover:text-white text-sm">← Back to App</Link>
        <span className="text-slate-700">|</span>
        <h1 className="font-display font-bold text-white">Admin Panel</h1>
        <span className="badge-red">Staff Only</span>
      </header>
      <main className="p-6 max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  )
}
