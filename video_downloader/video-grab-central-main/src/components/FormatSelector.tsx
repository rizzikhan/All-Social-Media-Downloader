
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

type Format = {
  id: string;
  label: string;
  quality?: string;
  extension: string;
};

const videoFormats: Format[] = [
  { id: 'mp4-1080', label: 'MP4 1080p', quality: '1080p', extension: 'mp4' },
  { id: 'mp4-720', label: 'MP4 720p', quality: '720p', extension: 'mp4' },
  { id: 'mp4-480', label: 'MP4 480p', quality: '480p', extension: 'mp4' },
  { id: 'webm-1080', label: 'WebM 1080p', quality: '1080p', extension: 'webm' },
  { id: 'webm-720', label: 'WebM 720p', quality: '720p', extension: 'webm' },
];

const audioFormats: Format[] = [
  { id: 'mp3-320', label: 'MP3 320kbps', extension: 'mp3' },
  { id: 'mp3-192', label: 'MP3 192kbps', extension: 'mp3' },
  { id: 'aac', label: 'AAC', extension: 'aac' },
  { id: 'ogg', label: 'OGG', extension: 'ogg' },
];

type FormatSelectorProps = {
  onFormatSelect: (format: Format) => void;
};

export function FormatSelector({ onFormatSelect }: FormatSelectorProps) {
  const [activeTab, setActiveTab] = useState<'video' | 'audio'>('video');
  const [selectedFormat, setSelectedFormat] = useState<Format | null>(null);
  
  const handleFormatChange = (formatId: string) => {
    const format = [...videoFormats, ...audioFormats].find(f => f.id === formatId) || null;
    setSelectedFormat(format);
    if (format) {
      onFormatSelect(format);
    }
  };
  
  return (
    <div className="w-full">
      <div className="flex mb-4 border-b border-gray-800">
        <Button 
          variant="ghost" 
          className={cn(
            "rounded-none border-b-2 border-transparent", 
            activeTab === 'video' && "border-primary text-primary"
          )}
          onClick={() => setActiveTab('video')}
        >
          Video
        </Button>
        <Button 
          variant="ghost" 
          className={cn(
            "rounded-none border-b-2 border-transparent", 
            activeTab === 'audio' && "border-primary text-primary"
          )}
          onClick={() => setActiveTab('audio')}
        >
          Audio
        </Button>
      </div>
      
      <Select onValueChange={handleFormatChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select format" />
        </SelectTrigger>
        <SelectContent>
          {activeTab === 'video' ? (
            <SelectGroup>
              <SelectLabel>Video Formats</SelectLabel>
              {videoFormats.map((format) => (
                <SelectItem key={format.id} value={format.id}>
                  {format.label}
                </SelectItem>
              ))}
            </SelectGroup>
          ) : (
            <SelectGroup>
              <SelectLabel>Audio Formats</SelectLabel>
              {audioFormats.map((format) => (
                <SelectItem key={format.id} value={format.id}>
                  {format.label}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
