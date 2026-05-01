import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Video, Music, HardDrive, Clock, Eye, Download, User, Calendar } from 'lucide-react';

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
  audioFormats: VideoFormat[];
  onFormatSelect: (format: VideoFormat, isAudio: boolean) => void;
  isLoading: boolean;
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function VideoInfoDisplay({ videoInfo, videoFormats, audioFormats, onFormatSelect, isLoading }: VideoInfoDisplayProps) {
  const [activeTab, setActiveTab] = useState<'video' | 'audio'>('video');

  if (isLoading) {
    return (
      <div className="w-full space-y-4 mt-6 animate-in fade-in duration-300">
        <Card className="overflow-hidden border-border/50">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row">
              <Skeleton className="w-full md:w-2/5 aspect-video md:aspect-auto md:max-h-56 rounded-none" />
              <div className="p-5 flex-1 space-y-3">
                <Skeleton className="h-6 w-4/5" />
                <Skeleton className="h-4 w-2/5" />
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!videoInfo) return null;

  return (
    <div className="w-full space-y-4 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">

      {/* ── Video Info Card ── */}
      <Card className="overflow-hidden border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            {videoInfo.thumbnail && (
              <div className="w-full md:w-2/5 relative flex-shrink-0">
                <img
                  src={videoInfo.thumbnail}
                  alt={videoInfo.title}
                  className="w-full h-full object-cover aspect-video md:aspect-auto md:max-h-56"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/10" />
              </div>
            )}
            <div className="flex-1 p-4 sm:p-5 flex flex-col justify-center gap-3">
              <h2 className="text-base sm:text-lg font-bold leading-snug line-clamp-2 text-foreground">
                {videoInfo.title}
              </h2>

              <div className="flex flex-wrap gap-1.5">
                {videoInfo.platform && (
                  <Badge className="text-xs font-medium">{videoInfo.platform}</Badge>
                )}
                {videoInfo.duration && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Clock className="h-3 w-3" />{videoInfo.duration}
                  </Badge>
                )}
                {videoInfo.view_count != null && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Eye className="h-3 w-3" />{videoInfo.view_count.toLocaleString()}
                  </Badge>
                )}
              </div>

              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                {videoInfo.uploader && (
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 flex-shrink-0" />
                    {videoInfo.uploader}
                  </span>
                )}
                {videoInfo.upload_date && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                    {videoInfo.upload_date}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Formats Card ── */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
        <CardHeader className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-sm font-semibold text-foreground">Choose Format</CardTitle>

            {/* Tab switcher */}
            <div className="flex rounded-lg overflow-hidden border border-border bg-muted/50 p-0.5 gap-0.5">
              <button
                onClick={() => setActiveTab('video')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
                  activeTab === 'video'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Video className="h-3.5 w-3.5" />
                Video
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'video' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {videoFormats.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('audio')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
                  activeTab === 'audio'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Music className="h-3.5 w-3.5" />
                Audio
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'audio' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' : 'bg-muted text-muted-foreground'}`}>
                  {audioFormats.length}
                </span>
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
          {activeTab === 'video' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-2.5">
              {videoFormats.map((format) => (
                <button
                  key={format.format_id}
                  onClick={() => onFormatSelect(format, false)}
                  className="group relative flex flex-col gap-2 rounded-xl border border-border/60 bg-background/70 p-3 text-left transition-all duration-150 hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-lg sm:text-xl font-bold text-foreground leading-none">
                      {format.quality || format.format_note || format.resolution || 'Auto'}
                    </span>
                    <Download className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs font-semibold uppercase px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      {format.ext}
                    </span>
                    {format.fps && (
                      <span className="text-xs px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground">
                        {format.fps}fps
                      </span>
                    )}
                  </div>
                  {format.filesize ? (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      {formatFileSize(format.filesize)}
                    </span>
                  ) : null}
                </button>
              ))}
              {videoFormats.length === 0 && (
                <p className="col-span-full text-sm text-muted-foreground text-center py-8">
                  No video formats available
                </p>
              )}
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-2.5">
              {audioFormats.map((format) => (
                <button
                  key={format.format_id}
                  onClick={() => onFormatSelect(format, true)}
                  className="group relative flex flex-col gap-2 rounded-xl border border-border/60 bg-background/70 p-3 text-left transition-all duration-150 hover:border-purple-500/50 hover:bg-purple-500/5 hover:shadow-sm active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-lg sm:text-xl font-bold text-foreground leading-none">
                      {format.abr ? `${format.abr}kbps` : format.quality || 'Audio'}
                    </span>
                    <Download className="h-3.5 w-3.5 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs font-semibold uppercase px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      MP3
                    </span>
                    <span className="text-xs uppercase px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground">
                      {format.ext}
                    </span>
                  </div>
                  {format.filesize ? (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      {formatFileSize(format.filesize)}
                    </span>
                  ) : null}
                </button>
              ))}
              {audioFormats.length === 0 && (
                <p className="col-span-full text-sm text-muted-foreground text-center py-8">
                  No audio formats available
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

