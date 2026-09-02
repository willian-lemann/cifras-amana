import { APP_NAME } from "@/lib/config";

// Example tenant page. Reached at `tenant.<root>/` when subdomain routing is
// enabled (see proxy.ts + lib/next-config/subdomains.ts), rewritten to
// `/s/[subdomain]`. Replace this with your real per-tenant content.
export default async function TenantPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-muted-foreground text-sm">{APP_NAME} · tenant</p>
      <h1 className="text-3xl font-bold tracking-tight">{subdomain}</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        Esta é a página de exemplo do subdomínio{" "}
        <span className="font-medium">{subdomain}</span>. Personalize o conteúdo
        por tenant aqui.
      </p>
    </div>
  );
}
