from rest_framework.pagination import PageNumberPagination

from apps.core.responses import success_response


class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "limit"
    max_page_size = 100

    def get_paginated_response(self, data):
        return success_response(
            data=data,
            pagination={
                "page": self.page.number,
                "limit": self.get_page_size(self.request),
                "total": self.page.paginator.count,
                "total_pages": self.page.paginator.num_pages,
            },
        )
