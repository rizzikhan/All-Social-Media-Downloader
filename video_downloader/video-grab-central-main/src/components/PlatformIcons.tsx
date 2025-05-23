
import React from 'react';
import { cn } from '@/lib/utils';

const PlatformIcon = ({ className, children }: { className?: string; children: React.ReactNode }) => {
  return (
    <div className={cn(
      'flex items-center justify-center w-10 h-10 rounded-full text-white hover:scale-110 transition-transform',
      className
    )}>
      {children}
    </div>
  );
};

export const YoutubeIcon = () => (
  <PlatformIcon className="bg-youtube">
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
    </svg>
  </PlatformIcon>
);

export const InstagramIcon = () => (
  <PlatformIcon className="bg-instagram">
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  </PlatformIcon>
);

export const FacebookIcon = () => (
  <PlatformIcon className="bg-facebook">
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
    </svg>
  </PlatformIcon>
);

export const TwitterIcon = () => (
  <PlatformIcon className="bg-twitter">
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
    </svg>
  </PlatformIcon>
);

export const TiktokIcon = () => (
  <PlatformIcon className="bg-tiktok border border-white">
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"></path>
      <path d="M17.7 8A6 6 0 0 0 16 7h-3"></path>
      <path d="M16.8 2H14a2 2 0 0 0-2 2v16"></path>
      <path d="M22 8.4V12a4 4 0 0 1-4 4h-2"></path>
    </svg>
  </PlatformIcon>
);

export const VimeoIcon = () => (
  <PlatformIcon className="bg-vimeo">
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 7.42c-.2 4.4-2.9 10.41-8.13 10.41-5.23 0-7.4-5.03-7.4-5.03L6 17"></path>
      <path d="M2 8.39c0-.61.36-.97.97-.97 1.41 0 2.81 1.97 3.42 6.21 0 0 .5-3.97 1.61-5.95C9.11 6.73 10.66 6 11.46 6c2.01 0 1.91 5.03-1.2 8.4 1-1 2.2-4.02 2.4-4.02.8 0 .6 1.8.2 3.42-.4 1.61-.8 3.01-.4 3.01.8 0 3.21-3.22 3.21-5.33s-2.4-1.61-1.2-4.42"></path>
    </svg>
  </PlatformIcon>
);

export const TwitchIcon = () => (
  <PlatformIcon className="bg-twitch">
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2H3v16h5v4l4-4h5l4-4V2zm-10 9V7m5 4V7"></path>
    </svg>
  </PlatformIcon>
);

export const RedditIcon = () => (
  <PlatformIcon className="bg-reddit">
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7"></circle>
      <path d="M8 14v-1a2 2 0 0 1 4 0v1"></path>
      <path d="M8.5 11.5 L15.5 11.5"></path>
      <path d="M20 4v-1h-2"></path>
    </svg>
  </PlatformIcon>
);

export const SoundcloudIcon = () => (
  <PlatformIcon className="bg-soundcloud">
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 17.5H4a4 4 0 0 1 0-8"></path>
      <path d="M18 16.5a3 3 0 1 0 0-6"></path>
      <path d="M12 12a3 3 0 0 1 0 6h4"></path>
    </svg>
  </PlatformIcon>
);
