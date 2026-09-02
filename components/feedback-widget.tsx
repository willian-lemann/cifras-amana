"use client";

import {
  useState,
  useEffect,
  useImperativeHandle,
  type Ref,
  Suspense,
} from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { HeadsetIcon, Star, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import posthog from "posthog-js";
import { useSession } from "@/lib/auth-client";

const AUTO_OPEN_INTERVAL_MS = 5 * 60 * 1000; //

export type FeedbackWidgetHandle = {
  open: () => void;
  close: () => void;
};

const RATING_LABELS: Record<number, string> = {
  1: "Muito ruim",
  2: "Ruim",
  3: "Regular",
  4: "Bom",
  5: "Excelente",
};

function FeedbackWidgetInner({ ref }: { ref?: Ref<FeedbackWidgetHandle> }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const open = searchParams.has("feedback");

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function openWidget() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("feedback", "1");
    router.replace(`${pathname}?${params}`);
  }

  function closeWidget() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("feedback");
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`);
    sessionStorage.setItem("closed_feedback", "1");
  }

  function handleSubmit() {
    if (rating === 0) return;

    posthog.capture("feedback", { rating, text: text.trim() || undefined });

    setSubmitted(true);
  }

  function handleOpenChange(value: boolean) {
    if (value) {
      openWidget();
    } else {
      closeWidget();
      setRating(0);
      setHovered(0);
      setText("");
      setSubmitted(false);
    }
  }

  useImperativeHandle(ref, () => ({
    open: openWidget,
    close: closeWidget,
  }));

  useEffect(() => {
    const timer = setInterval(() => {
      if (
        !searchParams.has("feedback") &&
        !sessionStorage.getItem("closed_feedback")
      )
        openWidget();
    }, AUTO_OPEN_INTERVAL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  if (pathname === "/" || !session) return null;

  const activeRating = hovered || rating;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            size="icon"
            className="fixed right-6 bottom-6 z-50 size-12 rounded-full shadow-lg"
            aria-label="Abrir feedback"
          />
        }
      >
        <HeadsetIcon className="size-5" />
      </DialogTrigger>

      <DialogContent className="max-w-sm p-6" showCloseButton={!submitted}>
        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="size-10 text-green-500" />
            <div>
              <p className="font-medium">Obrigado pelo feedback!</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Sua opinião nos ajuda a melhorar a plataforma.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => handleOpenChange(false)}
            >
              Fechar
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div>
              <p className="font-semibold">Como você avalia a plataforma?</p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Sua opinião é muito importante para nós.
              </p>
            </div>

            {/* Star rating */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-medium">Nota</Label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    aria-label={`${star} estrela${star > 1 ? "s" : ""}`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    className="cursor-pointer p-0.5 transition-transform hover:scale-110 focus-visible:outline-none"
                  >
                    <Star
                      className={`size-7 transition-colors ${
                        star <= activeRating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/40 fill-transparent"
                      }`}
                    />
                  </button>
                ))}
                {activeRating > 0 && (
                  <span className="text-muted-foreground ml-2 text-xs">
                    {RATING_LABELS[activeRating]}
                  </span>
                )}
              </div>
            </div>

            {/* Text feedback */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="feedback-text" className="text-xs font-medium">
                Comentário{" "}
                <span className="text-muted-foreground font-normal">
                  (opcional)
                </span>
              </Label>
              <Textarea
                id="feedback-text"
                placeholder="O que você achou? Tem alguma sugestão?"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                maxLength={500}
                className="resize-none text-sm"
              />
              {text.length > 0 && (
                <p className="text-muted-foreground text-right text-xs">
                  {text.length}/500
                </p>
              )}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={rating === 0}
              className="w-full gap-1.5"
            >
              <Send className="size-3.5" />
              Enviar feedback
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function FeedbackWidget({ ref }: { ref?: Ref<FeedbackWidgetHandle> }) {
  return (
    <Suspense>
      <FeedbackWidgetInner ref={ref} />
    </Suspense>
  );
}
