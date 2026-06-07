import { Suspense } from 'react';
import { Outlet } from 'react-router';
import { Loader2, Globe2 } from 'lucide-react';
import Navbar from './Navbar';

function PageSpinner() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <Loader2 className="relative h-10 w-10 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Loading your journey…</p>
      </div>
    </div>
  );
}

export default function Layout() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -top-20 right-[-10rem] h-[24rem] w-[24rem] rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="absolute bottom-[-12rem] left-1/3 h-[26rem] w-[26rem] rounded-full bg-sky-500/15 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:36px_36px]" />
      </div>

      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:py-10">
        <Suspense fallback={<PageSpinner />}>
          <Outlet />
        </Suspense>
      </main>

      <footer className="border-t border-border/60 bg-background/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <Globe2 className="size-4 text-primary" />
            <span className="font-medium text-foreground">AI-Voyage</span>
            <span className="hidden sm:inline">— plan smarter trips</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              Made by CU students - M.K and V.C. All rights reserved.
            </span>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
