import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/")({
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