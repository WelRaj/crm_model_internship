from django.db import connection
from django.http import JsonResponse


def health_check(request):
    return JsonResponse({"success": True, "message": "API is healthy", "data": {"service": "backend"}})


def database_health_check(request):
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
        cursor.fetchone()
    return JsonResponse({"success": True, "message": "Database is reachable", "data": {}})
