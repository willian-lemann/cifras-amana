import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const ErrorPage2 = () => {
  return (
    <div className="grid min-h-screen w-full xl:grid-cols-1">
      <div className="flex w-full flex-col items-center justify-center p-0">
        {/* Logo */}

        <div className="mt-8 flex flex-1 flex-col items-center justify-center text-center xl:items-center xl:text-center">
          <div className="mb-3 flex items-center gap-3">
            <span className="text-sm font-semibold">404</span>
          </div>
          <h1 className="mb-2 text-4xl font-bold">Página não encontrada</h1>
          <p>Oops! A página que você está tentando procurar não existe.</p>
          <Link href={"/dashboard"}>
            <Button className="mt-8 h-9 cursor-pointer px-4 py-2">
              <ArrowLeft />
              <span>Voltar para pagina inicial</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage2;
