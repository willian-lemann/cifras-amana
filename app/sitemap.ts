import { MetadataRoute } from "next";

// `||` e nao `??` pelo mesmo motivo de app/layout.tsx: em build de container
// a variavel chega como string vazia, e "" geraria URLs relativas no
// sitemap, que sao invalidas.
const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/termos`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/politica-privacidade`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
