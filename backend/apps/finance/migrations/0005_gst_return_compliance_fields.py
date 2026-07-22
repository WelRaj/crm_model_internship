from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("finance", "0004_payroll_register_payment_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="gstreturn",
            name="credit_taxable",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=14),
        ),
        migrations.AddField(
            model_name="gstreturn",
            name="credit_tax_reversal",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=14),
        ),
        migrations.AddField(
            model_name="gstreturn",
            name="ineligible_itc",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=14),
        ),
        migrations.AddField(
            model_name="gstreturn",
            name="pending_itc",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=14),
        ),
        migrations.AddField(
            model_name="gstreturn",
            name="gstr1_taxable",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=14),
        ),
        migrations.AddField(
            model_name="gstreturn",
            name="gstr1_tax",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=14),
        ),
        migrations.AddField(
            model_name="gstreturn",
            name="gstr3b_output",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=14),
        ),
        migrations.AddField(
            model_name="gstreturn",
            name="gstr3b_itc",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=14),
        ),
        migrations.AddField(
            model_name="gstreturn",
            name="cash_ledger_balance",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=14),
        ),
        migrations.AddField(
            model_name="gstreturn",
            name="filing_due_date",
            field=models.DateField(blank=True, db_index=True, null=True),
        ),
        migrations.AddField(
            model_name="gstreturn",
            name="prepared_by",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="gstreturn",
            name="approved_by",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="gstreturn",
            name="arn",
            field=models.CharField(blank=True, db_index=True, max_length=120),
        ),
        migrations.AddField(
            model_name="gstreturn",
            name="filed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="gstreturn",
            name="remarks",
            field=models.TextField(blank=True),
        ),
        migrations.AddIndex(
            model_name="gstreturn",
            index=models.Index(fields=["arn"], name="gst_returns_arn_8df58b_idx"),
        ),
    ]
