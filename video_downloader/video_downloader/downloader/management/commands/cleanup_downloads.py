# downloader/management/commands/cleanup_downloads.py

import os
import time
from django.core.management.base import BaseCommand
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Cleans up old download files from the downloads directory.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=1,
            help='Number of days old a file must be to be deleted (default: 1).',
        )

    def handle(self, *args, **options):
        days_threshold = options['days']
        cleanup_threshold_seconds = days_threshold * 24 * 60 * 60
        current_time = time.time()
        
        download_dir = os.path.join(settings.BASE_DIR, 'downloads')
        
        if not os.path.exists(download_dir):
            self.stdout.write(self.style.WARNING(f'Download directory not found: {download_dir}'))
            return
            
        self.stdout.write(f'Scanning directory: {download_dir}')
        deleted_count = 0
        
        for filename in os.listdir(download_dir):
            file_path = os.path.join(download_dir, filename)
            
            # Skip if it's not a file (e.g., a subdirectory)
            if not os.path.isfile(file_path):
                continue
                
            try:
                # Get file modification time
                mod_time = os.path.getmtime(file_path)
                
                # Check if the file is older than the threshold
                if current_time - mod_time > cleanup_threshold_seconds:
                    os.remove(file_path)
                    deleted_count += 1
                    logger.info(f'Deleted old download file: {file_path}')
                    self.stdout.write(f'Deleted: {filename}')
                
            except Exception as e:
                logger.error(f'Error cleaning up file {file_path}: {e}')
                self.stdout.write(self.style.ERROR(f'Error deleting {filename}: {e}'))

        self.stdout.write(self.style.SUCCESS(f'Cleanup finished. Deleted {deleted_count} files older than {days_threshold} day(s).')) 