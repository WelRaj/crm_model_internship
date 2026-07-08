from rest_framework.response import Response


def success_response(data=None, message="Operation completed", status_code=200, pagination=None):
    payload = {
        "success": True,
        "message": message,
        "data": data if data is not None else {},
    }
    if pagination is not None:
        payload["pagination"] = pagination
    return Response(payload, status=status_code)


def error_response(message="Request failed", errors=None, status_code=400):
    return Response(
        {
            "success": False,
            "message": message,
            "errors": errors if errors is not None else {},
        },
        status=status_code,
    )
