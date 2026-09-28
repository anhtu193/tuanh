import SiteFooter from "@/components/SiteFooter";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-6 py-16">
      <main className="flex flex-1 flex-col justify-center gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">tuanh</h1>
        <p className="max-w-md text-lg leading-8 text-foreground/70">
          A small place for things I build. Projects will live here soon.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
