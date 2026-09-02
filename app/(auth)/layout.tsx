import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { FieldDescription } from "@/components/ui/field";
import { APP_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: `Entrar — ${APP_NAME}`,
  description: `Acesse sua conta no ${APP_NAME}.`,
  robots: {
    index: false,
    follow: true,
  },
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname");

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/dashboard");
  }

  const isSignupRoute = pathname === "/sign-up";

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden p-0">
            <CardContent className="grid p-0 md:grid-cols-1">
              {/* form login */}
              <div
                data-signup={isSignupRoute}
                className="py-20 data-[signup=true]:py-0"
              >
                {children}
              </div>
              {/* <div className="bg-muted relative hidden md:block">
                <Image
                  height={600}
                  width={400}
                  loading="eager"
                  src={`${process.env.R2_PUBLIC_URL}/assets/background-login.png`}
                  alt="Imagem no background do Login"
                  className="absolute inset-0 h-fit w-full object-cover data-[signup=true]:h-full dark:brightness-[0.2] dark:grayscale"
                />
              </div> */}
            </CardContent>
          </Card>
          <FieldDescription className="px-6 text-center italic">
            Ao clicar em entrar, você concorda com nossos{" "}
            <a href="/termos" target="_blank">
              Termos de Serviço
            </a>{" "}
            e{" "}
            <a href="/politica-privacidade" target="_blank">
              Política de Privacidade
            </a>
            .
          </FieldDescription>
        </div>
      </div>
    </div>
  );
}
