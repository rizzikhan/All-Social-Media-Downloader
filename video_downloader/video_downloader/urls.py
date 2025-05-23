from django.urls import path
from . import views

urlpatterns = [
    # ... existing patterns ...
    path('api/video/download/url/<str:download_id>/', views.get_download_url, name='get_download_url'),
    # ... existing patterns ...
] 