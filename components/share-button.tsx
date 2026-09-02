"use client";

import { useCallback, useState } from "react";
import { Camera, Share2 } from "lucide-react";
import { toast } from "sonner";
import { logErrorToSentry } from "@/lib/sentry";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Instagram Stories limitation
 * ----------------------------
 * Instagram does NOT expose a public web API for posting a Story or attaching a
 * link sticker programmatically. Meta's "Share to Stories" flow only exists for
 * the native iOS/Android SDKs, and content publishing requires going through
 * Facebook/Meta app review with the relevant permissions.
 *
 * So from a website the best we can do is:
 *   1. Use the native share sheet (`navigator.share`). On mobile this lets the
 *      user pick Instagram and post to their Story directly.
 *   2. For the explicit "Instagram" action, copy the link to the clipboard and
 *      open the Instagram app, then instruct the user to paste the link into a
 *      Story "link sticker" manually.
 */

const INSTAGRAM_STORY_CAMERA_URL = "instagram://story-camera";

function isMobileUserAgent(): boolean {
  if (typeof navigator === "undefined") return false;
  return /android|iphone|ipad|ipod/i.test(navigator.userAgent);
}

async function copyLink(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch (error) {
    logErrorToSentry(error as Error, { location: "share-button copyLink" });
    return false;
  }
}

/**
 * Tries the native share sheet first; on desktop / unsupported browsers it
 * falls back to copying the link to the clipboard.
 */
export async function shareNative({
  url,
  title,
}: {
  url: string;
  title: string;
}): Promise<void> {
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function"
  ) {
    try {
      await navigator.share({ title, url });
      return;
    } catch (err) {
      // User dismissed the share sheet — nothing to report.
      if ((err as Error).name === "AbortError") return;
    }
  }

  if (await copyLink(url)) {
    toast.success("Link copiado!");
  } else {
    toast.error("Não foi possível copiar o link.");
  }
}

/**
 * Copies the link and (on mobile) opens the Instagram Story camera, instructing
 * the user to paste the link into a Story link sticker. See the limitation note
 * at the top of this file.
 */
export async function shareToInstagram(url: string): Promise<void> {
  const copied = await copyLink(url);

  if (copied) {
    toast.success("Link copiado!", {
      description:
        "Abra o Instagram, crie um Story e cole o link no sticker de link.",
    });
  } else {
    toast.error("Não foi possível copiar o link.");
  }

  // Only attempt the app deep-link on mobile; on desktop it would do nothing
  // useful (and could trigger a "no app" prompt).
  if (copied && isMobileUserAgent() && typeof window !== "undefined") {
    window.location.href = INSTAGRAM_STORY_CAMERA_URL;
  }
}

type ShareButtonProps = {
  /** Full absolute URL to share (e.g. https://example.com/page). */
  url: string;
  /** Title used by the native share sheet. */
  title: string;
  className?: string;
};

export function ShareButton({ url, title, className }: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = useCallback(async () => {
    setIsSharing(true);
    try {
      await shareNative({ url, title });
    } finally {
      setIsSharing(false);
    }
  }, [url, title]);

  const handleInstagram = useCallback(() => {
    void shareToInstagram(url);
  }, [url]);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Button
        type="button"
        variant="outline"
        className="w-full gap-1.5"
        disabled={isSharing}
        onClick={handleShare}
      >
        <Share2 className="h-3.5 w-3.5" />
        {isSharing ? "Compartilhando…" : "Compartilhar"}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full gap-1.5"
        onClick={handleInstagram}
      >
        <Camera className="h-3.5 w-3.5" /> Compartilhar no Instagram
      </Button>
    </div>
  );
}
