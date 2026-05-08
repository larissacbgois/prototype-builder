import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Boxes, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/store";

export const Route = createFileRoute("/")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Entrar — Estoque.io | Controle de estoque & métricas" },
      { name: "description", content: "Acesse o painel administrativo do Estoque.io para gerenciar produtos, monitorar entradas/saídas e acompanhar métricas em tempo real." },
    ],
  }),
});

function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@estoque.io");
  const [pwd, setPwd] = useState("123456");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"login" | "2fa">("login");

  useEffect(() => { if (auth.isAuthed()) nav({ to: "/dashboard" }); }, [nav]);

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <section className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden border-r border-border">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl grid place-items-center" style={{ background: "var(--gradient-primary)" }}>
            <Boxes className="size-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-semibold">Estoque<span className="text-gradient">.io</span></span>
        </div>
        <div className="space-y-6 max-w-md">
          <h1 className="font-display text-5xl font-semibold leading-[1.05]">
            Estoque sob controle. <span className="text-gradient">Decisões com dados.</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Cadastre produtos, monitore entradas e saídas e acompanhe métricas do seu negócio em um painel claro e direto.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" /> Autenticação em dois fatores incluída
          </div>
        </div>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Estoque.io</p>
      </section>

      <section className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md surface-card p-8">
          <div className="lg:hidden mb-6 flex items-center gap-2">
            <div className="size-9 rounded-xl grid place-items-center" style={{ background: "var(--gradient-primary)" }}>
              <Boxes className="size-5 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold">Estoque<span className="text-gradient">.io</span></span>
          </div>
          {step === "login" ? (
            <>
              <h2 className="font-display text-2xl font-semibold">Bem-vinda de volta</h2>
              <p className="text-sm text-muted-foreground mt-1">Entre com suas credenciais de administrador.</p>
              <form
                className="mt-6 space-y-4"
                onSubmit={(e) => { e.preventDefault(); setStep("2fa"); }}
              >
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pwd">Senha</Label>
                  <Input id="pwd" type="password" required value={pwd} onChange={(e) => setPwd(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" size="lg">Continuar</Button>
                <p className="text-xs text-muted-foreground text-center">
                  Ainda não tem conta? <Link to="/" className="text-primary hover:underline">Cadastrar administrador</Link>
                </p>
              </form>
            </>
          ) : (
            <>
              <h2 className="font-display text-2xl font-semibold">Verificação em dois fatores</h2>
              <p className="text-sm text-muted-foreground mt-1">Digite o código de 6 dígitos enviado ao seu autenticador.</p>
              <form
                className="mt-6 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (otp.length !== 6) return;
                  auth.login(email);
                  nav({ to: "/dashboard" });
                }}
              >
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="••••••"
                  className="text-center text-2xl tracking-[0.6em] font-display h-14"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                />
                <Button type="submit" className="w-full" size="lg" disabled={otp.length !== 6}>
                  Entrar no painel
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("login")}>
                  Voltar
                </Button>
                <p className="text-xs text-muted-foreground text-center">Use qualquer código de 6 dígitos no protótipo.</p>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
