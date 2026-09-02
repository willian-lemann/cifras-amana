import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  ArrowUpDown,
  ClipboardPaste,
  Columns2,
  ListMusic,
  MousePointerClick,
  Music,
  Printer,
  SlidersHorizontal,
} from "lucide-react";
import BlurFade from "@/components/blur-fade";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/config";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: `${APP_NAME} — cifras prontas pra folha do culto`,
  description:
    "Cole a cifra, transponha pro tom da sua equipe e exporte um PDF A4 limpo, sem acorde separado da letra.",
};

const features = [
  {
    icon: Music,
    title: "Detecta o tom sozinho",
    description:
      "Cole a cifra e o tom original aparece na barra, sem você precisar procurar.",
  },
  {
    icon: ArrowUpDown,
    title: "Transpõe num clique",
    description:
      "Meio tom pra cima, meio pra baixo, ou pule direto pro tom que a equipe canta.",
  },
  {
    icon: MousePointerClick,
    title: "Acorde se escolhe, não se digita",
    description:
      "Clique no acorde e escolha tônica, tipo e baixo invertido pelo seletor.",
  },
  {
    icon: ListMusic,
    title: "Seções no lugar",
    description:
      "Marque o trecho e nomeie: INTRO, REFRÃO, PONTE. Vira um bloco separado na folha.",
  },
  {
    icon: Columns2,
    title: "Colunas automáticas",
    description:
      "Uma ou duas colunas conforme o tamanho da música, com a contagem de páginas antes de imprimir.",
  },
  {
    icon: Printer,
    title: "PDF pronto pra imprimir",
    description:
      "A4 com margem de 13mm. O acorde nunca fica numa coluna com a letra na outra.",
  },
];

const steps = [
  {
    icon: ClipboardPaste,
    title: "Cole a cifra",
    description:
      "De qualquer site, ou de um documento. O tom, os acordes e as seções são reconhecidos na hora.",
  },
  {
    icon: SlidersHorizontal,
    title: "Ajuste pro culto",
    description:
      "Transponha, corrija um acorde, renomeie as seções e escolha o tamanho da fonte.",
  },
  {
    icon: Printer,
    title: "Exporte em PDF",
    description:
      "Uma folha limpa, no tom certo, pronta pra pasta da equipe ou pra estante.",
  },
];

/** A chord as it is rendered on the sheet — highlighted like a marker pen. */
function Chord({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-[3px] bg-amber-200 px-[2px] text-neutral-900">
      {children}
    </span>
  );
}

/**
 * Numbers are runs of spaces, strings are chords. Keeping the gaps explicit is
 * what lets each chord land over the right syllable in the monospaced preview.
 */
function ChordLine({ spec }: { spec: (string | number)[] }) {
  return (
    <div className="font-bold">
      {spec.map((part, i) =>
        typeof part === "number" ? (
          <span key={i}>{" ".repeat(part)}</span>
        ) : (
          <Chord key={i}>{part}</Chord>
        ),
      )}
    </div>
  );
}

const ENABLE_LANDING = false;

export default function Home() {
  if (!ENABLE_LANDING) {
    return redirect("/cifra");
  }
  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Header */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <span className="flex items-center gap-2 text-base font-semibold tracking-tight">
          <Music className="text-primary h-5 w-5" />
          {APP_NAME}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" render={<Link href="/login" />}>
            Entrar
          </Button>
          <Button size="sm" render={<Link href="/cifra" />}>
            Abrir o editor
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pt-20 pb-12 text-center">
        <BlurFade delay={0}>
          <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-6xl">
            A cifra pronta pra folha do culto
          </h1>
        </BlurFade>
        <BlurFade delay={0.1}>
          <p className="text-muted-foreground mx-auto mt-6 max-w-xl text-lg text-pretty">
            Cole a cifra de qualquer lugar, transponha pro tom que a sua equipe
            canta e exporte um PDF limpo — sem acorde separado da letra.
          </p>
        </BlurFade>
        <BlurFade delay={0.2}>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button
              size="lg"
              className="gap-1.5"
              render={<Link href="/cifra" />}
            >
              Abrir o editor <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<Link href="#como-funciona" />}
            >
              Como funciona
            </Button>
          </div>
        </BlurFade>
        <BlurFade delay={0.3}>
          <p className="text-muted-foreground mt-4 text-xs">
            Grátis e sem cadastro. Roda no navegador.
          </p>
        </BlurFade>
      </section>

      {/* Sheet preview — the actual output, not a stock illustration */}
      <section className="mx-auto max-w-3xl px-6 pb-20">
        <BlurFade delay={0.35} inView>
          <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-[#fffdf8] p-6 shadow-sm sm:p-8">
            <div className="font-mono text-[11px] leading-[1.7] whitespace-pre text-neutral-800 sm:text-xs">
              <div className="font-bold">
                <span className="bg-yellow-200 text-neutral-900">REFRÃO:</span>
              </div>
              <ChordLine spec={["G", 10, "Em", 11, "C", 8, "D"]} />
              <div>Grande é o Senhor e mui digno de louvor</div>
              <ChordLine spec={["Am7", 10, "D7", 4, "G"]} />
              <div>Na cidade do nosso Deus</div>
            </div>
          </div>
          <p className="text-muted-foreground mt-3 text-center text-xs">
            É assim que sai no papel: acorde acima da sílaba, seção destacada.
          </p>
        </BlurFade>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature, i) => (
            <BlurFade key={feature.title} delay={0.1 * i} inView>
              <div className="h-full rounded-xl border p-6">
                <feature.icon className="text-primary h-6 w-6" />
                <h3 className="mt-4 text-base font-semibold">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm">
                  {feature.description}
                </p>
              </div>
            </BlurFade>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-center text-2xl font-bold tracking-tight">
          Da cifra colada à folha impressa
        </h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <BlurFade key={step.title} delay={0.1 * i} inView>
              <div className="flex flex-col items-start">
                <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-lg">
                  <step.icon className="h-4.5 w-4.5" />
                </div>
                <h3 className="mt-4 text-base font-semibold">
                  <span className="text-muted-foreground mr-1.5 font-mono text-sm">
                    {i + 1}.
                  </span>
                  {step.title}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm">
                  {step.description}
                </p>
              </div>
            </BlurFade>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <BlurFade delay={0.1} inView>
          <div className="rounded-xl border px-6 py-12 text-center">
            <h2 className="text-2xl font-bold tracking-tight">
              O ensaio é essa semana
            </h2>
            <p className="text-muted-foreground mx-auto mt-3 max-w-md text-sm text-pretty">
              Cole a primeira música e veja a folha ficar pronta antes de você
              terminar de escolher o tom.
            </p>
            <Button
              size="lg"
              className="mt-6 gap-1.5"
              render={<Link href="/cifra" />}
            >
              Abrir o editor <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </BlurFade>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-6 py-6 text-sm sm:flex-row">
          <span>
            © {new Date().getFullYear()} {APP_NAME}
          </span>
          <div className="flex gap-4">
            <Link href="/cifra" className="hover:text-foreground">
              Editor
            </Link>
            <Link href="/termos" className="hover:text-foreground">
              Termos
            </Link>
            <Link
              href="/politica-privacidade"
              className="hover:text-foreground"
            >
              Privacidade
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
