
import { Progress } from '@/components/ui/progress';
import { useEffect, useState } from 'react';

interface DownloadProgressProps {
  isDownloading: boolean;
  onComplete?: () => void;
}

export function DownloadProgress({ isDownloading, onComplete }: DownloadProgressProps) {
  const [progress, setProgress] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState('0 KiB/s');
  const [eta, setEta] = useState('00:00');
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [fileSize, setFileSize] = useState(0);
  const [elapsedTime, setElapsedTime] = useState('00:00');

  useEffect(() => {
    if (!isDownloading) {
      setProgress(0);
      setDownloadSpeed('0 KiB/s');
      setEta('00:00');
      setDownloadedBytes(0);
      setFileSize(0);
      setElapsedTime('00:00');
      return;
    }

    const startTime = Date.now();
    let timerInterval: number | null = null;

    // Update elapsed time independently
    const elapsedTimer = setInterval(() => {
      const seconds = Math.floor((Date.now() - startTime) / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      setElapsedTime(`${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`);
    }, 1000);

    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        // Simulate download progress
        const increment = Math.random() * 3 + 0.5; // More realistic increment
        const newProgress = prevProgress + increment;
        
        // Simulate download speed
        const speedOptions = ['1.2 MiB/s', '950 KiB/s', '1.5 MiB/s', '820 KiB/s', '1.1 MiB/s'];
        setDownloadSpeed(speedOptions[Math.floor(Math.random() * speedOptions.length)]);
        
        // Simulate remaining time
        const remainingPercentage = 100 - newProgress;
        const secondsRemaining = Math.floor(remainingPercentage / 5) + Math.floor(Math.random() * 10);
        const minutes = Math.floor(secondsRemaining / 60);
        const seconds = secondsRemaining % 60;
        setEta(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        
        // Simulate file size and downloaded bytes
        if (fileSize === 0) {
          const randomSize = Math.floor(Math.random() * 500) + 100; // Random size between 100MB and 600MB
          setFileSize(randomSize * 1024 * 1024);
        }
        
        setDownloadedBytes(Math.floor((fileSize * newProgress) / 100));
        
        if (newProgress >= 100) {
          clearInterval(interval);
          clearInterval(elapsedTimer);
          if (onComplete) {
            setTimeout(() => {
              onComplete();
            }, 500);
          }
          return 100;
        }
        
        return newProgress;
      });
    }, 800); // Slightly longer interval for more realistic updates

    // Cleanup intervals on unmount
    return () => {
      if (interval) clearInterval(interval);
      if (elapsedTimer) clearInterval(elapsedTimer);
    };
  }, [isDownloading, onComplete, fileSize]);

  if (!isDownloading && progress === 0) {
    return null;
  }

  // Format bytes to human-readable size
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KiB', 'MiB', 'GiB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Downloading...</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="h-2 w-full" />
      
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div>Speed: <span className="text-foreground">{downloadSpeed}</span></div>
        <div>ETA: <span className="text-foreground">{eta}</span></div>
        <div>Downloaded: <span className="text-foreground">{formatBytes(downloadedBytes)}</span></div>
        <div>Total: <span className="text-foreground">{formatBytes(fileSize)}</span></div>
        <div>Elapsed time: <span className="text-foreground">{elapsedTime}</span></div>
      </div>
    </div>
  );
}
