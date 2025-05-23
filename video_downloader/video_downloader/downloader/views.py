import os
import re
import yt_dlp
import threading
import json
import time
import uuid
import logging
from django.http import HttpResponse, FileResponse, JsonResponse
from django.shortcuts import render
from django.conf import settings
from django.template.defaultfilters import filesizeformat

from django.http import JsonResponse
from django.views.decorators.http import require_POST
import os
import threading
import signal


import multiprocessing
import signal
import os
import sys
import time
import yt_dlp
from functools import partial
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from datetime import datetime
import shutil
import subprocess

# List of supported platforms for display
SUPPORTED_PLATFORMS = [
    {"name": "YouTube", "icon": "youtube", "domains": ["youtube.com", "youtu.be"]},
    {"name": "Instagram", "icon": "instagram", "domains": ["instagram.com"]},
    {"name": "Facebook", "icon": "facebook", "domains": ["facebook.com", "fb.watch"]},
    {"name": "Twitter/X", "icon": "twitter", "domains": ["twitter.com", "x.com"]},
    {"name": "TikTok", "icon": "tiktok", "domains": ["tiktok.com"]},
    {"name": "Vimeo", "icon": "vimeo", "domains": ["vimeo.com"]},
    {"name": "Dailymotion", "icon": "dailymotion", "domains": ["dailymotion.com"]},
    {"name": "Twitch", "icon": "twitch", "domains": ["twitch.tv"]},
    {"name": "Reddit", "icon": "reddit", "domains": ["reddit.com"]},
    {"name": "Soundcloud", "icon": "soundcloud", "domains": ["soundcloud.com"]}
    # Add more platforms as needed
]

# Global dictionary to store download progress
download_progress = {}

# Set up logging
logger = logging.getLogger(__name__)

# Mapping compression levels to bitrates (example)
COMPRESSION_BITRATES = {
    "Low": "800k",
    "Medium": "1500k",
    "High": "2500k",
}

class DownloadProgressTracker:
    """Track download progress for yt-dlp."""
    
    def __init__(self, download_id):
        self.download_id = download_id
        self.progress = 0
        self.speed = "0 KiB/s"
        self.eta = "00:00"
        self.filename = ""
        self.status = "starting"
        self.filesize = 0
        self.downloaded_bytes = 0
        self.start_time = time.time()
        self.temp_file = None
        self.process = None  # Store the actual process object

        # Register this tracker globally
        download_progress[download_id] = self
    
    def progress_hook(self, d):
        """Progress hook for yt-dlp to call."""
        try:
            if d['status'] == 'downloading':
                self.status = 'downloading'
                
                # Get downloaded bytes
                if 'downloaded_bytes' in d:
                    self.downloaded_bytes = d['downloaded_bytes']
                
                # Calculate progress percentage
                try:
                    if 'total_bytes' in d and d['total_bytes'] > 0:
                        self.filesize = d['total_bytes']
                        self.progress = float((d['downloaded_bytes'] / d['total_bytes']) * 100)
                    elif 'total_bytes_estimate' in d and d['total_bytes_estimate'] > 0:
                        self.filesize = d['total_bytes_estimate']
                        self.progress = float((d['downloaded_bytes'] / d['total_bytes_estimate']) * 100)
                    else:
                        # If we can't determine total size, estimate progress based on downloaded bytes
                        self.progress = min(99.9, float(d['downloaded_bytes']) / (1024 * 1024))  # Rough estimate
                except (TypeError, ZeroDivisionError) as e:
                    logger.warning(f"Error calculating progress: {str(e)}")
                    # Keep previous progress value
                
                # Get download speed
                try:
                    if 'speed' in d and d['speed'] is not None:
                        speed = float(d['speed'])
                        if speed < 1024:
                            self.speed = f"{speed:.1f} B/s"
                        elif speed < 1024 * 1024:
                            self.speed = f"{speed/1024:.1f} KiB/s"
                        else:
                            self.speed = f"{speed/(1024*1024):.1f} MiB/s"
                    else:
                        self.speed = "Calculating..."
                except (TypeError, ValueError) as e:
                    logger.warning(f"Error calculating speed: {str(e)}")
                    self.speed = "Calculating..."
                
                # Get ETA
                try:
                    if 'eta' in d and d['eta'] is not None:
                        eta_seconds = int(d['eta'])
                        minutes, seconds = divmod(eta_seconds, 60)
                        hours, minutes = divmod(minutes, 60)
                        if hours > 0:
                            self.eta = f"{hours}:{minutes:02d}:{seconds:02d}"
                        else:
                            self.eta = f"{minutes}:{seconds:02d}"
                    else:
                        self.eta = "Calculating..."
                except (TypeError, ValueError) as e:
                    logger.warning(f"Error calculating ETA: {str(e)}")
                    self.eta = "Calculating..."
                
                # Get filename
                if 'filename' in d:
                    self.filename = os.path.basename(d['filename'])
                    self.temp_file = d['filename']
                
            elif d['status'] == 'finished':
                self.progress = 100.0
                self.speed = "Done"
                self.eta = "0:00"
                self.status = 'ready'
                logger.info(f"Download marked as ready: {self.filename}")
            
            elif d['status'] == 'error':
                error_msg = d.get('error', 'Unknown error')
                self.status = 'error'
                self.progress = 0.0
                self.speed = "Error"
                self.eta = "0:00"
                self.error = str(error_msg)
                logger.error(f"Download error: {error_msg}")
            
            # Check if we should stop
            if self.status == 'cancelled':
                raise Exception("Download cancelled by user")
            
        except Exception as e:
            logger.error(f"Error in progress_hook: {str(e)}")
            if self.status != 'cancelled':
                self.status = 'error'
                self.error = str(e)
    
    def get_progress_data(self):
        """Get progress data as dictionary."""
        try:
            elapsed = time.time() - self.start_time
            minutes, seconds = divmod(int(elapsed), 60)
            hours, minutes = divmod(minutes, 60)
            
            if hours > 0:
                elapsed_str = f"{hours}:{minutes:02d}:{seconds:02d}"
            else:
                elapsed_str = f"{minutes}:{seconds:02d}"
                
            return {
                'id': self.download_id,
                'progress': round(float(self.progress), 1),
                'speed': self.speed,
                'eta': self.eta,
                'filename': self.filename,
                'status': self.status,
                'filesize': self.filesize,
                'downloaded_bytes': self.downloaded_bytes,
                'elapsed': elapsed_str
            }
        except Exception as e:
            # Provide a fallback if something goes wrong
            print(f"Error in get_progress_data: {str(e)}")
            return {
                'id': self.download_id,
                'progress': 0.0,
                'speed': 'Calculating...',
                'eta': 'Calculating...',
                'filename': self.filename or 'Unknown',
                'status': self.status or 'downloading',
                'filesize': 0,
                'downloaded_bytes': 0,
                'elapsed': '0:00'
            } 

def get_unique_filename(title, ext):
    """Generate a unique filename for the download."""
    safe_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).strip()
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    unique_id = str(uuid.uuid4())[:8]
    return f"{safe_title}_{timestamp}_{unique_id}.{ext}"

def _download_video(url, format_id, download_id, compression_level="None"):
    """Internal function to download and optionally compress video."""
    logger.info(f"Starting download for ID {download_id} with format {format_id}, compression: {compression_level}")
    original_full_path = None # Keep track of the original file path
    compressed_full_path = None # Keep track of the compressed file path
    
    try:
        download_dir = os.path.join(settings.BASE_DIR, 'downloads')
        os.makedirs(download_dir, exist_ok=True)
        logger.info(f"Download directory: {download_dir}")

        # Create a progress tracker instance
        tracker = DownloadProgressTracker(download_id)
        # Set initial status to indicate processing might include download and compression
        tracker.status = 'processing' # Or a specific status like 'downloading'
        logger.info(f"Created progress tracker for download {download_id}")

        # First get video info to generate unique filename
        with yt_dlp.YoutubeDL({'quiet': True}) as ydl:
            logger.info(f"Extracting info for URL: {url}")
            info = ydl.extract_info(url, download=False)
            video_title = info.get('title', 'video')
            video_ext = 'mp4'  # We'll always use MP4
            logger.info(f"Got video info - Title: {video_title}")
            
            # Generate unique filename for the original download
            original_filename = get_unique_filename(video_title, video_ext)
            original_full_path = os.path.join(download_dir, original_filename)
            logger.info(f"Generated unique filename for original: {original_filename}")

        # Configure yt-dlp options with simpler format selection
        ydl_opts = {
            'format': format_id,  # Use the format ID directly
            'outtmpl': original_full_path,
            'progress_hooks': [tracker.progress_hook],
            'quiet': True,
            'no_warnings': True,
            'merge_output_format': 'mp4',  # Force MP4 output
            'postprocessors': [{
                'key': 'FFmpegVideoConvertor',
                'preferedformat': 'mp4',
            }],
            'format_sort': ['res', 'ext:mp4:m4a'],  # Prefer MP4/M4A formats
            'prefer_ffmpeg': True,  # Use ffmpeg for post-processing
        }
        logger.info(f"Configured yt-dlp options for format {format_id}")
        
        # Start the actual download
        logger.info(f"Starting download to {original_full_path}")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        logger.info("Download completed successfully by yt-dlp")
        
        # --- Compression Step ---
        final_filename = original_filename # Assume original is final initially
        final_full_path = original_full_path
        
        if compression_level != "None" and compression_level in COMPRESSION_BITRATES:
            logger.info(f"Compression level selected: {compression_level}")
            tracker.status = 'compressing' # Update status
            tracker.progress = 0 # Reset progress for compression
            tracker.speed = "Calculating..."
            tracker.eta = "--:--"
            tracker.downloaded_bytes = 0 # Reset downloaded bytes for compression
            tracker.filesize = os.path.getsize(original_full_path) if os.path.exists(original_full_path) else 0 # Show original size during compression
            logger.info("Download status updated to compressing")

            # Define output path for compressed file
            base, ext = os.path.splitext(original_full_path)
            compressed_full_path = f"{base}_compressed{ext}"
            compressed_filename = os.path.basename(compressed_full_path)
            logger.info(f"Compressed output path: {compressed_full_path}")

            bitrate = COMPRESSION_BITRATES[compression_level]
            logger.info(f"Using bitrate for compression: {bitrate}")

            # Perform compression
            compression_success = _compress_video(original_full_path, compressed_full_path, bitrate=bitrate)

            if compression_success and os.path.exists(compressed_full_path):
                logger.info("Compression completed successfully.")
                # Update tracker with compressed file info
                final_filename = compressed_filename
                final_full_path = compressed_full_path
                tracker.filesize = os.path.getsize(final_full_path)
                logger.info(f"Tracker updated with compressed file info: {final_filename}, size: {tracker.filesize}")

                # Clean up the original uncompressed file
                try:
                    os.remove(original_full_path)
                    logger.info(f"Cleaned up original uncompressed file: {original_full_path}")
                except Exception as cleanup_error:
                    logger.error(f"Failed to clean up original file {original_full_path}: {str(cleanup_error)}")
                    # Don't fail the whole process if cleanup fails
            else:
                logger.error("Compression failed. Keeping original file if it exists.")
                # If compression failed, keep the original file and mark as ready (or error)
                # We could set status to error here, but let's keep original if compression fails
                # tracker.status = 'error'
                # tracker.error = 'Video compression failed'
                final_filename = original_filename
                final_full_path = original_full_path # Ensure we point to the original
                tracker.filesize = os.path.getsize(final_full_path) if os.path.exists(final_full_path) else 0
                logger.warning("Compression failed, serving original file if available.")
        else:
            logger.info("No compression requested or invalid level. Serving original file.")

        # Update progress with the final filename and status
        if download_id in download_progress:
            tracker = download_progress[download_id]
            tracker.filename = final_filename
            # Set status to ready only after compression (if any)
            if tracker.status != 'error': # Don't override error status from compression
                 tracker.status = 'ready'
            tracker.progress = 100 # Ensure progress is 100 at the end
            tracker.speed = 'Done'
            tracker.eta = '0:00'
            # filesize already updated if compression successful
            logger.info(f"Download/Compression process completed for {download_id}. Final file: {tracker.filename}")

    except Exception as e:
        logger.error(f"Download/Compression process failed for {download_id}: {str(e)}")
        if download_id in download_progress:
            tracker = download_progress[download_id]
            tracker.status = 'error'
            tracker.error = str(e)
        # Clean up both original and compressed files if they exist on failure
        if original_full_path and os.path.exists(original_full_path):
            try:
                os.remove(original_full_path)
                logger.info(f"Cleaned up original file after failure: {download_id}")
            except Exception as cleanup_error:
                logger.error(f"Cleanup failed for original file {download_id}: {str(cleanup_error)}")
        if compressed_full_path and os.path.exists(compressed_full_path):
             try:
                 os.remove(compressed_full_path)
                 logger.info(f"Cleaned up compressed file after failure: {download_id}")
             except Exception as cleanup_error:
                 logger.error(f"Cleanup failed for compressed file {download_id}: {str(cleanup_error)}")

def get_platform_from_url(url):
    """Get the platform name from a URL"""
    for platform in SUPPORTED_PLATFORMS:
        for domain in platform["domains"]:
            if domain in url:
                return platform["name"]
    return "Other"

def get_video_info(url):
    """Get detailed video information"""
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'no_color': True,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            # Extract thumbnail URL
            thumbnail = info.get('thumbnail')
            
            # Format duration
            duration_seconds = info.get('duration')
            duration = ""
            if duration_seconds:
                minutes, seconds = divmod(duration_seconds, 60)
                hours, minutes = divmod(minutes, 60)
                if hours > 0:
                    duration = f"{hours}:{minutes:02d}:{seconds:02d}"
                else:
                    duration = f"{minutes}:{seconds:02d}"
            
            # Format upload date
            upload_date = info.get('upload_date', '')
            if upload_date and len(upload_date) == 8:
                upload_date = f"{upload_date[0:4]}-{upload_date[4:6]}-{upload_date[6:8]}"
            
            return {
                'title': info.get('title'),
                'uploader': info.get('uploader'),
                'channel_url': info.get('channel_url'),
                'duration': duration,
                'duration_seconds': duration_seconds,
                'thumbnail': thumbnail,
                'description': info.get('description', '')[:300] + '...' if info.get('description') and len(info.get('description')) > 300 else info.get('description'),
                'view_count': info.get('view_count'),
                'upload_date': upload_date,
                'platform': get_platform_from_url(url),
            }
    except Exception as e:
        return None

def get_video_formats(url):
    """Extract video formats using yt-dlp."""
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'no_color': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info_dict = ydl.extract_info(url, download=False)
            
            # Filter video formats
            video_formats = []
            for f in info_dict.get('formats', []):
                if f.get('vcodec') != 'none':  # Ensure it has video
                    if f.get('height'):
                        f['quality'] = f"{f.get('height')}p"
                    video_formats.append(f)
            
            # Filter audio-only formats
            audio_formats = []
            for f in info_dict.get('formats', []):
                if f.get('vcodec') == 'none' and f.get('acodec') != 'none':
                    # Safely handle None values for abr
                    abr = f.get('abr')
                    if abr is not None:
                        try:
                            abr_value = int(abr)
                        except (ValueError, TypeError):
                            abr_value = 0
                    else:
                        abr_value = 0
                    
                    f['quality'] = f"{abr_value}kbps audio"
                    audio_formats.append(f)
            
            # Sort formats by quality
            video_formats.sort(key=lambda x: (x.get('height', 0) or 0), reverse=True)
            audio_formats.sort(key=lambda x: (x.get('abr', 0) or 0), reverse=True)
            
            # Take top qualities to avoid overwhelming the user
            video_formats = video_formats[:8]
            audio_formats = audio_formats[:5]
            
            return {
                'video': video_formats,
                'audio': audio_formats
            }, info_dict.get('title', 'video')
    except yt_dlp.utils.DownloadError as e:
        return None, str(e)

def sanitize_filename(filename):
    """Sanitize the filename by replacing unsafe characters."""
    return re.sub(r'[<>:"/\\|?*]', '_', filename)

@csrf_exempt
@require_http_methods(["GET", "POST"])
def download_video(request):
    """API endpoint to get video information and formats."""
    if request.method == 'POST':
        try:
            # Get URL from POST data
            url = request.POST.get('url')
            if not url:
                # Try to get from JSON body
                try:
                    data = json.loads(request.body)
                    url = data.get('url')
                except (json.JSONDecodeError, AttributeError):
                    pass

            if not url:
                return JsonResponse({
                    'error': 'Please provide a valid URL'
                }, status=400)
            
            # Get video info for display
            video_info = get_video_info(url)
            if not video_info:
                return JsonResponse({
                    'error': 'Could not retrieve video information'
                }, status=400)
            
            # Get available formats
            formats_dict, video_title = get_video_formats(url)
            if not formats_dict:
                return JsonResponse({
                    'error': f"Could not retrieve video formats: {video_title}"
                }, status=400)
            
            return JsonResponse({
                'video_info': video_info,
                'formats': {
                    'video': formats_dict.get('video', []),
                    'audio': formats_dict.get('audio', [])
                },
                'title': video_title
            })
        except Exception as e:
            return JsonResponse({
                'error': f'Server error: {str(e)}'
            }, status=500)
    
    # For GET requests, return supported platforms
    return JsonResponse({
        'platforms': SUPPORTED_PLATFORMS
    })

@csrf_exempt
@require_http_methods(["POST"])
def start_download(request):
    """API endpoint to start a video download."""
    logger.info("Received download request")
    try:
        # Get URL, format_id, and compression_level from POST data or JSON body
        url = request.POST.get('url')
        format_id = request.POST.get('format_id')
        compression_level = request.POST.get('compression_level', 'None') # Default to None
        
        if not url or not format_id:
            # Try to get from JSON body
            try:
                data = json.loads(request.body)
                url = url or data.get('url')
                format_id = format_id or data.get('format_id')
                compression_level = compression_level or data.get('compression_level', 'None')
                logger.info(f"Got URL, format, compression from JSON body: {url}, {format_id}, {compression_level}")
            except (json.JSONDecodeError, AttributeError) as e:
                logger.error(f"Error parsing JSON body: {str(e)}")

        if not url or not format_id:
            logger.error("Missing URL or format_id in request")
            return JsonResponse({
                'error': 'Please provide both URL and format'
            }, status=400)

        # Generate a unique download ID
        download_id = str(uuid.uuid4())
        logger.info(f"Generated download ID: {download_id}")
        
        # Get video info to get the title before downloading (needed for tracker)
        try:
            with yt_dlp.YoutubeDL({'quiet': True}) as ydl:
                info_dict = ydl.extract_info(url, download=False)
                video_info = {
                    'title': info_dict.get('title'),
                    'uploader': info_dict.get('uploader'),
                    'thumbnail': info_dict.get('thumbnail'),
                    'platform': get_platform_from_url(url),
                }
            logger.info(f"Got video info for {download_id}: {video_info['title']}")
        except Exception as e:
            logger.error(f"Error getting video info before download: {str(e)}")
            return JsonResponse({
                'error': f"Error getting video info: {str(e)}"
            }, status=500)
        
        # Start the download (and optional compression) in a background thread
        logger.info(f"Starting download/compression thread for {download_id}")
        download_thread = threading.Thread(
            target=_download_video,  # Use the internal function without decorators
            args=(url, format_id, download_id, compression_level) # Pass compression_level
        )
        download_thread.daemon = True
        download_thread.start()
        logger.info(f"Download/compression thread started for {download_id}")
        
        # Return initial status indicating processing has begun
        return JsonResponse({
            'download_id': download_id,
            'video_info': video_info, # Include video info in initial response
            'status': 'processing' # Indicate that processing (download + optional compression) is starting
        })
            
    except Exception as e:
        logger.error(f"Error in start_download: {str(e)}", exc_info=True)
        return JsonResponse({
            'error': f"Error starting download: {str(e)}"
        }, status=500)

@require_http_methods(['GET'])
def get_download_progress(request, download_id):
    """Get download progress."""
    try:
        if download_id not in download_progress:
            logger.warning(f"Download {download_id} not found")
            return JsonResponse({
                'error': 'Download not found',
                'status': 'error'
            }, status=404)
        
        tracker = download_progress[download_id]
        progress_data = tracker.get_progress_data()
        
        # Add error message if status is error
        if tracker.status == 'error':
            progress_data['error'] = getattr(tracker, 'error', 'Download failed')
        
        # Only log status changes or significant progress updates
        if tracker.status == 'ready':
            logger.info(f"Download {download_id} ready")
        elif tracker.status == 'error':
            logger.error(f"Download {download_id} failed: {progress_data.get('error', 'Unknown error')}")
        elif tracker.status == 'downloading' and progress_data['progress'] % 25 == 0:
            logger.info(f"Download {download_id}: {progress_data['progress']}%")
        
        return JsonResponse(progress_data)
    except Exception as e:
        logger.error(f"Error getting progress for {download_id}: {str(e)}")
        return JsonResponse({
            'error': 'Failed to get download progress',
            'status': 'error'
        }, status=500)

@require_http_methods(['GET'])
def serve_downloaded_file(request, download_id):
    """Serve the downloaded file."""
    if download_id not in download_progress:
        return JsonResponse({'error': 'Download not found'}, status=404)

    tracker = download_progress[download_id]
    if tracker.status != 'ready':
        return JsonResponse({'error': 'Download not ready'}, status=400)

    filename = tracker.filename
    if not filename:
        return JsonResponse({'error': 'File not found'}, status=404)

    file_path = os.path.join(settings.BASE_DIR, 'downloads', filename)
    if not os.path.exists(file_path):
        return JsonResponse({'error': 'File not found'}, status=404)

    # Get the file extension and determine content type
    _, ext = os.path.splitext(filename)
    content_type = {
        '.mp4': 'video/mp4',
        '.mkv': 'video/x-matroska',
        '.webm': 'video/webm',
        '.mp3': 'audio/mpeg',
        '.m4a': 'audio/mp4',
        '.ogg': 'audio/ogg',
        '.wav': 'audio/wav'
    }.get(ext.lower(), 'application/octet-stream')

    # Create the response with proper headers
    response = FileResponse(
        open(file_path, 'rb'),
        content_type=content_type,
        as_attachment=True,
        filename=filename
    )
    
    # Add additional headers to prevent caching and ensure proper download
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response['Pragma'] = 'no-cache'
    response['Expires'] = '0'
    response['Content-Length'] = str(os.path.getsize(file_path))
    
    # Clean up the file after sending
    def cleanup():
        try:
            os.remove(file_path)
        except:
            pass
        if download_id in download_progress:
            del download_progress[download_id]

    response.closed = cleanup
    return response

@require_http_methods(['POST'])
def cancel_download(request, download_id):
    """Cancel a download."""
    if download_id not in download_progress:
        return JsonResponse({'error': 'Download not found'}, status=404)

    tracker = download_progress[download_id]
    if tracker.status in ['ready', 'error']:
        return JsonResponse({'error': 'Download already completed or failed'}, status=400)

    # Update status to cancelled
    tracker.status = 'cancelled'
    
    # Clean up the file if it exists
    if tracker.filename:
        file_path = os.path.join(settings.BASE_DIR, 'downloads', tracker.filename)
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except:
            pass

    # Remove from progress tracking
    del download_progress[download_id]
    
    return JsonResponse({'status': 'cancelled'})

@require_http_methods(['GET'])
def get_download_url(request, download_id):
    """Get the download URL for a completed download."""
    try:
        if download_id not in download_progress:
            logger.warning(f"Download {download_id} not found")
            return JsonResponse({
                'error': 'Download not found',
                'status': 'error'
            }, status=404)
        
        tracker = download_progress[download_id]
        if tracker.status != 'ready':
            return JsonResponse({
                'error': 'Download not ready',
                'status': 'error'
            }, status=400)
        
        if not tracker.filename:
            return JsonResponse({
                'error': 'File not found',
                'status': 'error'
            }, status=404)
        
        # Generate the download URL
        download_url = f'/api/video/download/file/{download_id}/'
        logger.info(f"Generated download URL for {download_id}: {download_url}")
        
        return JsonResponse({
            'url': download_url,
            'status': 'ready'
        })
    except Exception as e:
        logger.error(f"Error getting download URL for {download_id}: {str(e)}")
        return JsonResponse({
            'error': 'Failed to get download URL',
            'status': 'error'
        }, status=500)

# Add a simple compression function using subprocess and FFmpeg
def _compress_video(input_path, output_path, bitrate='1000k'):
    """Compresses a video file using FFmpeg to a target bitrate."""
    logger.info(f"Starting compression for {input_path} to {output_path} with bitrate {bitrate}")
    
    # Ensure the output directory exists
    output_dir = os.path.dirname(output_path)
    os.makedirs(output_dir, exist_ok=True)

    # FFmpeg command to re-encode with a target video bitrate
    # -y: overwrite output file without asking
    # -i: input file
    # -b:v: video bitrate
    # -c:a copy: copy audio stream without re-encoding
    # -c:v libx264: use h264 encoder (widely compatible)
    # -preset medium: balance speed and compression
    command = [
        'ffmpeg',
        '-y',
        '-i', input_path,
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-b:v', bitrate,
        '-c:a', 'copy',
        output_path
    ]

    try:
        # Run the command
        process = subprocess.run(command, capture_output=True, text=True, check=True)
        logger.info(f"FFmpeg stdout: {process.stdout}")
        logger.info(f"FFmpeg stderr: {process.stderr}") # FFmpeg often outputs progress/info to stderr
        logger.info(f"Compression finished: {output_path}")
        return True # Success
    except FileNotFoundError:
        logger.error("FFmpeg not found. Please install FFmpeg on the server.")
        return False # FFmpeg not installed
    except subprocess.CalledProcessError as e:
        logger.error(f"FFmpeg compression failed: {e}")
        logger.error(f"FFmpeg stdout: {e.stdout}")
        logger.error(f"FFmpeg stderr: {e.stderr}")
        return False # FFmpeg command failed
    except Exception as e:
        logger.error(f"An unexpected error occurred during compression: {e}")
        return False # Other errors