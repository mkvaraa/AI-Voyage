import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';

type ShareButtonProps = {
  slug: string;
};

export default function ShareButton({ slug }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    const url = `${window.location.origin}/route/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may be unavailable (e.g. non-HTTPS context); silently ignore.
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      aria-label={copied ? 'Link copied to clipboard' : 'Copy share link'}
    >
      {copied ? <Check /> : <Copy />}
      {copied ? 'Copied!' : 'Share'}
    </Button>
  );
}
