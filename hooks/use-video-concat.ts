// "use client";

// /**
//  * useVideoConcat —  s LumaAI clips in the browser via FFmpeg WASM,
//  * then uploads the result to R2 via presigned URL.
//  *
//  * Requires COOP/COEP headers for SharedArrayBuffer:
//  *   Cross-Origin-Opener-Policy: same-origin
//  *   Cross-Origin-Embedder-Policy: require-corp
//  */

// import { useRef, useState, useCallback } from "react";
// import { FFmpeg } from "@ffmpeg/ffmpeg";

// export type ConcatStatus =
//   | "idle"
//   | "loading-ffmpeg"
//   | "downloading"
//   | "concatenating"
//   | "uploading"
//   | "done"
//   | "error";

// export function useVideoConcat() {
//   const ffmpegRef = useRef<FFmpeg | null>(null);
//   const [status, setStatus] = useState<ConcatStatus>("idle");
//   const [progress, setProgress] = useState(0); // 0–100
//   const [error, setError] = useState<string | null>(null);

//   const loadFFmpeg = useCallback(async () => {
//     if (ffmpegRef.current) return ffmpegRef.current;
//     setStatus("loading-ffmpeg");

//     const { FFmpeg } = await import("@ffmpeg/ffmpeg");

//     const ffmpeg = new FFmpeg();
//     ffmpeg.on("progress", ({ progress: p }) => {
//       setProgress(Math.round(p * 100));
//     });

//     // ✅ Sem toBlobURL, sem CDN, sem problema de bundler
//     const origin = typeof window !== "undefined" ? window.location.origin : "";

//     await ffmpeg.load({
//       coreURL: `${origin}/ffmpeg/ffmpeg-core.js`,
//       wasmURL: `${origin}/ffmpeg/ffmpeg-core.wasm`,
//     });

//     ffmpegRef.current = ffmpeg;
//     return ffmpeg;
//   }, []);

//   const concatenate = useCallback(
//     async (clipUrls: string[], videoId: number): Promise<string> => {
//       const { fetchFile } = await import("@ffmpeg/util");

//       setError(null);
//       setProgress(0);

//       try {
//         const ffmpeg = await loadFFmpeg();

//         // 1. Download clips into FFmpeg virtual FS
//         setStatus("downloading");
//         const clipNames: string[] = [];

//         for (let i = 0; i < clipUrls.length; i++) {
//           const name = `clip_${String(i).padStart(2, "0")}.mp4`;
//           await ffmpeg.writeFile(name, await fetchFile(clipUrls[i]));
//           clipNames.push(name);
//           setProgress(Math.round(((i + 1) / clipUrls.length) * 30)); // 0–30%
//         }

//         // 2. Write concat list
//         const listContent = clipNames.map((n) => `file '${n}'`).join("\n");
//         await ffmpeg.writeFile("list.txt", listContent);

//         // 3. Concatenate — stream copy, no re-encode, very fast

//         setStatus("concatenating");
//         setProgress(30);

//         await ffmpeg.exec([
//           "-f",
//           "concat",
//           "-safe",
//           "0",
//           "-i",
//           "list.txt",
//           "-c",
//           "copy",
//           "output.mp4",
//         ]);

//         setProgress(80);

//         // 4. Read output
//         const data = await ffmpeg.readFile("output.mp4");
//         const blob = new Blob([data as BlobPart], { type: "video/mp4" });

//         // 5. Get presigned URL from our API
//         setStatus("uploading");
//         const presignRes = await fetch("/api/upload/video", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ videoId }),
//         });

//         if (!presignRes.ok) throw new Error("Failed to get presigned URL");
//         const { uploadUrl, publicUrl } = await presignRes.json();

//         // 6. Upload to R2
//         const uploadRes = await fetch(uploadUrl, {
//           method: "PUT",
//           body: blob,
//           headers: { "Content-Type": "video/mp4" },
//         });

//         if (!uploadRes.ok) throw new Error("R2 upload failed");

//         // 7. Update video status in DB via PATCH
//         const patchRes = await fetch(`/api/studio/${videoId}`, {
//           method: "PATCH",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ status: "COMPLETED", url: publicUrl }),
//         });

//         if (!patchRes.ok) throw new Error("Failed to update video status");

//         setProgress(100);
//         setStatus("done");

//         // Cleanup virtual FS
//         for (const name of clipNames) await ffmpeg.deleteFile(name);
//         await ffmpeg.deleteFile("list.txt");
//         await ffmpeg.deleteFile("output.mp4");

//         return publicUrl;
//       } catch (err) {
//         const message = err instanceof Error ? err.message : "Unknown error";
//         setError(message);
//         setStatus("error");
//         throw err;
//       }
//     },
//     [loadFFmpeg],
//   );

//   return { concatenate, status, progress, error };
// }
