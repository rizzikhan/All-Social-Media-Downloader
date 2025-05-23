import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Info, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Video, Music, HardDrive, Clock } from 'lucide-react';

export interface VideoFormat {
  format_id: string;
  ext: string;
  format_note?: string;
  resolution?: string;
  quality?: string;
  filesize?: number;
  fps?: number;
  vcodec?: string;
  acodec?: string;
  width?: number;
  height?: number;
  abr?: number;
}

export interface VideoInfo {
  title: string;
  thumbnail?: string;
  uploader?: string;
  platform?: string;
  duration?: string;
  view_count?: number;
  upload_date?: string;
  description?: string;
}

export interface VideoInfoDisplayProps {
  videoInfo: VideoInfo | null;
  videoFormats: VideoFormat[];
  onFormatSelect: (format: VideoFormat, isAudio: boolean) => void;
  isLoading: boolean;
}

export function VideoInfoDisplay({ videoInfo, videoFormats, onFormatSelect, isLoading }: VideoInfoDisplayProps) {
  if (isLoading) {
    return (
      <div className="w-full space-y-6 mt-6">
        <Card className="bg-secondary/40 backdrop-blur-sm border-primary/10">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
              <div className="w-full md:w-1/3">
                <Skeleton className="w-full aspect-video rounded-lg" />
              </div>
              <div className="w-full md:w-2/3 space-y-3">
                <Skeleton className="h-8 w-3/4" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                  <div className="flex flex-wrap gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-secondary/40 backdrop-blur-sm border-primary/10">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!videoInfo || !videoFormats) {
    return null;
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6 mt-4 sm:mt-6">
      <Card className="bg-secondary/40 backdrop-blur-sm border-primary/10">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            {videoInfo.thumbnail && (
              <div className="w-full md:w-1/3">
                <img 
                  src={videoInfo.thumbnail} 
                  alt={videoInfo.title} 
                  className="w-full rounded-lg object-cover aspect-video shadow-lg"
                />
              </div>
            )}
            <div className="w-full md:w-2/3 space-y-3">
              <h2 className="text-lg sm:text-xl font-bold line-clamp-2">{videoInfo.title}</h2>
              
              <div className="space-y-2 text-sm sm:text-base">
                {videoInfo.uploader && (
                  <p className="flex flex-wrap items-center gap-1">
                    <span className="text-muted-foreground">Uploader:</span>
                    <span className="font-medium">{videoInfo.uploader}</span>
                  </p>
                )}
                
                {videoInfo.platform && (
                  <p className="flex flex-wrap items-center gap-1">
                    <span className="text-muted-foreground">Platform:</span>
                    <span className="font-medium">{videoInfo.platform}</span>
                  </p>
                )}
                
                <div className="flex flex-wrap gap-4">
                  {videoInfo.duration && (
                    <p className="flex items-center gap-1">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">{videoInfo.duration}</span>
                    </p>
                  )}
                  
                  {videoInfo.view_count && (
                    <p className="flex items-center gap-1">
                      <span className="text-muted-foreground">Views:</span>
                      <span className="font-medium">{videoInfo.view_count.toLocaleString()}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-secondary/40 backdrop-blur-sm border-primary/10">
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">Available Formats</CardTitle>
          <CardDescription className="text-sm">
            Select a format to download
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {videoFormats.map((format) => (
              <button
                key={format.format_id}
                onClick={() => onFormatSelect(format, format.ext === 'mp4')}
                className="group relative flex flex-col items-start gap-2 rounded-lg border bg-card p-3 text-left text-sm transition-all hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 active:scale-[0.98]"
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-2">
                    {format.ext === 'mp4' ? (
                      <Video className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Music className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-medium capitalize">{format.ext}</span>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    {format.format_note || format.resolution || format.quality}
                  </Badge>
                </div>
                <div className="flex w-full flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {format.filesize && (
                    <span className="inline-flex items-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      {(format.filesize / (1024 * 1024)).toFixed(1)}MB
                    </span>
                  )}
                  {format.fps && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format.fps}fps
                    </span>
                  )}
                  {format.vcodec !== 'none' && format.acodec !== 'none' && (
                    <span className="inline-flex items-center gap-1">
                      <Video className="h-3 w-3" />
                      {format.vcodec}
                    </span>
                  )}
                  {format.acodec !== 'none' && (
                    <span className="inline-flex items-center gap-1">
                      <Music className="h-3 w-3" />
                      {format.acodec}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
