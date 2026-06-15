import { Component, type ErrorInfo, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, info);
    }
  }

  handleRefresh = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    const { error } = this.state;
    const { children, fallback } = this.props;

    if (!error) return children;
    if (fallback) return fallback;

    return (
      <div
        role="alert"
        className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-4 py-16 text-center"
      >
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Something went wrong</h2>
        {import.meta.env.DEV && (
          <pre className="max-w-full overflow-auto whitespace-pre-wrap rounded-md border bg-muted px-3 py-2 text-left text-xs text-muted-foreground">
            {error.message}
          </pre>
        )}
        <Button onClick={this.handleRefresh}>Refresh page</Button>
      </div>
    );
  }
}
