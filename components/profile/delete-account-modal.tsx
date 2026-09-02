"use client";

import { useState } from "react";
import { Loader2, TriangleAlert } from "lucide-react";
import { logErrorToSentry } from "@/lib/sentry";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { signOut } from "@/lib/auth-client";

export function DeleteAccountModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [reason, setReason] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);

    if (!reason.trim()) {
      setError("Por favor, informe o motivo da exclusão.");
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch("/api/user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao excluir conta.");
        return;
      }

      await signOut({
        fetchOptions: { onSuccess: () => window.location.replace("/login") },
      });
    } catch (error) {
      logErrorToSentry(error as Error, { location: "delete-account-modal" });
      setError("Erro ao excluir conta. Tente novamente.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!deleting) {
          onOpenChange(open);
          if (!open) {
            setReason("");
            setError(null);
          }
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="bg-destructive/10 rounded-md p-2">
              <TriangleAlert className="text-destructive size-5" />
            </div>
            <DialogTitle>Excluir conta</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            <strong className="text-foreground">
              Esta ação é irreversível.
            </strong>{" "}
            Ao excluir sua conta, todos os seus dados serão permanentemente
            removidos, incluindo:
          </DialogDescription>
          <ul className="text-muted-foreground list-disc space-y-0.5 pt-1 pl-5 text-sm">
            <li>Seus itens e dados</li>
            <li>Assinatura ativa (será cancelada)</li>
            <li>Dados de perfil e configurações</li>
          </ul>
        </DialogHeader>

        <div className="space-y-2 pt-1">
          <Label htmlFor="delete-reason">
            Motivo da exclusão <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="delete-reason"
            placeholder="Conte-nos por que está excluindo sua conta..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={deleting}
            className="min-h-20"
          />
          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting || !reason.trim()}
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Excluindo...
              </>
            ) : (
              "Excluir minha conta"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
