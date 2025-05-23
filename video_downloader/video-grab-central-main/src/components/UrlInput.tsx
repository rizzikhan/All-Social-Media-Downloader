import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Download, Loader, AlertCircle } from 'lucide-react';
import { validateAndNormalizeUrl, type UrlValidationResult, type PlatformInfo } from '@/lib/url-utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UrlInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export function UrlInput({ onSubmit, isLoading }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const [validationResult, setValidationResult] = useState<UrlValidationResult | null>(null);
  const [debouncedUrl, setDebouncedUrl] = useState('');

  // Debounce URL validation
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUrl(url);
    }, 500);

    return () => clearTimeout(timer);
  }, [url]);

  // Validate URL when debounced value changes
  useEffect(() => {
    if (debouncedUrl) {
      const result = validateAndNormalizeUrl(debouncedUrl);
      setValidationResult(result);
    } else {
      setValidationResult(null);
    }
  }, [debouncedUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validationResult?.isValid && validationResult.normalizedUrl) {
      onSubmit(validationResult.normalizedUrl);
    }
  };

  const getInputClassName = useCallback(() => {
    return cn(
      "pr-32 w-full bg-secondary/50 border-primary/20 placeholder:text-muted-foreground/50 text-foreground",
      validationResult && !validationResult.isValid && "border-red-500 focus-visible:ring-red-500",
      validationResult?.isValid && "border-green-500 focus-visible:ring-green-500"
    );
  }, [validationResult]);

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-2">
      <div className="relative w-full">
        <div className="relative">
          <Input
            type="text"
            placeholder="Paste video URL here (YouTube, Instagram, TikTok, etc.)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={getInputClassName()}
            aria-invalid={validationResult && !validationResult.isValid}
            aria-describedby={validationResult && !validationResult.isValid ? "url-error" : undefined}
          />
          {validationResult?.platform && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="secondary" className="px-2 py-0.5">
                      <i className={`fab fa-${validationResult.platform.icon} mr-1`}></i>
                      {validationResult.platform.name}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Supported platform detected</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
          <Button 
            type="submit" 
            className={cn(
              "absolute right-1 top-1 px-3 h-8",
              validationResult?.isValid 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-primary hover:bg-primary/90",
              "text-white transition-colors"
            )}
            disabled={isLoading || !validationResult?.isValid}
          >
            {isLoading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      {validationResult && !validationResult.isValid && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription id="url-error" className="text-sm">
            {validationResult.error}
          </AlertDescription>
        </Alert>
      )}
      
      {validationResult?.isValid && (
        <Alert className="py-2 border-green-500 bg-green-50 dark:bg-green-900/20">
          <AlertDescription className="text-sm text-green-700 dark:text-green-300">
            Valid {validationResult.platform?.name} URL detected
          </AlertDescription>
        </Alert>
      )}
    </form>
  );
}
