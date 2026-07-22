from django.contrib import admin

from apps.finance import models


for model in [
    models.FinanceClient,
    models.Vendor,
    models.BankAccount,
    models.Quotation,
    models.QuotationItem,
    models.Invoice,
    models.InvoiceItem,
    models.Payment,
    models.PaymentAllocation,
    models.Reminder,
    models.CreditNote,
    models.LedgerEntry,
    models.ExpenseEntry,
    models.Budget,
    models.BudgetRevision,
    models.FinancePayrollRecord,
    models.GSTReturn,
    models.TDSRecord,
    models.ApprovalPolicy,
    models.ApprovalRequest,
    models.FinanceAccessPolicy,
]:
    admin.site.register(model)
