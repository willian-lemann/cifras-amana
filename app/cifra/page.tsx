import type { Metadata } from "next";
import { CifraApp } from "@/components/cifra/cifra-app";

export const metadata: Metadata = {
  title: "Cifra",
  description:
    "Cole a cifra, detecte o tom, transponha e exporte em PDF pronto pra folha do culto.",
};

export default function CifraPage() {
  return <CifraApp />;
}
