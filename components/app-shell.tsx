import Link from "next/link";
import { BarChart3, CheckCircle2, FolderKanban, LayoutList, Menu, ShieldCheck, BadgeCheck, X } from "lucide-react";
const links = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 }, { href: "/demands", label: "Demandas", icon: LayoutList }, { href: "/approvals", label: "Pendentes de análise", icon: ShieldCheck }, { href: "/confirmations", label: "Pendentes de confirmação", icon: BadgeCheck },
  { href: "/demands?completed=true", label: "Concluídos", icon: CheckCircle2 }, { href: "/demands", label: "Categorias", icon: FolderKanban },
];
export function AppShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
    <input id="nav" type="checkbox" className="peer hidden" />
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 lg:hidden"><Link href="/dashboard" className="font-semibold">Ajustes do site</Link><label htmlFor="nav" className="focus-ring rounded p-2"><Menu className="size-5" /></label></header>
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r bg-slate-950 text-slate-200 peer-checked:flex lg:sticky lg:top-0 lg:flex lg:h-screen">
      <div className="flex h-20 items-center justify-between border-b border-white/10 px-6"><Link href="/dashboard"><span className="block text-xs font-medium uppercase tracking-[.18em] text-blue-400">Painel interno</span><span className="mt-1 block font-semibold text-white">Ajustes do site</span></Link><label htmlFor="nav" className="lg:hidden"><X className="size-5" /></label></div>
      <nav className="flex-1 space-y-1 p-3">{links.map(({ href, label, icon: Icon }) => <Link key={label} href={href} className="focus-ring flex items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-white/10 hover:text-white"><Icon className="size-4" />{label}</Link>)}</nav>
      <div className="border-t border-white/10 px-6 py-4 text-xs text-slate-500">Acesso interno</div>
    </aside>
    <main className="min-w-0">{children}</main>
  </div>;
}
