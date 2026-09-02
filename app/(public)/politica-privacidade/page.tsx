import Link from "next/link";
import type { Metadata } from "next";
import { APP_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: `Política de privacidade do ${APP_NAME}.`,
};

export default function PoliticaPrivacidadePage() {
  return (
    <div className="bg-background min-h-screen">
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center px-4">
          <Link href="/" className="text-lg font-bold">
            {APP_NAME}
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">
          Política de Privacidade
        </h1>
        <p className="text-muted-foreground mb-10 text-sm">
          Última atualização: — (preencha)
        </p>

        <div className="text-muted-foreground space-y-4 text-sm leading-relaxed">
          <p>
            Este é um documento modelo. Substitua este conteúdo pela política de
            privacidade do seu produto antes de publicar.
          </p>
        </div>
      </main>
    </div>
  );
}
