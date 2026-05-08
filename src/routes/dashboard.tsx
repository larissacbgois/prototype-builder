import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, Boxes, DollarSign, PackageX, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { auth, useProducts } from "@/lib/store";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Dashboard — Estoque.io" },
      { name: "description", content: "Métricas em tempo real do seu estoque: valor total, itens em falta, distribuição por categoria e movimentações." },
    ],
  }),
});

function Dashboard() {
  const nav = useNavigate();
  useEffect(() => { if (!auth.isAuthed()) nav({ to: "/" }); }, [nav]);

  const products = useProducts();

  const stats = useMemo(() => {
    const totalQty = products.reduce((a, p) => a + p.quantity, 0);
    const totalValue = products.reduce((a, p) => a + p.quantity * p.price, 0);
    const lowStock = products.filter((p) => p.quantity < p.minStock).length;
    return { totalQty, totalValue, lowStock, skus: products.length };
  }, [products]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => map.set(p.category, (map.get(p.category) ?? 0) + p.quantity));
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [products]);

  const topProducts = useMemo(
    () => [...products].sort((a, b) => b.quantity - a.quantity).slice(0, 6).map((p) => ({ name: p.name.split(" ")[0], qty: p.quantity })),
    [products],
  );

  const movement = useMemo(() => {
    // mock 7-day series
    return ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"].map((d, i) => ({
      day: d,
      entradas: 8 + ((i * 7) % 12),
      saidas: 5 + ((i * 5) % 10),
    }));
  }, []);

  const palette = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

  return (
    <AppShell>
      <div className="p-6 md:p-10 space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Painel administrativo</p>
            <h1 className="font-display text-3xl md:text-4xl font-semibold mt-1">
              Olá, <span className="text-gradient">Larissa</span>
            </h1>
            <p className="text-muted-foreground mt-1">Aqui está o resumo do seu estoque hoje.</p>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={Boxes} label="Itens em estoque" value={stats.totalQty.toString()} hint={`${stats.skus} SKUs`} trend="up" delta="+12%" />
          <Stat icon={DollarSign} label="Valor em estoque" value={`R$ ${stats.totalValue.toFixed(2)}`} hint="custo total" trend="up" delta="+4,8%" />
          <Stat icon={PackageX} label="Em falta" value={stats.lowStock.toString()} hint="abaixo do mínimo" trend={stats.lowStock > 0 ? "down" : "up"} delta={stats.lowStock > 0 ? "atenção" : "ok"} />
          <Stat icon={TrendingUp} label="Giro semanal" value="68%" hint="últimos 7 dias" trend="up" delta="+3,2%" />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="surface-card p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-lg font-semibold">Movimentação semanal</h3>
                <p className="text-sm text-muted-foreground">Entradas vs. saídas (últimos 7 dias)</p>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={movement}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
                  <Bar dataKey="entradas" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="saidas" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="surface-card p-6">
            <h3 className="font-display text-lg font-semibold">Por categoria</h3>
            <p className="text-sm text-muted-foreground">Distribuição de unidades</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                    {byCategory.map((_, i) => (
                      <Cell key={i} fill={palette[i % palette.length]} stroke="var(--color-card)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-2 text-sm">
              {byCategory.map((c, i) => (
                <li key={c.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ background: palette[i % palette.length] }} />
                    {c.name}
                  </span>
                  <span className="text-muted-foreground">{c.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="surface-card p-6">
          <h3 className="font-display text-lg font-semibold">Top produtos por quantidade</h3>
          <p className="text-sm text-muted-foreground">Os 6 itens com maior volume em estoque</p>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} width={80} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
                <Bar dataKey="qty" fill="var(--chart-1)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Stat({
  icon: Icon, label, value, hint, trend, delta,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; hint: string; trend: "up" | "down"; delta: string }) {
  const TrendIcon = trend === "up" ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="surface-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="size-9 rounded-lg grid place-items-center bg-secondary">
          <Icon className="size-4 text-primary" />
        </div>
      </div>
      <p className="font-display text-2xl md:text-3xl font-semibold mt-3">{value}</p>
      <div className="flex items-center justify-between mt-2 text-xs">
        <span className="text-muted-foreground">{hint}</span>
        <span className={`flex items-center gap-1 ${trend === "up" ? "text-primary" : "text-destructive"}`}>
          <TrendIcon className="size-3" /> {delta}
        </span>
      </div>
    </div>
  );
}
