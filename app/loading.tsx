'use client'

import { Spinner } from '@/components/ui/shadcn-io/spinner';

const loading = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center min-h-screen bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <Spinner 
            variant="ring" 
            className="text-primary" 
            size={64}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-primary/20 animate-pulse" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm font-medium text-foreground animate-pulse">
            Loading...
          </p>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default loading;