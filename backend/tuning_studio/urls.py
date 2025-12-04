"""
URL configuration for tuning_studio project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from .csrf import get_csrf_token

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/csrf-token/', get_csrf_token, name='csrf-token'),
    path('api/auth/', include('accounts.urls')),
    path('api/accounts/', include('accounts.urls')),
    path('api/shop/', include('shop.urls')),
    path('api/events/', include('events.urls')),
    path('api/forum/', include('forum.urls')),
]

if settings.DEBUG:
    from django.contrib.staticfiles.urls import staticfiles_urlpatterns
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += staticfiles_urlpatterns()

