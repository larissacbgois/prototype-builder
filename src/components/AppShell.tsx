import { Link, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Package, LogOut, Boxes, ArrowLeft } from "lucide-react";
import { auth } from "@/lib/store";
import { Button } from "@/components/ui/button";

export function AppShell({ children }: { children: React.ReactNode }) {
  const nav = useNavigate();
  const router = useRouter();
  const { location } = useRouterState();
  const user = auth.user();
  const isDashboard = location.pathname === "/dashboard";

  const items = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/produtos", label: "Produtos", icon: Package },
  ] as const;

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-sidebar">
        <div className="flex items-center gap-2 px-6 py-6">
          <div className="size-9 rounded-xl grid place-items-center" style={{ background: "var(--gradient-primary)" }}>
            <Boxes className="size-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-display font-semibold leading-tight">Estoque<span className="text-gradient">.io</span></p>
            <p className="text-xs text-muted-foreground">Controle & métricas</p>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {items.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="size-4" /> {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start"
            onClick={() => { auth.logout(); nav({ to: "/" }); }}
          >
            <LogOut className="size-4" /> Sair
          </Button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 px-4 md:px-10 pt-4 md:pt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (isDashboard) nav({ to: "/" });
              else if (window.history.length > 1) router.history.back();
              else nav({ to: "/dashboard" });
            }}
          >
            <ArrowLeft className="size-4" /> Voltar
          </Button>
          <nav className="md:hidden flex items-center gap-1">
            {items.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                    active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="size-3.5" /> {label}
                </Link>
              );
            })}
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => { auth.logout(); nav({ to: "/" }); }}
            >
              <LogOut className="size-4" />
            </Button>
          </nav>
        </div>
        {children}
      </main>
    </div>
  );
}
