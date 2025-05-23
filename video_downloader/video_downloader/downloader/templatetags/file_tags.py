from django import template
from django.template.defaultfilters import filesizeformat

register = template.Library()

@register.filter
def filesizeformat_custom(bytes):
    """
    Format the file size in a human-readable format
    """
    if bytes is None:
        return 'Unknown'
    return filesizeformat(bytes)

@register.filter
def platform_icon(platform_name):
    """
    Get the appropriate icon class for a platform
    """
    platform_name = platform_name.lower()
    
    # Map platform names to Font Awesome icons
    platform_icons = {
        'youtube': 'youtube',
        'instagram': 'instagram',
        'facebook': 'facebook',
        'twitter': 'twitter',
        'x': 'twitter',
        'tiktok': 'tiktok',
        'vimeo': 'vimeo',
        'dailymotion': 'play',
        'twitch': 'twitch',
        'reddit': 'reddit',
        'soundcloud': 'soundcloud',
        'linkedin': 'linkedin',
        'pinterest': 'pinterest',
        'snapchat': 'snapchat',
        'flickr': 'images',
        'vk': 'vk',
    }
    
    return platform_icons.get(platform_name, 'video')