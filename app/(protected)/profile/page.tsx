"use client";

import { useRef, useState } from "react";
import { logErrorToSentry } from "@/lib/sentry";
import { Camera, Mail, User, Save, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { DeleteAccountModal } from "@/components/profile/delete-account-modal";
import { useUser } from "@/lib/queries/use-user";
import { useQueryClient } from "@tanstack/react-query";
import BlurFade from "@/components/blur-fade";

export default function ProfilePage() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatarUrl = avatarPreview || user?.image || null;

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    setAvatarPreview(URL.createObjectURL(file));

    setUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const { error } = await res.json();
        alert(error || "Erro ao enviar foto.");
        setAvatarPreview(null);
      }
    } catch (error) {
      logErrorToSentry(error as Error, { location: "profile uploadAvatar" });
      alert("Erro ao enviar foto.");
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
      // Reset input so the same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveSuccess(false);

    setSaving(true);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameValue || user?.name || "" }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        queryClient.invalidateQueries({ queryKey: ["user-profile"] });
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      logErrorToSentry(error as Error, { location: "profile handleSave" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <BlurFade delay={0}>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Minha conta</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Gerencie as configurações da sua conta
          </p>
        </div>
      </BlurFade>

      <BlurFade delay={0.1} inView>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações da Conta</CardTitle>
            <CardDescription>Atualize seus dados pessoais</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="bg-muted relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full text-xl font-semibold">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="Foto de perfil"
                      fill
                      className="object-cover"
                      unoptimized
                      sizes="64px"
                    />
                  ) : (
                    <span>{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
                  )}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={uploadingAvatar}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-3.5 w-3.5" /> Alterar foto
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name">Nome</Label>
                <div className="relative">
                  <User className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="name"
                    value={nameValue || user?.name || ""}
                    onChange={(e) => setNameValue(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="email"
                    defaultValue={user?.email || ""}
                    disabled
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  disabled={saving || uploadingAvatar}
                  className="gap-1.5"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Salvar alterações
                    </>
                  )}
                </Button>
                {saveSuccess && (
                  <span className="text-sm text-emerald-600">
                    Salvo com sucesso!
                  </span>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </BlurFade>

      <BlurFade delay={0.2} inView>
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive text-base">
              Zona de Perigo
            </CardTitle>
            <CardDescription>
              A exclusão da conta é permanente. Todos os seus dados serão
              removidos sem possibilidade de recuperação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              className="gap-1.5"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 className="h-4 w-4" /> Excluir minha conta
            </Button>
          </CardContent>
        </Card>
      </BlurFade>

      <DeleteAccountModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
      />
    </div>
  );
}
