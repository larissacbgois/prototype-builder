import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Boxes, DollarSign, PackageX, ShoppingCart, Sparkles, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { auth, useProducts, type Product } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  const [alertOpen, setAlertOpen] = useState(false);

  const lowStockItems = useMemo(
    () =>
      products
        .filter((p) => p.quantity < p.minStock)
        .map((p) => {
          const suggested = Math.max(p.minStock * 2 - p.quantity, p.minStock);
          // Estimativa de preço médio de mercado: variação de +12% a +22% sobre o custo,
          // determinística por produto (hash do id) para não oscilar a cada render.
          const seed = Array.from(p.id).reduce((a, c) => a + c.charCodeAt(0), 0);
          const factor = 1.12 + ((seed % 11) / 100);
          const marketAvg = p.price * factor;
          const urgency = p.quantity === 0 ? "critico" : p.quantity <= p.minStock / 2 ? "alto" : "medio";
          return { product: p, suggested, marketAvg, totalCost: marketAvg * suggested, urgency };
        })
        .sort((a, b) => a.product.quantity - b.product.quantity),
    [products],
  );

  const totalReposicao = lowStockItems.reduce((a, x) => a + x.totalCost, 0);


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
              Olá, <span className="text-gradient">Administrador</span>
            </h1>
            <p className="text-muted-foreground mt-1">Aqui está o resumo do seu estoque hoje.</p>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={Boxes} label="Itens em estoque" value={stats.totalQty.toString()} hint={`${stats.skus} códigos`} trend="up" delta="+12%" />
          <Stat icon={DollarSign} label="Valor em estoque" value={`R$ ${stats.totalValue.toFixed(2)}`} hint="custo total" trend="up" delta="+4,8%" />
          <Stat icon={PackageX} label="Em falta" value={stats.lowStock.toString()} hint="abaixo do mínimo" trend={stats.lowStock > 0 ? "down" : "up"} delta={stats.lowStock > 0 ? "atenção" : "ok"} />
          <Stat icon={TrendingUp} label="Giro semanal" value="68%" hint="últimos 7 dias" trend="up" delta="+3,2%" />
        </section>

        {lowStockItems.length > 0 && (
          <section
            className="surface-card relative overflow-hidden p-6 md:p-7 border-destructive/40"
            style={{ background: "linear-gradient(135deg, color-mix(in oklab, var(--destructive) 14%, var(--card)), var(--card) 70%)" }}
          >
            <div className="absolute -top-16 -right-16 size-56 rounded-full blur-3xl opacity-30" style={{ background: "var(--destructive)" }} />
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-2xl grid place-items-center bg-destructive/15 text-destructive shrink-0">
                  <AlertTriangle className="size-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="uppercase tracking-wide text-[10px]">Reposição urgente</Badge>
                    <span className="text-xs text-muted-foreground">atualizado agora</span>
                  </div>
                  <h3 className="font-display text-xl md:text-2xl font-semibold mt-2">
                    {lowStockItems.length} {lowStockItems.length === 1 ? "produto está" : "produtos estão"} prestes a esgotar
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Investimento estimado para recompor o estoque:{" "}
                    <span className="font-semibold text-foreground">R$ {totalReposicao.toFixed(2)}</span>
                  </p>
                </div>
              </div>
              <Button size="lg" onClick={() => setAlertOpen(true)} className="gap-2">
                <Sparkles className="size-4" /> Ver lista de compras
              </Button>
            </div>
          </section>
        )}

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

      <RestockDialog open={alertOpen} onOpenChange={setAlertOpen} items={lowStockItems} total={totalReposicao} />
    </AppShell>
  );
}

type RestockItem = {
  product: Product;
  suggested: number;
  marketAvg: number;
  totalCost: number;
  urgency: "critico" | "alto" | "medio";
};

function RestockDialog({
  open, onOpenChange, items, total,
}: { open: boolean; onOpenChange: (v: boolean) => void; items: RestockItem[]; total: number }) {
  const urgencyMeta = {
    critico: { label: "Crítico", className: "bg-destructive text-destructive-foreground" },
    alto: { label: "Alto", className: "bg-destructive/15 text-destructive border border-destructive/30" },
    medio: { label: "Médio", className: "bg-secondary text-foreground border border-border" },
  } as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl grid place-items-center bg-destructive/15 text-destructive">
              <ShoppingCart className="size-5" />
            </div>
            <div>
              <DialogTitle className="font-display text-2xl">Lista de reposição</DialogTitle>
              <DialogDescription>
                Produtos abaixo do estoque mínimo, com sugestão de compra e preço médio estimado de mercado.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[55vh] overflow-y-auto pr-1 space-y-3">
          {items.map(({ product: p, suggested, marketAvg, totalCost, urgency }) => {
            const meta = urgencyMeta[urgency];
            const pctRestante = Math.min(100, Math.round((p.quantity / Math.max(1, p.minStock)) * 100));
            return (
              <div key={p.id} className="rounded-xl border border-border bg-card/60 p-4 hover:border-destructive/40 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full font-semibold ${meta.className}`}>
                        {meta.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{p.category || "Sem categoria"}</span>
                    </div>
                    <h4 className="font-display text-base font-semibold mt-1 truncate">{p.name}</h4>
                    <p className="text-xs text-muted-foreground">Cód. {p.sku}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">Comprar</p>
                    <p className="font-display text-2xl font-semibold leading-none">{suggested}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">unidades</p>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">
                      Em estoque: <span className="text-foreground font-medium">{p.quantity}</span> / mín {p.minStock}
                    </span>
                    <span className="text-destructive font-medium">{pctRestante}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-destructive transition-all" style={{ width: `${pctRestante}%` }} />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg bg-secondary/50 p-2">
                    <p className="text-muted-foreground">Custo atual</p>
                    <p className="font-semibold text-sm">R$ {p.price.toFixed(2)}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-2">
                    <p className="text-muted-foreground">Preço médio mercado</p>
                    <p className="font-semibold text-sm">R$ {marketAvg.toFixed(2)}</p>
                  </div>
                  <div className="rounded-lg bg-primary/10 p-2">
                    <p className="text-muted-foreground">Total estimado</p>
                    <p className="font-semibold text-sm text-primary">R$ {totalCost.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
          <div>
            <p className="text-xs text-muted-foreground">Investimento total estimado</p>
            <p className="font-display text-2xl font-semibold">R$ {total.toFixed(2)}</p>
          </div>
          <Button onClick={() => onOpenChange(false)} variant="outline">Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
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
