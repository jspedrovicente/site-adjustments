import type { LucideIcon } from "lucide-react";
import { BadgeCheck, Blocks, Braces, Bug, CalendarCheck, ClipboardCheck, Code2, Crown, Database, Gauge, GitPullRequest, LayoutTemplate, Megaphone, ShieldCheck, Sparkles, Target, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Membros da equipe" };

type Member = {
  name: string;
  role: string;
  summary: string;
  superpower: string;
  tags: string[];
  icon: LucideIcon;
};

const groups: { title: string; subtitle: string; icon: LucideIcon; tone: "emerald" | "rose" | "amber"; members: Member[] }[] = [
  {
    title: "Produto, cliente e direção",
    subtitle: "Transformam necessidade em decisão — e decisão em fila organizada.",
    icon: Target,
    tone: "emerald",
    members: [
      { name: "João Guimarães", role: "Cliente final e validador", summary: "Origina as demandas e dá o aceite final para confirmar se a entrega resolveu o problema de verdade — não apenas no ambiente local.", superpower: "O LGTM que realmente vale", tags: ["Solicitações", "Aceite final", "Visão do cliente"], icon: Crown },
      { name: "Marco Vieira", role: "Product Owner", summary: "Protege o backlog, aprova novas solicitações, define responsáveis e mantém o trabalho conectado às prioridades do projeto.", superpower: "Transforma pedidos em decisões", tags: ["Backlog", "Priorização", "Distribuição"], icon: GitPullRequest },
      { name: "Vitória Durans", role: "Padrões e registros", summary: "Representa o time do João no acompanhamento dos padrões do site e garante que registros e informações importantes estejam corretamente documentados.", superpower: "Nada passa sem padrão e registro", tags: ["Conformidade", "Registros", "Padrões"], icon: ClipboardCheck },
    ],
  },
  {
    title: "Engenharia e entrega",
    subtitle: "Quatro devs, um sonho e uma quantidade saudável de branches.",
    icon: Code2,
    tone: "rose",
    members: [
      { name: "José Vicente", role: "Desenvolvedor", summary: "Atua em frentes de integração com o I-content do projeto e com contribuições no fluxo principal do site, pagamentos e funcionalidades do backend.", superpower: "Conecta regra de negócio e fluxo funcional", tags: ["Fluxos", "Pagamentos", "Backend & integrações"], icon: Braces },
      { name: "Elvis Pina", role: "Desenvolvedor", summary: "Trabalha na conexão entre aquisição, funcionalidade e dados, com foco em leads, camada de dados, GTM, SEO e comportamento do produto.", superpower: "Liga conversão, dados e código", tags: ["Leads", "Data layer", "GTM & SEO"], icon: Database },
      { name: "Lauro Esmeraldo", role: "Desenvolvedor", summary: "Atua na fidelidade visual e em demandas cruciais do site, além de apoiar o desenvolvimento do Vitor nas entregas da equipe.", superpower: "Pixel certo, entrega crítica", tags: ["Fidelidade visual", "Demandas críticas", "Parceria"], icon: LayoutTemplate },
      { name: "Vitor Moraes", role: "Desenvolvedor", summary: "Uma das adições mais recentes da engenharia. Contribui diretamente em demandas reais do projeto, aprende rápido e vem construindo entregas cada vez mais consistentes ao lado da equipe.", superpower: "Evolução rápida com entrega consistente", tags: ["Desenvolvimento", "Colaboração", "Entrega"], icon: Sparkles },
    ],
  },
  {
    title: "Qualidade, ritmo e governança",
    subtitle: "Garantem que entregar rápido não signifique entregar no escuro.",
    icon: ShieldCheck,
    tone: "amber",
    members: [
      { name: "Wanderson Gabriel", role: "Tester e QA", summary: "Valida fluxos e funcionalidades com alto nível de exigência. Se existir um caso de borda, uma inconsistência ou um botão suspeito, ele provavelmente encontrará.", superpower: "Desconfia até do caminho feliz", tags: ["QA", "Testes", "Fluxos"], icon: Bug },
      { name: "Geovanna Ribeiro", role: "Gestão macro do projeto", summary: "Acompanha prioridades, prazos e status gerais para garantir que as frentes importantes avancem e que todos saibam onde o projeto realmente está.", superpower: "Ninguém pode dizer que não sabia", tags: ["Prioridades", "Prazos", "Status"], icon: Gauge },
      { name: "Talita Biscaro", role: "Scrum Master", summary: "Cuida do ritmo das sprints, das práticas Scrum e do alinhamento de expectativas para que cerimônias, compromissos e entregas façam sentido juntos.", superpower: "Organiza até o caos iterativo", tags: ["Scrum", "Sprints", "Alinhamento"], icon: CalendarCheck },
    ],
  },
];

const toneStyles = {
  emerald: { border: "border-emerald-400/25", background: "bg-emerald-400/5", surface: "bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.13),transparent_48%)]", icon: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200", text: "text-emerald-200" },
  rose: { border: "border-rose-400/25", background: "bg-rose-400/5", surface: "bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.14),transparent_48%)]", icon: "border-rose-400/25 bg-rose-400/10 text-rose-200", text: "text-rose-200" },
  amber: { border: "border-amber-400/20", background: "bg-amber-400/5", surface: "bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.12),transparent_48%)]", icon: "border-amber-400/20 bg-amber-400/10 text-amber-200", text: "text-amber-200" },
};

export default function TeamPage() {
  const members = groups.flatMap((group) => group.members);
  const roles = new Set(members.map((member) => member.role)).size;
  return <>
    <PageHeader eyebrow="Quem faz acontecer" title="Membros da equipe" description="As pessoas por trás das demandas, decisões, entregas, testes e perguntas perigosamente específicas."/>
    <main className="space-y-8 p-5 sm:p-8 lg:p-10">
      <section className="grid gap-3 sm:grid-cols-2">
        <TeamStat icon={Users} value={members.length} label="pessoas no time"/>
        <TeamStat icon={BadgeCheck} value={roles} label="papéis complementares"/>
      </section>

      <aside className="panel rounded-xl p-5">
        <div className="flex items-start gap-3"><span className="rounded-lg border border-indigo-400/20 bg-indigo-400/10 p-2 text-indigo-200"><Blocks className="size-5"/></span><div><h2 className="font-semibold text-white">Um site é um esporte coletivo</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">Produto define direção, engenharia transforma decisão em software, qualidade procura tudo o que pode dar errado e governança impede que prazo e contexto desapareçam no caminho.</p></div></div>
      </aside>

      {groups.map((group) => <TeamGroup key={group.title} {...group}/>)}

      <footer className="rounded-xl border border-dashed border-slate-600/70 px-5 py-6 text-center"><Megaphone className="mx-auto size-5 text-slate-400"/><p className="mt-2 font-mono text-sm text-slate-300">Boa comunicação evita bugs. Às vezes.</p><p className="mt-1 text-xs text-slate-500">Quando não evita, pelo menos deixa o card bem documentado.</p></footer>
    </main>
  </>;
}

function TeamGroup({ title, subtitle, icon: Icon, tone, members }: (typeof groups)[number]) {
  const colors = toneStyles[tone];
  return <section>
    <div className="mb-4 flex items-start gap-3"><span className={`rounded-lg border p-2 ${colors.icon}`}><Icon className="size-4"/></span><div><h2 className="text-lg font-semibold text-white">{title}</h2><p className="mt-0.5 text-sm text-slate-400">{subtitle}</p></div></div>
    <div className="grid items-stretch gap-4 md:grid-cols-2 2xl:grid-cols-3">{members.map((member) => <MemberCard key={member.name} member={member} colors={colors}/>)}</div>
  </section>;
}

function MemberCard({ member, colors }: { member: Member; colors: (typeof toneStyles)[keyof typeof toneStyles] }) {
  const Icon = member.icon;
  const initials = member.name.split(" ").map((part) => part[0]).slice(0, 2).join("");
  return <article className={`relative flex h-full flex-col overflow-hidden rounded-xl border bg-slate-900/65 p-5 shadow-lg shadow-black/10 ${colors.border} ${colors.surface}`}>
    <div className={`absolute inset-x-0 top-0 h-px ${colors.background}`}/>
    <div className="flex items-start gap-3"><span className={`grid size-11 shrink-0 place-items-center rounded-xl border font-mono text-sm font-bold ${colors.icon}`}>{initials}</span><div className="min-w-0"><h3 className="font-semibold text-white">{member.name}</h3><p className={`mt-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide ${colors.text}`}>{member.role}</p></div></div>
    <p className="mt-4 text-sm leading-6 text-slate-300">{member.summary}</p>
    <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-950/35 px-3 py-2.5"><Icon className={`size-4 shrink-0 ${colors.text}`}/><div><p className="font-mono text-[10px] uppercase tracking-wide text-slate-500">Superpoder</p><p className="mt-0.5 text-xs font-semibold text-slate-200">{member.superpower}</p></div></div>
    <div className="mt-auto flex flex-wrap gap-2 pt-4">{member.tags.map((tag) => <span key={tag} className="rounded-full border border-slate-600/60 bg-slate-800/70 px-2.5 py-1 text-[11px] font-medium text-slate-300">{tag}</span>)}</div>
  </article>;
}

function TeamStat({ icon: Icon, value, label }: { icon: LucideIcon; value: string | number; label: string }) {
  return <div className="panel rounded-xl p-4"><div className="flex items-center gap-3"><span className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 p-2 text-cyan-200"><Icon className="size-4"/></span><div><p className="text-2xl font-bold text-white">{value}</p><p className="text-xs text-slate-400">{label}</p></div></div></div>;
}
