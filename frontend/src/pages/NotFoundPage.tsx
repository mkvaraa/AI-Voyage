import { Link } from 'react-router';

import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-4 py-16 text-center">
      <h1 className="text-7xl font-bold tracking-tight sm:text-8xl">404</h1>
      <p className="text-lg text-muted-foreground sm:text-xl">Route not found</p>
      <Button asChild className="mt-2">
        <Link to="/">Back to Home</Link>
      </Button>
    </div>
  );
}
