import React, { useState } from 'react';
import { UrlInput } from '@/components/UrlInput';
import { FormatSelector } from '@/components/FormatSelector';
import { DownloadProgress } from '@/components/DownloadProgress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  YoutubeIcon, 
  InstagramIcon, 
  FacebookIcon, 
  TwitterIcon, 
  TiktokIcon, 
  VimeoIcon, 
  TwitchIcon,
  RedditIcon,
  SoundcloudIcon
} from '@/components/PlatformIcons';
import { useToast } from '@/hooks/use-toast';
import { Download, Play } from 'lucide-react';
import { VideoInfoDisplay, VideoInfo, VideoFormat } from '@/components/VideoInfoDisplay';

const Index = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<VideoFormat | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [videoFormats, setVideoFormats] = useState<{video: VideoFormat[], audio: VideoFormat[]} | null>(null);
  const [isAudioOnly, setIsAudioOnly] = useState(false);

  const handleUrlSubmit = async (url: string) => {
    setVideoUrl(url);
    setIsLoading(true);
    setVideoInfo(null);
    setVideoFormats(null);
    
    try {
      // In a real implementation, this would call your youtube-dl backend API
      // Here we'll simulate the API response based on your shared backend code
      
      // Simulate delay for API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate video info retrieval
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        // Mock data for YouTube video
        setVideoInfo({
          title: "Sample YouTube Video",
          thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
          uploader: "Sample Channel",
          channel_url: "https://youtube.com/channel/sample",
          duration: "3:32",
          duration_seconds: 212,
          description: "This is a sample video description that would be returned by the youtube-dl backend. It contains information about the video content.",
          view_count: 18245631,
          upload_date: "2022-05-15",
          platform: "YouTube"
        });
        
        // Mock video formats
        setVideoFormats({
          video: [
            {
              format_id: "137+140",
              ext: "mp4",
              quality: "1080p",
              resolution: "1920x1080",
              fps: 30,
              filesize: 52428800, // 50MB
              vcodec: "avc1.640028",
              acodec: "mp4a.40.2",
              height: 1080,
              width: 1920
            },
            {
              format_id: "136+140",
              ext: "mp4",
              quality: "720p",
              resolution: "1280x720",
              fps: 30,
              filesize: 31457280, // 30MB
              vcodec: "avc1.4d401f",
              acodec: "mp4a.40.2",
              height: 720,
              width: 1280
            },
            {
              format_id: "135+140",
              ext: "mp4",
              quality: "480p",
              resolution: "854x480",
              fps: 30,
              filesize: 20971520, // 20MB
              vcodec: "avc1.4d401e",
              acodec: "mp4a.40.2",
              height: 480,
              width: 854
            },
            {
              format_id: "244+140",
              ext: "webm",
              quality: "480p",
              resolution: "854x480",
              fps: 30,
              filesize: 15728640, // 15MB
              vcodec: "vp9",
              acodec: "mp4a.40.2",
              height: 480,
              width: 854
            }
          ],
          audio: [
            {
              format_id: "140",
              ext: "m4a",
              quality: "128kbps",
              filesize: 3145728, // 3MB
              acodec: "mp4a.40.2",
              abr: 128
            },
            {
              format_id: "251",
              ext: "webm",
              quality: "160kbps",
              filesize: 3670016, // 3.5MB
              acodec: "opus",
              abr: 160
            },
            {
              format_id: "250",
              ext: "webm",
              quality: "70kbps",
              filesize: 1572864, // 1.5MB
              acodec: "opus",
              abr: 70
            }
          ]
        });
      } else if (url.includes('instagram.com')) {
        // Mock data for Instagram
        setVideoInfo({
          title: "Instagram Video",
          thumbnail: "https://via.placeholder.com/1080x1350/1F262E/FFFFFF?text=Instagram+Post",
          uploader: "instagram_user",
          duration: "0:45",
          duration_seconds: 45,
          upload_date: "2023-12-10",
          platform: "Instagram"
        });
        
        setVideoFormats({
          video: [
            {
              format_id: "302",
              ext: "mp4",
              quality: "720p",
              filesize: 15728640, // 15MB
              vcodec: "avc1.4d401f",
              acodec: "mp4a.40.2",
              height: 720,
              width: 1280
            }
          ],
          audio: []  // Instagram typically doesn't offer separate audio
        });
      } else if (url.includes('facebook.com')) {
        // Mock data for Facebook
        setVideoInfo({
          title: "Facebook Video",
          thumbnail: "https://via.placeholder.com/1280x720/3B5998/FFFFFF?text=Facebook+Video",
          uploader: "Facebook User",
          duration: "2:15",
          duration_seconds: 135,
          platform: "Facebook"
        });
        
        setVideoFormats({
          video: [
            {
              format_id: "sd",
              ext: "mp4",
              quality: "SD",
              filesize: 10485760, // 10MB
              vcodec: "avc1.4d401e",
              acodec: "mp4a.40.2"
            },
            {
              format_id: "hd",
              ext: "mp4",
              quality: "HD",
              filesize: 20971520, // 20MB
              vcodec: "avc1.4d401f",
              acodec: "mp4a.40.2"
            }
          ],
          audio: []  // Facebook typically doesn't offer separate audio
        });
      } else {
        // Generic response for other platforms
        setVideoInfo({
          title: "Video from " + new URL(url).hostname,
          thumbnail: "https://via.placeholder.com/1280x720/222222/FFFFFF?text=Video+Thumbnail",
          platform: getPlatformFromUrl(url)
        });
        
        setVideoFormats({
          video: [
            {
              format_id: "best",
              ext: "mp4",
              quality: "Best quality",
              filesize_approx: 26214400, // 25MB approx
              vcodec: "avc1",
              acodec: "mp4a"
            }
          ],
          audio: [
            {
              format_id: "bestaudio",
              ext: "m4a",
              quality: "Best audio",
              filesize_approx: 2097152, // 2MB approx
              acodec: "mp4a"
            }
          ]
        });
      }
    } catch (error) {
      console.error("Error fetching video info:", error);
      toast({
        title: "Error",
        description: "Failed to fetch video information. Please check the URL and try again.",
        variant: "destructive",
      });
      setVideoInfo(null);
      setVideoFormats(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getPlatformFromUrl = (url: string): string => {
    try {
      const hostname = new URL(url).hostname;
      
      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'YouTube';
      if (hostname.includes('instagram.com')) return 'Instagram';
      if (hostname.includes('facebook.com') || hostname.includes('fb.watch')) return 'Facebook';
      if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'Twitter';
      if (hostname.includes('tiktok.com')) return 'TikTok';
      if (hostname.includes('vimeo.com')) return 'Vimeo';
      if (hostname.includes('twitch.tv')) return 'Twitch';
      if (hostname.includes('reddit.com')) return 'Reddit';
      if (hostname.includes('soundcloud.com')) return 'SoundCloud';
      
      return hostname.split('.')[hostname.split('.').length - 2];
    } catch (e) {
      return 'Unknown Platform';
    }
  };

  const handleFormatSelect = (format: VideoFormat, isAudio: boolean = false) => {
    setSelectedFormat(format);
    setIsAudioOnly(isAudio);
    console.log('Format selected:', format, 'Audio only:', isAudio);
  };

  const handleDownload = () => {
    if (!videoUrl) {
      toast({
        title: "Error",
        description: "Please enter a valid video URL",
        variant: "destructive",
      });
      return;
    }

    if (!selectedFormat) {
      toast({
        title: "Error",
        description: "Please select a download format",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsDownloading(true);
      
      // In a real implementation, we would call an API endpoint to download the video
      console.log(`Downloading ${videoUrl} in format ${selectedFormat.format_id}`);
    }, 1500);
  };

  const handleDownloadComplete = () => {
    setIsDownloading(false);
    toast({
      title: "Download Complete",
      description: `Your ${isAudioOnly ? 'audio' : 'video'} has been downloaded in ${selectedFormat?.ext} format.`,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="container mx-auto py-6 px-4 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Download className="h-6 w-6 text-primary" />
            <h1 className="text-lg md:text-xl font-bold">VideoGrab</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-4">
            <a href="#supported" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Supported Platforms
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-12 md:px-6">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Download Videos from <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-300">Any Platform</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Easily download videos from YouTube, Instagram, TikTok, and 25+ more sites
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <YoutubeIcon />
            <InstagramIcon />
            <FacebookIcon />
            <TwitterIcon />
            <TiktokIcon />
            <VimeoIcon />
            <TwitchIcon />
            <RedditIcon />
            <SoundcloudIcon />
          </div>

          <Card className="bg-secondary/40 backdrop-blur-sm border-primary/10 mb-6">
            <CardContent className="pt-6">
              <UrlInput onSubmit={handleUrlSubmit} isLoading={isLoading} />
              
              <VideoInfoDisplay 
                videoInfo={videoInfo} 
                videoFormats={videoFormats}
                onFormatSelect={handleFormatSelect}
                isLoading={isLoading}
              />
              
              {selectedFormat && (
                <div className="mt-6">
                  <Button 
                    onClick={handleDownload}
                    disabled={isLoading || isDownloading}
                    className="w-full pulse-glow"
                  >
                    {isLoading ? 'Processing...' : `Download ${isAudioOnly ? 'Audio' : 'Video'} Now`}
                  </Button>
                  
                  <DownloadProgress 
                    isDownloading={isDownloading} 
                    onComplete={handleDownloadComplete} 
                  />
                </div>
              )}
            </CardContent>
          </Card>
          
          <p className="text-sm text-muted-foreground">
            By using our service, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>

        <section id="supported" className="mb-20">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">
              Supported Platforms
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[
                'YouTube', 'Instagram', 'Facebook', 'Twitter', 'TikTok', 'Vimeo', 
                'Dailymotion', 'Twitch', 'Reddit', 'Soundcloud', 'Vevo', 
                'Khan Academy', 'Rutube', 'Bilibili', 'Niconico', 'Youku'
              ].map((platform) => (
                <div key={platform} className="bg-secondary/40 p-3 rounded-md text-center">
                  {platform}
                </div>
              ))}
            </div>
          </div>
        </section>
        
        <section id="how-it-works" className="mb-20">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="text-lg font-medium mb-2">Paste URL</h3>
                <p className="text-muted-foreground">Copy the video URL and paste it into the input field</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="text-lg font-medium mb-2">Select Format</h3>
                <p className="text-muted-foreground">Choose your preferred video or audio quality</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="text-lg font-medium mb-2">Download</h3>
                <p className="text-muted-foreground">Click download and save the file to your device</p>
              </div>
            </div>
          </div>
        </section>
        
        <section id="faq" className="mb-12">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              <div className="bg-secondary/40 p-4 rounded-md">
                <h3 className="text-lg font-medium mb-2">Is this service free?</h3>
                <p className="text-muted-foreground">Yes, VideoGrab is completely free to use with no hidden fees or limitations.</p>
              </div>
              <div className="bg-secondary/40 p-4 rounded-md">
                <h3 className="text-lg font-medium mb-2">Is it legal to download videos?</h3>
                <p className="text-muted-foreground">VideoGrab should only be used to download videos that you have permission to download, such as videos under Creative Commons licenses or your own content.</p>
              </div>
              <div className="bg-secondary/40 p-4 rounded-md">
                <h3 className="text-lg font-medium mb-2">What video formats are supported?</h3>
                <p className="text-muted-foreground">We support MP4, WebM for video and MP3, AAC, OGG for audio in various quality levels.</p>
              </div>
              <div className="bg-secondary/40 p-4 rounded-md">
                <h3 className="text-lg font-medium mb-2">Do you store the downloaded videos?</h3>
                <p className="text-muted-foreground">No, we don't store any videos on our servers. Files are directly downloaded to your device.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-secondary/40 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Download className="h-5 w-5 text-primary" />
              <span className="text-lg font-bold">VideoGrab</span>
            </div>
            <div className="flex flex-col items-center md:flex-row md:space-x-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground mb-2 md:mb-0">
                Terms of Service
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground mb-2 md:mb-0">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Contact
              </a>
            </div>
          </div>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} VideoGrab. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
