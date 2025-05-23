from django.urls import path
from . import views

urlpatterns = [
    # API endpoints
    path('info/', views.download_video, name='video_info'),  # GET for platforms, POST for video info
    path('download/', views.start_download, name='start_download'),  # POST to start download
    path('progress/<str:download_id>/', views.get_download_progress, name='download_progress'),
    path('download/file/<str:download_id>/', views.serve_downloaded_file, name='serve_download'),
    path('download/url/<str:download_id>/', views.get_download_url, name='get_download_url'),  # GET download URL
    path('cancel/<str:download_id>/', views.cancel_download, name='cancel_download'),
]