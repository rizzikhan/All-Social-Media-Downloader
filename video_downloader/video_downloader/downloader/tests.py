from django.test import TestCase

# Create your tests here.

import json
from unittest import mock
from django.test import TestCase, Client
from django.urls import reverse
import os
import yt_dlp
import subprocess
import time
import threading
from video_downloader.downloader import views # Import views to access internal functions
from video_downloader.downloader.views import DownloadProgressTracker # Import the tracker class
from django.http import FileResponse # Import FileResponse for assertions
import io # Import io for mocking open

# Mock the settings.BASE_DIR for tests
@mock.patch('django.conf.settings.BASE_DIR', '/fake/base/dir')
class DownloaderAPITests(TestCase):
    def setUp(self):
        self.client = Client()
        self.info_url = reverse('download_video') # This view handles both GET info and POST info/formats
        self.start_url = reverse('start_download')
        self.progress_url_template = reverse('get_download_progress', args=['dummy_id']).replace('dummy_id/', '{}') # Make it a template
        self.serve_url_template = reverse('serve_download', args=['dummy_id']).replace('dummy_id/', '{}') # Make it a template
        self.cancel_url_template = reverse('cancel_download', args=['dummy_id']).replace('dummy_id/', '{}') # Make it a template

        # Mock data for yt-dlp
        self.mock_video_info_dict = {
            'title': 'Test Video',
            'uploader': 'Test Uploader',
            'thumbnail': 'http://example.com/thumb.jpg',
            'platform': 'YouTube',
            'duration': 120,
            'view_count': 1000,
            'upload_date': '20231027',
            'description': 'A test video description',
            'formats': [
                {'format_id': '22', 'ext': 'mp4', 'quality': '720p', 'filesize': 1000000, 'vcodec': 'avc1', 'acodec': 'aac'},
                {'format_id': '18', 'ext': 'mp4', 'quality': '360p', 'filesize': 500000, 'vcodec': 'avc1', 'acodec': 'aac'},
                {'format_id': '140', 'ext': 'm4a', 'quality': '128k', 'filesize': 200000, 'vcodec': 'none', 'acodec': 'aac'},
            ],
        }

        # Mock data for a tracker in ready state
        self.ready_tracker_id = 'ready_test_id'
        self.ready_tracker = DownloadProgressTracker(self.ready_tracker_id)
        self.ready_tracker.status = 'ready'
        self.ready_tracker.filename = 'test_ready_video.mp4'
        self.ready_tracker.filesize = 12345 # Dummy file size
        # We need to add it to download_progress for the serve view tests
        views.download_progress[self.ready_tracker_id] = self.ready_tracker

    def tearDown(self):
        # Clean up the download_progress dictionary after each test
        if self.ready_tracker_id in views.download_progress:
            del views.download_progress[self.ready_tracker_id]
        # Clean up any other trackers added during tests if necessary
        # Note: Mocks might interfere with real cleanup, so focus on state cleanup

    def test_get_supported_platforms(self):
        """Test GET /api/video/info/ returns supported platforms."""
        response = self.client.get(self.info_url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('platforms', data)
        self.assertIsInstance(data['platforms'], list)
        self.assertGreater(len(data['platforms']), 0) # Assuming there's at least one platform
        # Check structure of a platform entry
        first_platform = data['platforms'][0]
        self.assertIn('name', first_platform)
        self.assertIn('icon', first_platform)
        self.assertIn('domains', first_platform)
        self.assertIsInstance(first_platform['domains'], list)

    @mock.patch('yt_dlp.YoutubeDL')
    def test_post_video_info_success(self, MockYoutubeDL):
        """Test POST /api/video/info/ returns video info and formats on success."""
        # Configure the mock to return our mock data
        mock_ydl_instance = MockYoutubeDL.return_value
        mock_ydl_instance.extract_info.return_value = self.mock_video_info_dict
        
        test_url = "https://www.youtube.com/watch?v=testvideo"
        response = self.client.post(self.info_url, {'url': test_url})

        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertIn('video_info', data)
        self.assertIn('formats', data)
        self.assertIn('title', data)

        # Check structure and content of video_info
        video_info = data['video_info']
        self.assertEqual(video_info['title'], self.mock_video_info_dict['title'])
        # Add more assertions for other video_info fields as needed

        # Check structure and content of formats
        formats = data['formats']
        self.assertIn('video', formats)
        self.assertIn('audio', formats)
        self.assertIsInstance(formats['video'], list)
        self.assertIsInstance(formats['audio'], list)
        # Add more assertions for format data as needed
        # (e.g., check quality, ext, filesize are present for formats)
        
        # Verify yt-dlp was called correctly
        MockYoutubeDL.assert_called_once_with({'quiet': True, 'no_warnings': True, 'no_color': True})
        mock_ydl_instance.extract_info.assert_called_once_with(test_url, download=False)

    @mock.patch('yt_dlp.YoutubeDL')
    def test_post_video_info_yt_dlp_error(self, MockYoutubeDL):
        """Test POST /api/video/info/ handles yt-dlp errors gracefully."""
        # Configure the mock to raise an error
        mock_ydl_instance = MockYoutubeDL.return_value
        mock_ydl_instance.extract_info.side_effect = yt_dlp.utils.DownloadError('Fake yt-dlp error', None)
        
        test_url = "https://www.youtube.com/watch?v=invalidvideo"
        response = self.client.post(self.info_url, {'url': test_url})

        self.assertEqual(response.status_code, 400)
        data = response.json()

        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Could not retrieve video information' # Or a more specific error if handled in view
                         # You might need to adjust this if your view returns the exact yt-dlp error
                        )
        
        # Verify yt-dlp was called correctly
        MockYoutubeDL.assert_called_once_with({'quiet': True, 'no_warnings': True, 'no_color': True})
        mock_ydl_instance.extract_info.assert_called_once_with(test_url, download=False)

    def test_post_video_info_missing_url(self):
        """Test POST /api/video/info/ with missing URL."""
        response = self.client.post(self.info_url, {}) # Empty POST data
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Please provide a valid URL')

    @mock.patch('video_downloader.downloader.views._download_video')
    @mock.patch('yt_dlp.YoutubeDL')
    @mock.patch('threading.Thread')
    def test_start_download_success(self, MockThread, MockYoutubeDL, mock_download_video):
        """Test POST /api/video/download/ starts download thread on success."""
        mock_ydl_instance = MockYoutubeDL.return_value
        mock_ydl_instance.extract_info.return_value = self.mock_video_info_dict

        test_url = "https://www.youtube.com/watch?v=testvideo"
        test_format_id = "22"
        test_compression_level = "Medium"

        response = self.client.post(self.start_url, {
            'url': test_url,
            'format_id': test_format_id,
            'compression_level': test_compression_level,
        })

        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertIn('download_id', data)
        self.assertIn('video_info', data)
        self.assertIn('status', data)
        self.assertEqual(data['status'], 'processing')
        self.assertEqual(data['video_info']['title'], self.mock_video_info_dict['title'])

        # Verify yt-dlp was called to get video info (before starting thread)
        MockYoutubeDL.assert_called_once_with({'quiet': True})
        mock_ydl_instance.extract_info.assert_called_once_with(test_url, download=False)

        # Verify a new thread was created and started
        MockThread.assert_called_once()
        # Check if the target was _download_video and arguments were passed correctly
        # The exact args passed to Thread might vary slightly depending on how it's called
        # but we can check the target function and potentially inspect the args/kwargs later if needed.
        self.assertEqual(MockThread.call_args[1]['target'], views._download_video)
        # Verify the correct arguments were passed to _download_video via the thread's args
        thread_args = MockThread.call_args[1]['args']
        self.assertEqual(thread_args[0], test_url)
        self.assertEqual(thread_args[1], test_format_id)
        # download_id is generated inside the view, so we check it's a string
        self.assertIsInstance(thread_args[2], str)
        self.assertEqual(thread_args[3], test_compression_level)

        mock_thread_instance = MockThread.return_value
        mock_thread_instance.start.assert_called_once()

    @mock.patch('yt_dlp.YoutubeDL')
    def test_start_download_missing_params(self, MockYoutubeDL):
        """Test POST /api/video/download/ with missing URL or format_id."""
        # Test missing format_id
        response = self.client.post(self.start_url, {'url': 'test_url'})
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Please provide both URL and format')

        # Test missing url
        response = self.client.post(self.start_url, {'format_id': 'test_format'})
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Please provide both URL and format')

        # Test missing both
        response = self.client.post(self.start_url, {})
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Please provide both URL and format')

    @mock.patch('video_downloader.downloader.views.download_progress', new={})
    def test_get_progress_not_found(self):
        """Test GET /api/video/progress/<id>/ returns 404 if download_id not found."""
        response = self.client.get(self.progress_url_template.format('nonexistent_id'))
        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Download not found')

    @mock.patch('video_downloader.downloader.views.download_progress')
    def test_get_progress_downloading(self, mock_download_progress):
        """Test GET /api/video/progress/<id>/ returns correct data for downloading status."""
        test_id = 'test_downloading_id'
        # Create a mock tracker instance
        mock_tracker = DownloadProgressTracker(test_id) # Use the real tracker to test its methods
        mock_tracker.status = 'downloading'
        mock_tracker.progress = 50
        mock_tracker.speed = '1 MiB/s'
        mock_tracker.eta = '0:30'
        mock_tracker.filesize = 10000000
        mock_tracker.downloaded_bytes = 5000000
        mock_tracker.filename = 'test_video.mp4'

        # Add mock tracker to the mocked global dictionary
        mock_download_progress.__setitem__(test_id, mock_tracker)
        # Or, mock the dictionary directly and set it as the new value
        # mock_download_progress.get.return_value = mock_tracker
        # mock_download_progress.__contains__.return_value = True

        response = self.client.get(self.progress_url_template.format(test_id))
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertIn('id', data)
        self.assertEqual(data['id'], test_id)
        self.assertIn('status', data)
        self.assertEqual(data['status'], 'downloading')
        self.assertIn('progress', data)
        self.assertEqual(data['progress'], 50.0)
        self.assertIn('speed', data)
        self.assertEqual(data['speed'], '1.0 MiB/s') # Ensure correct formatting from tracker
        self.assertIn('eta', data)
        self.assertEqual(data['eta'], '0:30')
        self.assertIn('filesize', data)
        self.assertEqual(data['filesize'], 10000000)
        self.assertIn('downloaded_bytes', data)
        self.assertEqual(data['downloaded_bytes'], 5000000)
        self.assertIn('filename', data)
        self.assertEqual(data['filename'], 'test_video.mp4')
        self.assertIn('elapsed', data)
        # Check elapsed time format (e.g., '0:00' or '0:01')
        self.assertRegex(data['elapsed'], r'\d{1,2}:\d{2}')

    @mock.patch('video_downloader.downloader.views.download_progress')
    def test_get_progress_ready(self, mock_download_progress):
        """Test GET /api/video/progress/<id>/ returns correct data for ready status."""
        test_id = 'test_ready_id'
        mock_tracker = DownloadProgressTracker(test_id)
        mock_tracker.status = 'ready'
        mock_tracker.progress = 100
        mock_tracker.speed = 'Done'
        mock_tracker.eta = '0:00'
        mock_tracker.filesize = 20000000
        mock_tracker.downloaded_bytes = 20000000
        mock_tracker.filename = 'test_video_ready.mp4'

        mock_download_progress.__setitem__(test_id, mock_tracker)

        response = self.client.get(self.progress_url_template.format(test_id))
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(data['status'], 'ready')
        self.assertEqual(data['progress'], 100.0)
        self.assertEqual(data['speed'], 'Done')
        self.assertEqual(data['eta'], '0:00')
        self.assertEqual(data['filesize'], 20000000)
        self.assertEqual(data['downloaded_bytes'], 20000000)
        self.assertEqual(data['filename'], 'test_video_ready.mp4')
        
    @mock.patch('video_downloader.downloader.views.download_progress')
    def test_get_progress_error(self, mock_download_progress):
        """Test GET /api/video/progress/<id>/ returns correct data for error status."""
        test_id = 'test_error_id'
        mock_tracker = DownloadProgressTracker(test_id)
        mock_tracker.status = 'error'
        mock_tracker.progress = 0
        mock_tracker.speed = 'Error'
        mock_tracker.eta = '0:00'
        mock_tracker.error = 'Simulated download error'

        mock_download_progress.__setitem__(test_id, mock_tracker)

        response = self.client.get(self.progress_url_template.format(test_id))
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(data['status'], 'error')
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Simulated download error')
        self.assertEqual(data['progress'], 0.0)
        self.assertEqual(data['speed'], 'Error')
        self.assertEqual(data['eta'], '0:00')
        # Other fields should be default or previous values, not critical to assert here unless specific behavior is expected

    @mock.patch('video_downloader.downloader.views.download_progress')
    def test_get_progress_compressing(self, mock_download_progress):
        """Test GET /api/video/progress/<id>/ returns correct data for compressing status."""
        test_id = 'test_compressing_id'
        mock_tracker = DownloadProgressTracker(test_id)
        mock_tracker.status = 'compressing'
        mock_tracker.progress = 0 # Progress might reset or be based on compression stage
        mock_tracker.speed = 'Calculating...'
        mock_tracker.eta = '--:--'
        mock_tracker.filesize = 50000000 # Size of the original file during compression
        mock_tracker.filename = 'test_video_original.mp4'

        mock_download_progress.__setitem__(test_id, mock_tracker)

        response = self.client.get(self.progress_url_template.format(test_id))
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(data['status'], 'compressing')
        self.assertEqual(data['progress'], 0.0)
        self.assertEqual(data['speed'], 'Calculating...')
        self.assertEqual(data['eta'], '--:--')
        self.assertEqual(data['filesize'], 50000000)
        self.assertEqual(data['filename'], 'test_video_original.mp4')

    @mock.patch('video_downloader.downloader.views.download_progress')
    def test_serve_downloaded_file_not_found(self, mock_download_progress):
        """Test GET /api/video/download/file/<id>/ returns 404 if download_id not found."""
        # Ensure the download_progress is empty for this test
        mock_download_progress.__contains__.return_value = False

        response = self.client.get(self.serve_url_template.format('nonexistent_id'))
        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Download not found')

    @mock.patch('video_downloader.downloader.views.download_progress')
    def test_serve_downloaded_file_not_ready(self, mock_download_progress):
        """Test GET /api/video/download/file/<id>/ returns 400 if download is not ready."""
        test_id = 'not_ready_id'
        mock_tracker = DownloadProgressTracker(test_id)
        mock_tracker.status = 'downloading' # Or any status other than 'ready'
        mock_download_progress.__setitem__(test_id, mock_tracker)

        response = self.client.get(self.serve_url_template.format(test_id))
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Download not ready')

    @mock.patch('video_downloader.downloader.views.download_progress')
    @mock.patch('os.path.exists', return_value=False) # Mock file not found
    def test_serve_downloaded_file_not_on_disk(self, mock_exists, mock_download_progress):
        """Test GET /api/video/download/file/<id>/ returns 404 if file not found on disk."""
        # Use the pre-configured ready_tracker from setUp
        mock_download_progress.__setitem__(self.ready_tracker_id, self.ready_tracker)
        mock_download_progress.__contains__.return_value = True # Ensure contains works
        mock_download_progress.get.return_value = self.ready_tracker # Ensure get works

        response = self.client.get(self.serve_url_template.format(self.ready_tracker_id))
        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'File not found')

        # Verify os.path.exists was called with the expected path
        expected_path = os.path.join('/fake/base/dir', 'downloads', self.ready_tracker.filename)
        mock_exists.assert_called_once_with(expected_path)

    @mock.patch('video_downloader.downloader.views.download_progress')
    @mock.patch('os.path.exists', return_value=True)
    @mock.patch('os.path.getsize', return_value=1000)
    @mock.patch('builtins.open', new_callable=mock.mock_open) # Mock the file open
    def test_serve_downloaded_file_success(self, mock_open, mock_getsize, mock_exists, mock_download_progress):
        """Test GET /api/video/download/file/<id>/ serves the file on success."""
        # Use the pre-configured ready_tracker from setUp
        mock_download_progress.__setitem__(self.ready_tracker_id, self.ready_tracker)
        mock_download_progress.__contains__.return_value = True
        mock_download_progress.get.return_value = self.ready_tracker

        response = self.client.get(self.serve_url_template.format(self.ready_tracker_id))

        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response, FileResponse)

        # Check Content-Disposition header for filename and attachment
        self.assertIn('Content-Disposition', response)
        self.assertRegex(response['Content-Disposition'], f'attachment;.*filename=\"{self.ready_tracker.filename}\"')

        # Check Content-Type header (assuming .mp4 extension)
        self.assertIn('Content-Type', response)
        self.assertEqual(response['Content-Type'], 'video/mp4') # Based on your views logic

        # Check other headers
        self.assertIn('Cache-Control', response)
        self.assertEqual(response['Cache-Control'], 'no-cache, no-store, must-revalidate')
        self.assertIn('Pragma', response)
        self.assertEqual(response['Pragma'], 'no-cache')
        self.assertIn('Expires', response)
        self.assertEqual(response['Expires'], '0')
        self.assertIn('Content-Length', response)
        self.assertEqual(response['Content-Length'], str(mock_getsize.return_value))

        # Verify file operations were called
        expected_path = os.path.join('/fake/base/dir', 'downloads', self.ready_tracker.filename)
        mock_exists.assert_called_once_with(expected_path)
        mock_getsize.assert_called_once_with(expected_path)
        mock_open.assert_called_once_with(expected_path, 'rb')

        # Verify cleanup is scheduled (check if response.closed is set to a callable)
        self.assertTrue(callable(response.closed))
        # Note: Testing if the cleanup *actually* runs after serving is more complex

    # TODO: Add tests for cancel_download, and more detailed compression scenarios
