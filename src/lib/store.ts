import { useEffect, useState, useSyncExternalStore } from "react";

export type Supplier = {
  name: string;
  phone: string;
  email: string;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  minStock: number;
  idealStock?: number;
  price: number;
  supplier?: Supplier;
  createdAt: string;
};

const KEY = "estoque.products.v2";
const SESSION = "estoque.session.v1";

const seed: Product[] = [
  { id: "1", name: "Café Especial 250g", sku: "CAF-250", category: "Bebidas", quantity: 42, minStock: 10, idealStock: 40, price: 32.9, supplier: { name: "Torrefação Serra Azul", phone: "5511987651122", email: "vendas@serraazul.com.br" }, createdAt: new Date().toISOString() },
  { id: "2", name: "Chocolate 70% 100g", sku: "CHO-070", category: "Doces", quantity: 8, minStock: 12, idealStock: 36, price: 18.5, supplier: { name: "Cacau & Cia", phone: "5521991234567", email: "comercial@cacauecia.com.br" }, createdAt: new Date().toISOString() },
  { id: "3", name: "Açúcar Demerara 1kg", sku: "ACU-DEM", category: "Mercearia", quantity: 60, minStock: 20, idealStock: 60, price: 14.2, supplier: { name: "Engenho Bom Jardim", phone: "5581988774455", email: "pedidos@bomjardim.com.br" }, createdAt: new Date().toISOString() },
  { id: "4", name: "Leite Integral 1L", sku: "LEI-INT", category: "Laticínios", quantity: 24, minStock: 15, idealStock: 50, price: 6.9, supplier: { name: "Laticínios Vale Verde", phone: "5531992345678", email: "atendimento@valeverde.com.br" }, createdAt: new Date().toISOString() },
  { id: "5", name: "Pão Brioche 500g", sku: "PAO-BRI", category: "Padaria", quantity: 5, minStock: 10, idealStock: 30, price: 12.0, supplier: { name: "Padaria Forno de Pedra", phone: "5511993456789", email: "contato@fornodepedra.com.br" }, createdAt: new Date().toISOString() },
];

const listeners = new Set<() => void>();
let products: Product[] = [];

function load() {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(KEY);
  products = raw ? JSON.parse(raw) : seed;
  if (!raw) localStorage.setItem(KEY, JSON.stringify(seed));
}
function persist() {
  localStorage.setItem(KEY, JSON.stringify(products));
  listeners.forEach((l) => l());
}

export const productStore = {
  init: load,
  get: () => products,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  add(p: Omit<Product, "id" | "createdAt">) {
    products = [{ ...p, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...products];
    persist();
  },
  remove(id: string) {
    products = products.filter((x) => x.id !== id);
    persist();
  },
  adjust(id: string, delta: number) {
    products = products.map((p) => (p.id === id ? { ...p, quantity: Math.max(0, p.quantity + delta) } : p));
    persist();
  },
};

export function useProducts() {
  const [ready, setReady] = useState(false);
  useEffect(() => { productStore.init(); setReady(true); }, []);
  const data = useSyncExternalStore(
    productStore.subscribe,
    () => productStore.get(),
    () => [] as Product[],
  );
  return ready ? data : [];
}

const ADMIN_KEY = "estoque.admin.v1";

export type Admin = { username: string; password: string; createdAt: string };

export const auth = {
  isAuthed() {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(SESSION);
  },
  hasAdmin() {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(ADMIN_KEY);
  },
  registerAdmin(username: string, password: string) {
    const admin: Admin = { username, password, createdAt: new Date().toISOString() };
    localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
  },
  getAdmin(): Admin | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(ADMIN_KEY);
    return raw ? (JSON.parse(raw) as Admin) : null;
  },
  validate(username: string, password: string) {
    const a = this.getAdmin();
    return !!a && a.username === username && a.password === password;
  },
  login(username: string) {
    localStorage.setItem(SESSION, JSON.stringify({ email: username, at: Date.now() }));
  },
  user() {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(SESSION);
    return raw ? (JSON.parse(raw) as { email: string }) : null;
  },
  logout() { localStorage.removeItem(SESSION); },
};
