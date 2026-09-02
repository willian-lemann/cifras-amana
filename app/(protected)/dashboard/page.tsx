"use client";

import { useState } from "react";
import { Plus, Trash2, Loader2, Sparkles } from "lucide-react";
import BlurFade from "@/components/blur-fade";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useUser } from "@/lib/queries/use-user";
import {
  useItems,
  useCreateItem,
  useDeleteItem,
} from "@/lib/queries/use-items";

function ItemsCard() {
  const { data: items, isLoading } = useItems();
  const createItem = useCreateItem();
  const deleteItem = useDeleteItem();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await createItem.mutateAsync({ title, content: content || undefined });
    setTitle("");
    setContent("");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Itens</CardTitle>
        <CardDescription>
          Recurso de exemplo (schema → service → API → hook). Use como base.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleCreate} className="space-y-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título"
          />
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Conteúdo (opcional)"
            rows={2}
          />
          <Button
            type="submit"
            size="sm"
            className="gap-1.5"
            disabled={createItem.isPending || !title.trim()}
          >
            {createItem.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Adicionar
          </Button>
        </form>

        <div className="space-y-2">
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Carregando...</p>
          ) : items && items.length > 0 ? (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  {item.content && (
                    <p className="text-muted-foreground line-clamp-2 text-xs">
                      {item.content}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => deleteItem.mutate(item.id)}
                  aria-label="Excluir item"
                >
                  <Trash2 className="text-destructive h-4 w-4" />
                </Button>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">
              Nenhum item ainda. Crie o primeiro acima.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AiDemoCard() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");
    setResult("");
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Falha ao gerar.");
      } else {
        setResult(data.text);
      }
    } catch {
      setError("Falha ao gerar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Geração com IA</CardTitle>
        <CardDescription>
          Exemplo de endpoint de IA (POST /api/ai/generate) com uso logado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <form onSubmit={handleGenerate} className="space-y-2">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Escreva um prompt..."
            rows={2}
          />
          <Button
            type="submit"
            size="sm"
            className="gap-1.5"
            disabled={loading || !prompt.trim()}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Gerar
          </Button>
        </form>
        {error && <p className="text-destructive text-sm">{error}</p>}
        {result && (
          <p className="bg-muted rounded-lg p-3 text-sm whitespace-pre-wrap">
            {result}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useUser();

  return (
    <div className="max-w-4xl space-y-6">
      <BlurFade delay={0}>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Olá{user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Bem-vindo ao seu painel.
          </p>
        </div>
      </BlurFade>

      <div className="grid gap-4 md:grid-cols-2">
        <BlurFade delay={0.1} inView>
          <ItemsCard />
        </BlurFade>
        <BlurFade delay={0.2} inView>
          <AiDemoCard />
        </BlurFade>
      </div>
    </div>
  );
}
