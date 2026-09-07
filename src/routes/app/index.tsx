import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Inicio | CavaBar Trading" },
      {
        name: "description",
        content: "Consulta el mercado de bebidas, sus precios dinámicos y promociones en vivo.",
      },
      { property: "og:title", content: "Inicio | CavaBar Trading" },
      {
        property: "og:description",
        content: "El mercado de bebidas de CavaBar con precios y promociones en vivo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Bienvenido a CavaBar Trading
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Los precios cambian en tiempo real según la demanda. ¡Aprovecha las bajadas!
        </p>
      </main>
    </div>
  );
}