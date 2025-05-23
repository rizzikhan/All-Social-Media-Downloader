import os
import datetime
from django.core.management.base import BaseCommand
from django.conf import settings

class Command(BaseCommand):
    help = 'Cleans up old downloaded files'

    def add_arguments(self, parser):
        parser.add_argument(
            '--hours',
            type=int,
            default=24,
            help='Delete files older than specified hours (default: 24)'
        )

    def handle(self, *args, **options):
        hours = options['hours']
        download_dir = os.path.join(settings.BASE_DIR, 'downloads')
        now = datetime.datetime.now()
        deleted_count = 0
        kept_count = 0
        total_size_deleted = 0

        self.stdout.write(self.style.SUCCESS(f"Scanning '{download_dir}' for files older than {hours} hours..."))

        # Ensure directory exists
        if not os.path.exists(download_dir):
            self.stdout.write(self.style.WARNING(f"Download directory '{download_dir}' doesn't exist. Creating it..."))
            os.makedirs(download_dir)
            return

        for filename in os.listdir(download_dir):
            file_path = os.path.join(download_dir, filename)
            # Skip if not a file
            if not os.path.isfile(file_path):
                continue

            # Get file modification time
            file_mod_time = datetime.datetime.fromtimestamp(os.path.getmtime(file_path))
            age = now - file_mod_time

            # Convert age to hours
            age_hours = age.total_seconds() / 3600

            # Delete files older than specified hours
            if age_hours > hours:
                file_size = os.path.getsize(file_path)
                try:
                    os.remove(file_path)
                    deleted_count += 1
                    total_size_deleted += file_size
                    self.stdout.write(f"Deleted: {filename} (Age: {age_hours:.1f} hours)")
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Error deleting {filename}: {str(e)}"))
            else:
                kept_count += 1

        # Convert bytes to MB for readability
        total_size_deleted_mb = total_size_deleted / (1024 * 1024)

        self.stdout.write(
            self.style.SUCCESS(
                f'Cleanup complete: Deleted {deleted_count} files ({total_size_deleted_mb:.2f} MB), '
                f'Kept {kept_count} files'
            )
        )