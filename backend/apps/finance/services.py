from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.audit.services import record_audit_log
from apps.core.models import Sequence
from apps.crm.models import ProjectAgreement, ProjectClient
from apps.finance.models import (
    ApprovalRequest,
    BankAccount,
    Budget,
    CreditNote,
    ExpenseEntry,
    FinanceClient,
    FinancePayrollRecord,
    Invoice,
    InvoiceItem,
    LedgerEntry,
    Payment,
    PaymentAllocation,
    Quotation,
    QuotationItem,
    TDSRecord,
    Vendor,
)
from apps.notifications.services import NotificationService
from apps.projects.models import DeliveryProject, ProjectMilestone


def _next_number(code, prefix, padding=5, current_value=0):
    sequence, _ = Sequence.objects.select_for_update().get_or_create(
        code=code,
        defaults={"prefix": prefix, "current_value": current_value, "padding": padding},
    )
    sequence.current_value += 1
    sequence.save(update_fields=["current_value", "updated_at"])
    return f"{sequence.prefix}-{sequence.current_value:0{sequence.padding}d}"


def _item_amount(item):
    quantity = Decimal(str(item.get("quantity", "1") or "1"))
    unit_price = Decimal(str(item.get("unit_price", item.get("unitPrice", "0")) or "0"))
    if quantity <= 0 or unit_price < 0:
        raise ValidationError({"items": "Item quantity must be positive and unit price cannot be negative."})
    return quantity, unit_price, quantity * unit_price


def _totals(items, discount, gst_rate):
    subtotal = sum((_item_amount(item)[2] for item in items), Decimal("0"))
    discount = discount or Decimal("0")
    gst_rate = gst_rate or Decimal("0")
    if discount < 0 or discount > subtotal:
        raise ValidationError({"discount": "Discount cannot be negative or greater than subtotal."})
    taxable = subtotal - discount
    gst = (taxable * gst_rate / Decimal("100")).quantize(Decimal("0.01"))
    total = taxable + gst
    return subtotal, taxable, gst, total


def _refresh_invoice_payment_status(invoice):
    applied = PaymentAllocation.objects.filter(payment__status__in=[Payment.Status.RECEIVED, Payment.Status.VERIFIED, Payment.Status.RECONCILED], invoice=invoice, is_deleted=False)
    cash = sum((row.amount for row in applied), Decimal("0"))
    tds = sum((row.tds_amount for row in applied), Decimal("0"))
    settled = cash + tds
    invoice.paid_amount = cash
    invoice.tds_amount = tds
    if settled >= invoice.total_amount:
        invoice.payment_status = Invoice.PaymentStatus.PAID
    elif settled > 0:
        invoice.payment_status = Invoice.PaymentStatus.PARTIALLY_PAID
    elif invoice.due_date < timezone.localdate():
        invoice.payment_status = Invoice.PaymentStatus.OVERDUE
    else:
        invoice.payment_status = Invoice.PaymentStatus.UNPAID
    invoice.save(update_fields=["paid_amount", "tds_amount", "payment_status", "updated_at"])


class FinanceService:
    @staticmethod
    @transaction.atomic
    def sync_client_from_project_client(*, project_client, actor, request=None):
        contact = project_client.contacts.filter(role="finance", is_deleted=False).first() or project_client.contacts.filter(is_deleted=False).first()
        client, created = FinanceClient.objects.update_or_create(
            project_client=project_client,
            defaults={
                "company_name": project_client.company_name,
                "contact_person": contact.name if contact else project_client.company_name,
                "email": contact.email if contact else "",
                "mobile": contact.phone if contact else "",
                "payment_terms": project_client.project_handoffs.filter(is_deleted=False).order_by("-created_at").first().billing_model if project_client.project_handoffs.filter(is_deleted=False).exists() else "Milestone",
                "credit_limit": project_client.value,
                "status": FinanceClient.Status.ACTIVE,
                "updated_by": actor,
            },
        )
        if created:
            client.client_code = _next_number("finance_client_number", "FCL", 5)
            client.created_by = actor
            client.save(update_fields=["client_code", "created_by", "updated_at"])
        record_audit_log(actor=actor, module="finance", action="sync_client", entity_type="FinanceClient", entity_id=client.id, request=request)
        if created:
            NotificationService.create_event(
                actor=actor,
                title=f"Finance client synced from {project_client.client_number}",
                message=f"{client.company_name} is now available in Finance Control.",
                notification_type="Finance",
                priority="Medium",
                target_module="Finance Control",
                entity_type="FinanceClient",
                entity_id=client.id,
                is_broadcast=True,
                request=request,
            )
        return client

    @staticmethod
    @transaction.atomic
    def create_client(*, data, actor, request=None):
        project_client = data.get("project_client")
        if project_client and FinanceClient.objects.filter(project_client=project_client, is_deleted=False).exists():
            raise ValidationError({"project_client_id": "Finance client already exists for this project client."})
        client = FinanceClient.objects.create(client_code=_next_number("finance_client_number", "FCL", 5), created_by=actor, updated_by=actor, **data)
        record_audit_log(actor=actor, module="finance", action="create", entity_type="FinanceClient", entity_id=client.id, new_values={"client_code": client.client_code}, request=request)
        NotificationService.create_event(
            actor=actor,
            title=f"Finance client created: {client.company_name}",
            message="A new finance client record is ready for billing and collections.",
            notification_type="Finance",
            priority="Medium",
            target_module="Finance Control",
            entity_type="FinanceClient",
            entity_id=client.id,
            is_broadcast=True,
            request=request,
        )
        return client

    @staticmethod
    @transaction.atomic
    def update_client(*, client, data, actor, request=None):
        old_values = {"status": client.status, "company_name": client.company_name}
        for field, value in data.items():
            setattr(client, field, value)
        client.updated_by = actor
        client.save()
        record_audit_log(actor=actor, module="finance", action="update", entity_type="FinanceClient", entity_id=client.id, old_values=old_values, new_values={"status": client.status, "company_name": client.company_name}, request=request)
        return client

    @staticmethod
    @transaction.atomic
    def soft_archive(*, obj, actor, request=None):
        old_status = getattr(obj, "status", None)
        if hasattr(obj, "status") and old_status != "archived":
            obj.status = "archived"
        obj.is_deleted = True
        obj.deleted_at = timezone.now()
        obj.deleted_by = actor
        obj.updated_by = actor
        obj.save()
        record_audit_log(actor=actor, module="finance", action="delete", entity_type=obj.__class__.__name__, entity_id=obj.id, old_values={"status": old_status}, new_values={"is_deleted": True}, request=request)
        return obj

    @staticmethod
    @transaction.atomic
    def create_vendor(*, data, actor, request=None):
        vendor = Vendor.objects.create(vendor_code=_next_number("vendor_number", "VEN", 5), created_by=actor, updated_by=actor, **data)
        record_audit_log(actor=actor, module="finance", action="create", entity_type="Vendor", entity_id=vendor.id, request=request)
        NotificationService.create_event(
            actor=actor,
            title=f"Vendor created: {vendor.company_name}",
            message="Vendor master is ready for purchase and payment workflows.",
            notification_type="Finance",
            priority="Low",
            target_module="Finance Control",
            entity_type="Vendor",
            entity_id=vendor.id,
            is_broadcast=True,
            request=request,
        )
        return vendor

    @staticmethod
    @transaction.atomic
    def save_simple(*, instance=None, model=None, data, actor, request=None):
        if instance:
            for field, value in data.items():
                setattr(instance, field, value)
            if isinstance(instance, ApprovalRequest) and data.get("status") in {
                ApprovalRequest.Status.APPROVED,
                ApprovalRequest.Status.REJECTED,
                ApprovalRequest.Status.CLARIFICATION_REQUIRED,
                ApprovalRequest.Status.HOLD,
            }:
                instance.decided_by = actor
            instance.updated_by = actor
            instance.save()
            obj = instance
            action = "update"
        else:
            obj = model.objects.create(created_by=actor, updated_by=actor, **data)
            action = "create"
        if isinstance(obj, BankAccount) and obj.is_primary:
            siblings = BankAccount.objects.filter(is_deleted=False, owner_type=obj.owner_type)
            if obj.owner_reference:
                siblings = siblings.filter(owner_reference=obj.owner_reference)
            elif obj.client_id:
                siblings = siblings.filter(client=obj.client)
            elif obj.vendor_id:
                siblings = siblings.filter(vendor=obj.vendor)
            siblings.exclude(id=obj.id).update(is_primary=False, updated_by=actor)
        record_audit_log(actor=actor, module="finance", action=action, entity_type=obj.__class__.__name__, entity_id=obj.id, request=request)
        return obj

    @staticmethod
    @transaction.atomic
    def create_quotation(*, data, actor, request=None):
        client = FinanceClient.objects.get(id=data.pop("client_id"), is_deleted=False)
        project_id = data.pop("project_id", None)
        agreement_id = data.pop("agreement_id", None)
        project = DeliveryProject.objects.get(id=project_id, is_deleted=False) if project_id else None
        agreement = ProjectAgreement.objects.get(id=agreement_id, is_deleted=False) if agreement_id else None
        items = data.pop("items")
        discount = data.get("discount") or Decimal("0")
        gst_rate = data.get("gst_rate") or Decimal("0")
        subtotal, taxable, gst, total = _totals(items, discount, gst_rate)
        quotation = Quotation.objects.create(
            quotation_number=_next_number("quotation_number", "QT", 5),
            client=client,
            project=project,
            agreement=agreement,
            subtotal=subtotal,
            taxable_amount=taxable,
            gst_amount=gst,
            total_amount=total,
            created_by=actor,
            updated_by=actor,
            **data,
        )
        for item in items:
            quantity, unit_price, amount = _item_amount(item)
            QuotationItem.objects.create(quotation=quotation, description=item["description"], quantity=quantity, unit_price=unit_price, amount=amount, created_by=actor, updated_by=actor)
        record_audit_log(actor=actor, module="finance", action="create", entity_type="Quotation", entity_id=quotation.id, new_values={"quotation_number": quotation.quotation_number, "total_amount": str(total)}, request=request)
        return quotation

    @staticmethod
    @transaction.atomic
    def update_quotation(*, quotation, data, actor, request=None):
        old_values = {
            "status": quotation.status,
            "total_amount": str(quotation.total_amount),
        }
        if quotation.status not in {Quotation.Status.DRAFT, Quotation.Status.PENDING_APPROVAL}:
            raise ValidationError({"status": "Only draft or pending approval quotations can be edited."})

        if "client_id" in data:
            quotation.client = FinanceClient.objects.get(id=data.pop("client_id"), is_deleted=False)
        if "project_id" in data:
            project_id = data.pop("project_id")
            quotation.project = DeliveryProject.objects.get(id=project_id, is_deleted=False) if project_id else None
        if "agreement_id" in data:
            agreement_id = data.pop("agreement_id")
            quotation.agreement = ProjectAgreement.objects.get(id=agreement_id, is_deleted=False) if agreement_id else None

        items = data.pop("items", None)
        for field, value in data.items():
            setattr(quotation, field, value)

        if items is not None:
            quotation.items.filter(is_deleted=False).update(is_deleted=True, deleted_at=timezone.now(), deleted_by=actor)
            subtotal, taxable, gst, total = _totals(items, quotation.discount or Decimal("0"), quotation.gst_rate or Decimal("0"))
            quotation.subtotal = subtotal
            quotation.taxable_amount = taxable
            quotation.gst_amount = gst
            quotation.total_amount = total
            for item in items:
                quantity, unit_price, amount = _item_amount(item)
                QuotationItem.objects.create(quotation=quotation, description=item["description"], quantity=quantity, unit_price=unit_price, amount=amount, created_by=actor, updated_by=actor)
        quotation.updated_by = actor
        quotation.save()
        record_audit_log(actor=actor, module="finance", action="update", entity_type="Quotation", entity_id=quotation.id, old_values=old_values, new_values={"status": quotation.status, "total_amount": str(quotation.total_amount)}, request=request)
        return quotation

    @staticmethod
    @transaction.atomic
    def update_quotation_status(*, quotation, status, actor, request=None):
        old_status = quotation.status
        quotation.status = status
        quotation.updated_by = actor
        quotation.save(update_fields=["status", "updated_by", "updated_at"])
        record_audit_log(actor=actor, module="finance", action="status", entity_type="Quotation", entity_id=quotation.id, old_values={"status": old_status}, new_values={"status": status}, request=request)
        NotificationService.create_event(
            actor=actor,
            title=f"Quotation {quotation.quotation_number} {quotation.get_status_display()}",
            message=f"{quotation.client.company_name} quotation moved to {quotation.get_status_display().lower()}.",
            notification_type="Finance",
            priority="Medium",
            target_module="Finance Control",
            entity_type="Quotation",
            entity_id=quotation.id,
            is_broadcast=True,
            request=request,
        )
        return quotation

    @staticmethod
    @transaction.atomic
    def create_invoice(*, data, actor, request=None):
        quotation = None
        if data.get("quotation_id"):
            quotation = Quotation.objects.get(id=data.pop("quotation_id"), is_deleted=False)
            if Invoice.objects.filter(quotation=quotation, is_deleted=False).exclude(status__in=[Invoice.Status.CANCELLED, Invoice.Status.ARCHIVED]).exists():
                raise ValidationError({"quotation_id": "Active invoice already exists for this quotation."})
        client = FinanceClient.objects.get(id=data.pop("client_id"), is_deleted=False)
        project_id = data.pop("project_id", None)
        milestone_id = data.pop("milestone_id", None)
        agreement_id = data.pop("agreement_id", None)
        project = DeliveryProject.objects.get(id=project_id, is_deleted=False) if project_id else quotation.project if quotation else None
        milestone = ProjectMilestone.objects.get(id=milestone_id, is_deleted=False) if milestone_id else None
        agreement = ProjectAgreement.objects.get(id=agreement_id, is_deleted=False) if agreement_id else quotation.agreement if quotation else None
        items = data.pop("items")
        discount = data.get("discount") or Decimal("0")
        gst_rate = data.get("gst_rate") or Decimal("0")
        subtotal, taxable, gst, total = _totals(items, discount, gst_rate)
        invoice = Invoice.objects.create(
            invoice_number=_next_number("invoice_number", "INV", 5),
            quotation=quotation,
            client=client,
            project=project,
            milestone=milestone,
            agreement=agreement,
            subtotal=subtotal,
            taxable_amount=taxable,
            gst_amount=gst,
            total_amount=total,
            created_by=actor,
            updated_by=actor,
            **data,
        )
        for item in items:
            quantity, unit_price, amount = _item_amount(item)
            InvoiceItem.objects.create(invoice=invoice, description=item["description"], quantity=quantity, unit_price=unit_price, amount=amount, created_by=actor, updated_by=actor)
        LedgerEntry.objects.create(entry_number=_next_number("ledger_entry_number", "LED", 6), entry_type=LedgerEntry.EntryType.SALE, entry_date=invoice.invoice_date, client=client, invoice=invoice, description=f"Invoice {invoice.invoice_number}", debit=invoice.total_amount, credit=0, created_by=actor, updated_by=actor)
        record_audit_log(actor=actor, module="finance", action="create", entity_type="Invoice", entity_id=invoice.id, new_values={"invoice_number": invoice.invoice_number, "total_amount": str(total)}, request=request)
        return invoice

    @staticmethod
    @transaction.atomic
    def update_invoice(*, invoice, data, actor, request=None):
        old_values = {
            "status": invoice.status,
            "total_amount": str(invoice.total_amount),
            "payment_status": invoice.payment_status,
        }
        if invoice.status not in {Invoice.Status.DRAFT, Invoice.Status.PENDING_APPROVAL}:
            raise ValidationError({"status": "Only draft or pending approval invoices can be edited."})
        if invoice.paid_amount or invoice.tds_amount:
            raise ValidationError({"payment_status": "Invoices with recorded payments cannot be edited."})

        if "quotation_id" in data:
            quotation_id = data.pop("quotation_id")
            quotation = Quotation.objects.get(id=quotation_id, is_deleted=False) if quotation_id else None
            if quotation and Invoice.objects.filter(quotation=quotation, is_deleted=False).exclude(id=invoice.id).exclude(status__in=[Invoice.Status.CANCELLED, Invoice.Status.ARCHIVED]).exists():
                raise ValidationError({"quotation_id": "Active invoice already exists for this quotation."})
            invoice.quotation = quotation
        if "client_id" in data:
            invoice.client = FinanceClient.objects.get(id=data.pop("client_id"), is_deleted=False)
        if "project_id" in data:
            project_id = data.pop("project_id")
            invoice.project = DeliveryProject.objects.get(id=project_id, is_deleted=False) if project_id else None
        if "milestone_id" in data:
            milestone_id = data.pop("milestone_id")
            invoice.milestone = ProjectMilestone.objects.get(id=milestone_id, is_deleted=False) if milestone_id else None
        if "agreement_id" in data:
            agreement_id = data.pop("agreement_id")
            invoice.agreement = ProjectAgreement.objects.get(id=agreement_id, is_deleted=False) if agreement_id else None

        items = data.pop("items", None)
        for field, value in data.items():
            setattr(invoice, field, value)

        if items is not None:
            invoice.items.filter(is_deleted=False).update(is_deleted=True, deleted_at=timezone.now(), deleted_by=actor)
            subtotal, taxable, gst, total = _totals(items, invoice.discount or Decimal("0"), invoice.gst_rate or Decimal("0"))
            invoice.subtotal = subtotal
            invoice.taxable_amount = taxable
            invoice.gst_amount = gst
            invoice.total_amount = total
            for item in items:
                quantity, unit_price, amount = _item_amount(item)
                InvoiceItem.objects.create(invoice=invoice, description=item["description"], quantity=quantity, unit_price=unit_price, amount=amount, created_by=actor, updated_by=actor)

        invoice.updated_by = actor
        invoice.save()
        LedgerEntry.objects.filter(invoice=invoice, entry_type=LedgerEntry.EntryType.SALE, is_deleted=False).update(
            entry_date=invoice.invoice_date,
            client=invoice.client,
            description=f"Invoice {invoice.invoice_number}",
            debit=invoice.total_amount,
            updated_by=actor,
            updated_at=timezone.now(),
        )
        record_audit_log(actor=actor, module="finance", action="update", entity_type="Invoice", entity_id=invoice.id, old_values=old_values, new_values={"status": invoice.status, "total_amount": str(invoice.total_amount)}, request=request)
        return invoice

    @staticmethod
    @transaction.atomic
    def update_invoice_status(*, invoice, status, actor, request=None):
        old_status = invoice.status
        invoice.status = status
        invoice.updated_by = actor
        invoice.save(update_fields=["status", "updated_by", "updated_at"])
        record_audit_log(actor=actor, module="finance", action="status", entity_type="Invoice", entity_id=invoice.id, old_values={"status": old_status}, new_values={"status": status}, request=request)
        NotificationService.create_event(
            actor=actor,
            title=f"Invoice {invoice.invoice_number} {invoice.get_status_display()}",
            message=f"{invoice.client.company_name} invoice is now {invoice.get_status_display().lower()}.",
            notification_type="Finance",
            priority="High",
            target_module="Finance Control",
            entity_type="Invoice",
            entity_id=invoice.id,
            is_broadcast=True,
            request=request,
        )
        return invoice

    @staticmethod
    @transaction.atomic
    def create_payment(*, data, actor, request=None):
        client = FinanceClient.objects.get(id=data.pop("client_id"), is_deleted=False)
        allocations = data.pop("allocations", [])
        bank_account = None
        if data.get("bank_account_id"):
            bank_account = BankAccount.objects.get(id=data.pop("bank_account_id"), is_deleted=False)
        if Payment.objects.filter(reference=data["reference"], is_deleted=False).exists():
            raise ValidationError({"reference": "Payment reference is already recorded."})
        if data["allocation_type"] == Payment.AllocationType.INVOICE and not allocations:
            raise ValidationError({"allocations": "Invoice payment requires at least one invoice allocation."})
        payment = Payment.objects.create(payment_number=_next_number("payment_number", "PAY", 5), client=client, bank_account=bank_account, created_by=actor, updated_by=actor, **data)
        allocated_total = Decimal("0")
        touched_invoices = []
        for row in allocations:
            invoice = Invoice.objects.select_for_update().get(id=row["invoice_id"], client=client, is_deleted=False)
            open_amount = invoice.total_amount - invoice.paid_amount - invoice.tds_amount
            row_total = row["amount"] + row.get("tds_amount", Decimal("0"))
            if row_total > open_amount:
                raise ValidationError({"amount": f"Payment allocation exceeds outstanding amount for {invoice.invoice_number}."})
            PaymentAllocation.objects.create(payment=payment, invoice=invoice, amount=row["amount"], tds_amount=row.get("tds_amount", Decimal("0")), created_by=actor, updated_by=actor)
            allocated_total += row["amount"]
            touched_invoices.append(invoice)
        if allocations and allocated_total > payment.amount:
            raise ValidationError({"amount": "Allocated cash amount cannot exceed payment amount."})
        for invoice in touched_invoices:
            _refresh_invoice_payment_status(invoice)
        LedgerEntry.objects.create(entry_number=_next_number("ledger_entry_number", "LED", 6), entry_type=LedgerEntry.EntryType.ADJUSTMENT, entry_date=payment.payment_date, client=client, description=f"Payment {payment.payment_number}", debit=0, credit=payment.amount, created_by=actor, updated_by=actor)
        record_audit_log(actor=actor, module="finance", action="create", entity_type="Payment", entity_id=payment.id, new_values={"payment_number": payment.payment_number, "amount": str(payment.amount)}, request=request)
        NotificationService.create_event(
            actor=actor,
            title=f"Payment recorded: {payment.payment_number}",
            message=f"{client.company_name} payment of {payment.amount} has been recorded.",
            notification_type="Finance",
            priority="High",
            target_module="Finance Control",
            entity_type="Payment",
            entity_id=payment.id,
            is_broadcast=True,
            request=request,
        )
        return payment

    @staticmethod
    @transaction.atomic
    def update_payment_status(*, payment, status, actor, request=None):
        old_status = payment.status
        payment.status = status
        payment.updated_by = actor
        payment.save(update_fields=["status", "updated_by", "updated_at"])
        for allocation in payment.allocations.select_related("invoice").filter(is_deleted=False):
            _refresh_invoice_payment_status(allocation.invoice)
        record_audit_log(actor=actor, module="finance", action="status", entity_type="Payment", entity_id=payment.id, old_values={"status": old_status}, new_values={"status": status}, request=request)
        NotificationService.create_event(
            actor=actor,
            title=f"Payment {payment.payment_number} {payment.get_status_display()}",
            message=f"Payment status updated to {payment.get_status_display().lower()} for {payment.client.company_name}.",
            notification_type="Finance",
            priority="High",
            target_module="Finance Control",
            entity_type="Payment",
            entity_id=payment.id,
            is_broadcast=True,
            request=request,
        )
        return payment

    @staticmethod
    @transaction.atomic
    def create_numbered(*, model, data, code, prefix, actor, request=None):
        number_field = {
            CreditNote: "credit_note_number",
            LedgerEntry: "entry_number",
            ExpenseEntry: "expense_number",
            Budget: "budget_code",
            FinancePayrollRecord: "payroll_number",
            TDSRecord: "tds_number",
            ApprovalRequest: "request_number",
        }[model]
        data[number_field] = _next_number(code, prefix, 5 if prefix != "LED" else 6)
        if model is ApprovalRequest and not data.get("requested_by"):
            data["requested_by"] = actor
        obj = model.objects.create(created_by=actor, updated_by=actor, **data)
        record_audit_log(actor=actor, module="finance", action="create", entity_type=model.__name__, entity_id=obj.id, request=request)
        if model is ApprovalRequest:
            NotificationService.create_event(
                actor=actor,
                title=f"Approval request queued: {obj.request_number}",
                message="Finance approval workflow requires review.",
                notification_type="Approval",
                priority="High",
                target_module="Finance Control",
                entity_type="ApprovalRequest",
                entity_id=obj.id,
                is_broadcast=True,
                request=request,
            )
        return obj
