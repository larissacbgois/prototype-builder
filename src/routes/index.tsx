import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Boxes, ShieldCheck, UserPlus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { auth } from "@/lib/store";
import { toast } from "sonner";

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
  const [username, setUsername] = useState("");
  const [pwd, setPwd] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"login" | "2fa">("login");
  const [error, setError] = useState("");

  // Admin registration modal
  const [registerOpen, setRegisterOpen] = useState(false);
  const [hasAdmin, setHasAdmin] = useState(false);
  const [regUser, setRegUser] = useState("");
  const [regPwd, setRegPwd] = useState("");
  const [regPwd2, setRegPwd2] = useState("");
  const [regError, setRegError] = useState("");

  useEffect(() => {
    if (auth.isAuthed()) nav({ to: "/dashboard" });
    setHasAdmin(auth.hasAdmin());
  }, [nav]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!auth.hasAdmin()) {
      setError("Nenhum administrador cadastrado. Cadastre-se primeiro.");
      return;
    }
    if (!auth.validate(username, pwd)) {
      setError("Usuário ou senha incorretos.");
      return;
    }
    setStep("2fa");
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    if (regUser.trim().length < 3) return setRegError("Usuário deve ter ao menos 3 caracteres.");
    if (regPwd.length < 3) return setRegError("Senha deve ter ao menos 3 caracteres.");
    if (regPwd !== regPwd2) return setRegError("As senhas não coincidem.");
    auth.registerAdmin(regUser.trim(), regPwd);
    setHasAdmin(true);
    setRegisterOpen(false);
    setUsername(regUser.trim());
    setPwd("");
    setRegUser(""); setRegPwd(""); setRegPwd2("");
    toast.success("Administrador cadastrado com sucesso");
  };

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
              <p className="text-sm text-muted-foreground mt-1">
                {hasAdmin ? "Entre com suas credenciais de administrador." : "Comece cadastrando o administrador."}
              </p>
              <form className="mt-6 space-y-4" onSubmit={handleLogin}>
                <div className="space-y-2">
                  <Label htmlFor="user">Usuário</Label>
                  <Input id="user" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pwd">Senha</Label>
                  <Input id="pwd" type="password" required value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="••••" />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" size="lg" disabled={!hasAdmin}>Continuar</Button>
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center"><span className="bg-card px-3 text-xs text-muted-foreground">ou</span></div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  size="lg"
                  onClick={() => setRegisterOpen(true)}
                >
                  <UserPlus className="size-4" />
                  {hasAdmin ? "Cadastrar outro administrador" : "Cadastrar administrador"}
                </Button>
                {hasAdmin && (
                  <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <CheckCircle2 className="size-3 text-primary" /> Administrador já cadastrado
                  </p>
                )}
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
                  auth.login(username);
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
                <Button type="button" variant="ghost" className="w-full" onClick={() => { setStep("login"); setOtp(""); }}>
                  Voltar
                </Button>
                <p className="text-xs text-muted-foreground text-center">Use qualquer código de 6 dígitos no protótipo.</p>
              </form>
            </>
          )}
        </div>
      </section>

      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Cadastrar administrador</DialogTitle>
            <DialogDescription>
              Crie a conta de administrador que terá acesso completo ao painel.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="regUser">Usuário</Label>
              <Input id="regUser" autoFocus value={regUser} onChange={(e) => setRegUser(e.target.value)} placeholder="admin" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regPwd">Senha</Label>
              <Input id="regPwd" type="password" value={regPwd} onChange={(e) => setRegPwd(e.target.value)} placeholder="••••" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regPwd2">Confirmar senha</Label>
              <Input id="regPwd2" type="password" value={regPwd2} onChange={(e) => setRegPwd2(e.target.value)} placeholder="••••" required />
            </div>
            {regError && <p className="text-sm text-destructive">{regError}</p>}
            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" onClick={() => setRegisterOpen(false)}>Cancelar</Button>
              <Button type="submit">Cadastrar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
