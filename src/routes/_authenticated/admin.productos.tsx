import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useProducts } from "@/hooks/useTradingData";
import { CATEGORIES, changePct, formatPrice, type Product } from "@/lib/trading";

export const Route = createFileRoute("/_authenticated/admin/productos")({
  head: () => ({
    meta: [
      { title: "Productos | CavaBar Trading" },
      { name: "description", content: "Crea, edita y elimina los productos del bar con precios mínimos y máximos." },
      { property: "og:title", content: "Productos | CavaBar Trading" },
      { property: "og:description", content: "Gestión de catálogo del bar." },
    ],
  }),
  component: ProductosPage,
});

type Draft = {
  name: string;
  category: string;
  description: string;
  image_url: string;
  base_price: number;
  min_price: number;
  max_price: number;
  current_price: number;
  stock: number;
  is_active: boolean;
};

const EMPTY: Draft = {
  name: "",
  category: "cervezas",
  description: "",
  image_url: "",
  base_price: 10000,
  min_price: 8000,
  max_price: 15000,
  current_price: 10000,
  stock: 50,
  is_active: true,
};

function ProductosPage() {
  const products = useProducts(false);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["products"] });
    void queryClient.invalidateQueries({ queryKey: ["price_history"] });
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        ...draft,
        image_url: draft.image_url || null,
        previous_price: editing ? Number(editing.current_price) : draft.current_price,
      };
      if (editing) {
        const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
        if (error) throw error;
        await supabase
          .from("price_history")
          .insert({ product_id: editing.id, price: draft.current_price });
      } else {
        const { data, error } = await supabase.from("products").insert(payload).select("id").single();
        if (error) throw error;
        if (data)
          await supabase
            .from("price_history")
            .insert({ product_id: data.id, price: draft.current_price });
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Producto actualizado" : "Producto creado");
      setOpen(false);
      setEditing(null);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Producto eliminado");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => {
    setEditing(null);
    setDraft(EMPTY);
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setDraft({
      name: p.name,
      category: p.category,
      description: p.description ?? "",
      image_url: p.image_url ?? "",
      base_price: Number(p.base_price),
      min_price: Number(p.min_price),
      max_price: Number(p.max_price),
      current_price: Number(p.current_price),
      stock: p.stock,
      is_active: p.is_active,
    });
    setOpen(true);
  };

  const list = products.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Productos</h1>
          <p className="text-sm text-muted-foreground">
            Define los rangos de precio en los que el mercado puede moverse.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="size-4" /> Nuevo producto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar producto" : "Nuevo producto"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nombre" className="sm:col-span-2">
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </Field>
              <Field label="Categoría">
                <Select
                  value={draft.category}
                  onValueChange={(v) => setDraft({ ...draft, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Stock">
                <Input
                  type="number"
                  value={draft.stock}
                  onChange={(e) => setDraft({ ...draft, stock: Number(e.target.value) })}
                />
              </Field>
              <Field label="Descripción corta" className="sm:col-span-2">
                <Textarea
                  rows={2}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </Field>
              <Field label="URL de imagen" className="sm:col-span-2">
                <Input
                  placeholder="https://…"
                  value={draft.image_url}
                  onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
                />
              </Field>
              <Field label="Precio base">
                <Input
                  type="number"
                  value={draft.base_price}
                  onChange={(e) => setDraft({ ...draft, base_price: Number(e.target.value) })}
                />
              </Field>
              <Field label="Precio actual">
                <Input
                  type="number"
                  value={draft.current_price}
                  onChange={(e) => setDraft({ ...draft, current_price: Number(e.target.value) })}
                />
              </Field>
              <Field label="Precio mínimo">
                <Input
                  type="number"
                  value={draft.min_price}
                  onChange={(e) => setDraft({ ...draft, min_price: Number(e.target.value) })}
                />
              </Field>
              <Field label="Precio máximo">
                <Input
                  type="number"
                  value={draft.max_price}
                  onChange={(e) => setDraft({ ...draft, max_price: Number(e.target.value) })}
                />
              </Field>
              <div className="flex items-center justify-between rounded-xl border border-border p-3 sm:col-span-2">
                <Label htmlFor="active">Producto activo en el tablero</Label>
                <Switch
                  id="active"
                  checked={draft.is_active}
                  onCheckedChange={(v) => setDraft({ ...draft, is_active: v })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => save.mutate()}
                disabled={save.isPending || draft.name.trim().length === 0}
              >
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="glass overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-border text-left text-[11px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Rango</th>
              <th className="px-4 py-3">Actual</th>
              <th className="px-4 py-3">Var.</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.map((p) => {
              const pct = changePct(p);
              return (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-semibold">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                  <td className="num px-4 py-3 text-muted-foreground">
                    {formatPrice(Number(p.min_price))} – {formatPrice(Number(p.max_price))}
                  </td>
                  <td className="num px-4 py-3 font-bold">{formatPrice(Number(p.current_price))}</td>
                  <td
                    className="num px-4 py-3 font-semibold"
                    style={{ color: pct >= 0 ? "var(--up)" : "var(--down)" }}
                  >
                    {pct >= 0 ? "+" : ""}
                    {pct.toFixed(1)}%
                  </td>
                  <td className="num px-4 py-3">{p.stock}</td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                      style={{
                        color: p.is_active ? "var(--up)" : "var(--muted-foreground)",
                        background: p.is_active
                          ? "color-mix(in oklab, var(--up) 14%, transparent)"
                          : "var(--muted)",
                      }}
                    >
                      {p.is_active ? "ACTIVO" : "INACTIVO"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(p)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => remove.mutate(p.id)}
                        aria-label={`Eliminar ${p.name}`}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
