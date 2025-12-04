from django.middleware.csrf import get_token
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import ensure_csrf_cookie


@require_http_methods(["GET"])
@ensure_csrf_cookie
def get_csrf_token(request):
    """
    Эндпоинт для получения CSRF токена
    """
    return JsonResponse({'csrftoken': get_token(request)})

