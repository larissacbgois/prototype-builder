import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Minus, Trash2, Search, PackagePlus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { auth, productStore, useProducts } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export const Route = createFileRoute("/produtos")({
  component: ProdutosPage,
  head: () => ({
    meta: [
      { title: "Produtos — Estoque.io" },
      { name: "description", content: "Cadastre, liste e ajuste a quantidade dos produtos do seu estoque." },
    ],
  }),
});

function ProdutosPage() {
  const nav = useNavigate();
  useEffect(() => { if (!auth.isAuthed()) nav({ to: "/" }); }, [nav]);

  const products = useProducts();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", sku: "", category: "", quantity: 0, minStock: 0, price: 0 });

  const filtered = products.filter((p) =>
    [p.name, p.sku, p.category].join(" ").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <AppShell>
      <div className="p-6 md:p-10 space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Catálogo</p>
            <h1 className="font-display text-3xl md:text-4xl font-semibold mt-1">Produtos</h1>
            <p className="text-muted-foreground mt-1">Gerencie seu inventário e mantenha o estoque saudável.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg"><PackagePlus className="size-4" /> Novo produto</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">Cadastrar produto</DialogTitle>
              </DialogHeader>
              <form
                className="grid grid-cols-2 gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!form.name || !form.sku) return;
                  productStore.add(form);
                  toast.success("Produto cadastrado");
                  setForm({ name: "", sku: "", category: "", quantity: 0, minStock: 0, price: 0 });
                  setOpen(false);
                }}
              >
                <div className="col-span-2 space-y-2">
                  <Label>Nome</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Código de referência</Label>
                  <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Quantidade</Label>
                  <Input type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: +e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Estoque mínimo</Label>
                  <Input type="number" min={0} value={form.minStock} onChange={(e) => setForm({ ...form, minStock: +e.target.value })} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Preço (R$)</Label>
                  <Input type="number" step="0.01" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} />
                </div>
                <DialogFooter className="col-span-2">
                  <Button type="submit" className="w-full">Cadastrar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </header>

        <div className="surface-card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <Search className="size-4 text-muted-foreground" />
            <Input
              className="border-0 bg-transparent focus-visible:ring-0 px-0"
              placeholder="Buscar por nome, código de referência ou categoria…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Código de referência</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-center">Quantidade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    Nenhum produto encontrado.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((p) => {
                const low = p.quantity < p.minStock;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {p.name}
                      {low && <span className="ml-2 text-xs text-destructive">• estoque baixo</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.sku}</TableCell>
                    <TableCell>{p.category || "—"}</TableCell>
                    <TableCell className="text-right">R$ {p.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button size="icon" variant="outline" className="size-7" onClick={() => productStore.adjust(p.id, -1)}>
                          <Minus className="size-3" />
                        </Button>
                        <span className="w-10 text-center font-display font-semibold">{p.quantity}</span>
                        <Button size="icon" variant="outline" className="size-7" onClick={() => productStore.adjust(p.id, +1)}>
                          <Plus className="size-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => { productStore.remove(p.id); toast.success("Produto removido"); }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppShell>
  );
}
