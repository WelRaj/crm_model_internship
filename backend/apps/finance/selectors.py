from django.db.models import Q

from apps.finance import models


def apply_search(queryset, search, fields):
    if not search:
        return queryset
    query = Q()
    for field in fields:
        query |= Q(**{f"{field}__icontains": search})
    return queryset.filter(query)


def finance_clients_queryset():
    return models.FinanceClient.objects.filter(is_deleted=False).select_related("project_client").order_by("-created_at")


def vendors_queryset():
    return models.Vendor.objects.filter(is_deleted=False).order_by("-created_at")


def bank_accounts_queryset():
    return models.BankAccount.objects.filter(is_deleted=False).select_related("client", "vendor").order_by("-is_primary", "-created_at")


def quotations_queryset():
    return models.Quotation.objects.filter(is_deleted=False).select_related("client", "project", "agreement").prefetch_related("items").order_by("-created_at")


def invoices_queryset():
    return models.Invoice.objects.filter(is_deleted=False).select_related("client", "project", "milestone", "agreement", "quotation").prefetch_related("items").order_by("-created_at")


def payments_queryset():
    return models.Payment.objects.filter(is_deleted=False).select_related("client", "bank_account").prefetch_related("allocations").order_by("-payment_date", "-created_at")


def reminders_queryset():
    return models.Reminder.objects.filter(is_deleted=False).select_related("invoice", "invoice__client").order_by("due_at")


def credit_notes_queryset():
    return models.CreditNote.objects.filter(is_deleted=False).select_related("invoice", "invoice__client").order_by("-created_at")


def ledger_entries_queryset():
    return models.LedgerEntry.objects.filter(is_deleted=False).select_related("client", "vendor", "invoice").order_by("-entry_date", "-created_at")


def expense_entries_queryset():
    return models.ExpenseEntry.objects.filter(is_deleted=False).select_related("vendor", "project", "ledger_entry").order_by("-expense_date", "-created_at")


def budgets_queryset():
    return models.Budget.objects.filter(is_deleted=False).select_related("project").prefetch_related("revisions").order_by("-created_at")


def budget_revisions_queryset():
    return models.BudgetRevision.objects.filter(is_deleted=False).select_related("budget").order_by("-created_at")


def payroll_register_queryset():
    return models.FinancePayrollRecord.objects.filter(is_deleted=False).select_related("hrms_payroll", "hrms_payroll__employee", "hrms_payroll__employee__user").order_by("-month", "-created_at")


def gst_returns_queryset():
    return models.GSTReturn.objects.filter(is_deleted=False).order_by("-period")


def tds_records_queryset():
    return models.TDSRecord.objects.filter(is_deleted=False).select_related("client", "payment").order_by("-period", "-created_at")


def approval_policies_queryset():
    return models.ApprovalPolicy.objects.filter(is_deleted=False).order_by("module", "min_amount")


def approval_requests_queryset():
    return models.ApprovalRequest.objects.filter(is_deleted=False).select_related("requested_by", "decided_by").order_by("-created_at")


def finance_access_policies_queryset():
    return models.FinanceAccessPolicy.objects.filter(is_deleted=False).order_by("role_name", "module")
