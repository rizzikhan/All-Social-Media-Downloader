import { useState, useEffect, useRef } from 'react';
import { api, VideoInfo, VideoFormats, ProgressData, Platform } from '../lib/api';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Progress } from './ui/progress';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Loader2, Download, X, Video, Music, FileVideo, FileAudio, CheckCircle, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { UrlInput } from './UrlInput';
import { VideoInfoDisplay, VideoFormat } from './VideoInfoDisplay';
import { Input } from './ui/input';
import { Label } from './ui/label';

// Define DownloadStatus type with all possible statuses
type DownloadStatus = 'idle' | 'fetching' | 'starting' | 'downloading' | 'ready' | 'error' | 'processing' | 'compressing';

interface DownloadUrlResponse {
  url: string;
}

// Use environment variable for backend base URL, fallback to localhost
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || "http://127.0.0.1:8000";

// Define compression levels available in the frontend UI
const COMPRESSION_LEVELS = ['None', 'Low', 'Medium', 'High'];

function formatSpeed(speed: string): string {
  if (!speed || speed === 'Done') return '0 B/s';
  // Convert MiB/s to B/s for consistent formatting
  if (speed.includes('MiB/s')) {
    const value = parseFloat(speed) * 1024 * 1024;
    return formatSpeed(value.toString());
  }
  if (speed.includes('KiB/s')) {
    const value = parseFloat(speed) * 1024;
    return formatSpeed(value.toString());
  }
  const bytesPerSecond = parseInt(speed);
  if (isNaN(bytesPerSecond)) return '0 B/s';
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
  return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatETA(eta: string): string {
  if (!eta || eta === '0:00') return '--:--';
  return eta;
}

export function VideoDownloader() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [videoFormats, setVideoFormats] = useState<VideoFormat[]>([]);
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>('idle');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<VideoFormat | null>(null);
  const [downloadSpeed, setDownloadSpeed] = useState<string>('0 B/s');
  const [downloadETA, setDownloadETA] = useState<string>('--:--');
  const [downloadSize, setDownloadSize] = useState<string>('0 MB');
  const [supportedPlatforms, setSupportedPlatforms] = useState<Platform[]>([]);
  const [selectedCompressionLevel, setSelectedCompressionLevel] = useState<string>(COMPRESSION_LEVELS[0]);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const downloadStartedRef = useRef(false);

  // Fetch supported platforms on component mount
  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        const data = await api.getPlatforms();
        setSupportedPlatforms(data.platforms);
        console.log('[Platforms] Supported platforms fetched', data.platforms);
      } catch (err) {
        console.error('[Platforms] Failed to fetch supported platforms', err);
        // Optionally set an error state for platforms
      }
    };
    fetchPlatforms();
  }, []); // Empty dependency array means this runs once on mount

  // Handle automatic download when ready
  useEffect(() => {
    if (downloadStatus === 'ready' && downloadUrl && !downloadStartedRef.current) {
      console.log('[AutoDownload] Download ready, triggering auto download');
      downloadStartedRef.current = true;
      handleFileDownload();
    }
    if (downloadStatus === 'idle' || downloadStatus === 'fetching' || downloadStatus === 'starting') {
      downloadStartedRef.current = false;
    }
  }, [downloadStatus, downloadUrl]);

  // Handle URL submission
  const handleSubmit = async (inputUrl: string) => {
    console.log('[Submit] URL submitted:', inputUrl);
    setUrl(inputUrl);
    setError(null);
    setIsLoading(true);
    setDownloadStatus('fetching');
    setVideoInfo(null);
    setVideoFormats([]);
    setSelectedFormat(null);
    setDownloadId(null);
    setDownloadUrl(null);
    setDownloadProgress(0);

    try {
      const data = await api.getVideoInfo(inputUrl);
      setVideoInfo(data.video_info);
      setVideoFormats(data.formats.video);
      setDownloadStatus('idle');
      console.log('[Info] Video info fetched successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch video info');
      setDownloadStatus('error');
      console.log('[Error] Failed to fetch video info');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormatSelect = async (format: VideoFormat, isAudio: boolean) => {
    console.log('[Select] Format selected:', format.format_id);
    try {
      setSelectedFormat(format);
      setDownloadStatus('starting');
      setError(null);
      setDownloadProgress(0);
      setDownloadSpeed('0 B/s');
      setDownloadETA('--:--');
      setDownloadSize(format.filesize ? formatFileSize(format.filesize) : 'Calculating...');
      setDownloadUrl(null);
      downloadStartedRef.current = false;

      // Include compression_level in the API call
      const response = await api.startDownload(url, format.format_id, selectedCompressionLevel);
      setDownloadId(response.download_id);
      // Initial status comes from the backend response now ('processing')
      setDownloadStatus(response.status as DownloadStatus);
      console.log('[Download] Download started, id:', response.download_id, 'status:', response.status);

      let retryCount = 0;
      const maxRetries = 3;
      let downloadUrlFetched = false;

      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = setInterval(async () => {
        try {
          const progress = await api.getProgress(response.download_id);
          setDownloadProgress(progress.progress);
          setDownloadSpeed(formatSpeed(progress.speed));
          setDownloadETA(formatETA(progress.eta));
          if (progress.filesize > 0) setDownloadSize(formatFileSize(progress.filesize));

          // Update status based on progress data
          setDownloadStatus(progress.status as DownloadStatus);

          if (progress.status === 'ready' && !downloadUrlFetched) {
            try {
              const downloadUrlResponse = await api.getDownloadUrl(response.download_id);
              let url = downloadUrlResponse.url;
              if (url.startsWith('/')) {
                url = BACKEND_BASE_URL + url;
              }
              setDownloadUrl(url);
              downloadUrlFetched = true;
              setDownloadStatus('ready');
              setDownloadSpeed('Done');
              setDownloadETA('--:--');
              setDownloadProgress(100);
              if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
              console.log('[Ready] Download URL fetched:', url);
            } catch (urlError) {
              if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
              setError('Failed to get download URL. Please try again.');
              setDownloadStatus('error');
              console.log('[Error] Failed to get download URL');
            }
          } else if (progress.status === 'error') {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            setError(progress.error || 'Download failed');
            setDownloadStatus('error');
            console.log('[Error] Download failed during progress polling');
          }
          retryCount = 0;
        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            setError('Connection lost. Please try again.');
            setDownloadStatus('error');
            console.log('[Error] Progress polling failed, max retries reached');
          }
        }
      }, 1000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to start download');
      setDownloadStatus('error');
      console.log('[Error] Failed to start download');
    }
  };

  // Handle download cancellation
  const handleCancel = async () => {
    if (!downloadId) return;
    try {
      await api.cancelDownload(downloadId);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setDownloadId(null);
      setDownloadUrl(null);
      setDownloadProgress(0);
      setDownloadStatus('idle');
      downloadStartedRef.current = false;
      console.log('[Cancel] Download cancelled');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel download');
      console.log('[Error] Failed to cancel download');
    }
  };

  // Handle file download
  const handleFileDownload = () => {
    if (downloadUrl) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      // Set the filename if available
      if (selectedFormat && videoInfo) {
        const ext = selectedFormat.ext || 'mp4';
        const filename = `${videoInfo.title}.${ext}`;
        link.setAttribute('download', filename);
      }
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('[Download] Download triggered via <a> element:', downloadUrl);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Video Downloader
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Download videos from various platforms
          </p>
        </div>

        <UrlInput 
          onSubmit={handleSubmit} 
          isLoading={isLoading} 
        />

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Compression Level Select */}
        {videoInfo && downloadStatus === 'idle' && ( // Show only after getting video info and before starting download
           <Card>
             <CardHeader>
               <CardTitle>Compression Options</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="flex items-center gap-4">
                 <Label htmlFor="compression">Level:</Label>
                 <Select value={selectedCompressionLevel} onValueChange={setSelectedCompressionLevel}>
                   <SelectTrigger className="w-[180px]" id="compression">
                     <SelectValue placeholder="Select compression level" />
                   </SelectTrigger>
                   <SelectContent>
                     {COMPRESSION_LEVELS.map(level => (
                       <SelectItem key={level} value={level}>{level}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
                 {/* Optional: Add tooltip/info about compression levels here */}
               </div>
             </CardContent>
           </Card>
        )}

        {/* Downloading/Processing/Compressing Progress Card */}
        {(downloadStatus === 'processing' || downloadStatus === 'downloading' || downloadStatus === 'compressing') && ( 
          <Card className="bg-secondary/40 backdrop-blur-sm border-primary/10">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       {/* Show different indicator based on status */}
                      {(downloadStatus === 'processing' || downloadStatus === 'downloading' || downloadStatus === 'compressing') && <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />}
                      {(downloadStatus === 'processing') && <p className="text-sm font-medium">Processing...</p>}
                      {(downloadStatus === 'downloading') && <p className="text-sm font-medium">Downloading...</p>}
                      {(downloadStatus === 'compressing') && <p className="text-sm font-medium">Compressing...</p>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {selectedFormat?.ext.toUpperCase()} - {selectedFormat?.format_note || selectedFormat?.resolution || selectedFormat?.quality}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Cancel</span>
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    {/* Show progress % only when downloading */} 
                    {downloadStatus === 'downloading' ? (<span>{downloadProgress.toFixed(1)}%</span>) : null}
                    {/* For processing/compressing, maybe show elapsed time or just a generic message */} 
                    {(downloadStatus === 'processing' || downloadStatus === 'compressing') ? (<span>Working...</span>) : null}
                    <span>{downloadSize}</span>
                  </div>
                  {/* Use Progress component only when downloading */} 
                  {downloadStatus === 'downloading' ? (<Progress value={downloadProgress} className="h-2" />) : null}
                  {/* For processing/compressing, maybe a different indicator or just text */} 
                   {(downloadStatus === 'processing' || downloadStatus === 'compressing') ? (<div className="h-2 bg-blue-300 rounded-full" />) : null}
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                       {/* Show speed/ETA only when downloading */} 
                      {downloadStatus === 'downloading' ? (
                        <>
                           <span>{downloadSpeed}</span>
                          {downloadSpeed !== 'Done' && downloadSpeed !== '0 B/s' ? (
                            <>
                              <span>•</span>
                              <span>ETA: {downloadETA}</span>
                            </>
                          ) : null}
                        </>
                      ) : null}
                       {/* For processing/compressing, maybe show elapsed time */} 
                      {(downloadStatus === 'processing' || downloadStatus === 'compressing') ? (<span>Elapsed: --:--</span>) : null}
                    </div>
                     {/* Show downloaded bytes only when downloading */} 
                    {downloadStatus === 'downloading' ? (<span>{formatFileSize((selectedFormat?.filesize || 0) * (downloadProgress / 100))}</span>) : null}
                     {/* For processing/compressing, maybe show calculating size */} 
                    {(downloadStatus === 'processing' || downloadStatus === 'compressing') ? (<span>Calculating size...</span>) : null}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {downloadStatus === 'ready' && downloadUrl && (
          <Alert className="bg-green-500/10 border-green-500/20 text-green-500">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Download Ready</AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span>Your download is ready!</span>
              <Button
                size="sm"
                className="bg-green-500 hover:bg-green-600 text-white"
                onClick={handleFileDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Now
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {videoInfo && (
          <VideoInfoDisplay
            videoInfo={videoInfo}
            videoFormats={videoFormats}
            onFormatSelect={handleFormatSelect}
            isLoading={isLoading}
          />
        )}

        {/* Supported Platforms Section */}
        {supportedPlatforms.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Supported Platforms</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside grid grid-cols-2 sm:grid-cols-3 gap-2">
                {supportedPlatforms.map((platform, index) => (
                  <li key={index} className="flex items-center">
                    {/* You can add icons here if you have them */}
                    {platform.name}
                    {/* Optional: Add a tooltip or expandable section for domains/help */}
                    {/* For now, just display domains next to it */}
                    {platform.domains && platform.domains.length > 0 ? (
                        <span className="ml-2 text-gray-500 text-sm">({platform.domains.join(', ')})</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}