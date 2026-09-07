import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CavaBar Trading | Mercado de bebidas en vivo" },
      {
        name: "description",
        content:
          "Accede al mercado de bebidas de CavaBar con precios dinámicos y promociones en tiempo real.",
      },
      { property: "og:title", content: "CavaBar Trading | Mercado de bebidas en vivo" },
      {
        property: "og:description",
        content:
          "Precios dinámicos y promociones en tiempo real para vivir la experiencia CavaBar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/app" });
  },
});
