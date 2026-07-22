from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("finance", "0003_budget_control_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="financepayrollrecord",
            name="payment_method",
            field=models.CharField(default="NEFT", max_length=40),
        ),
        migrations.AddField(
            model_name="financepayrollrecord",
            name="payment_reference",
            field=models.CharField(blank=True, db_index=True, max_length=120),
        ),
        migrations.AddField(
            model_name="financepayrollrecord",
            name="paid_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="financepayrollrecord",
            name="remarks",
            field=models.TextField(blank=True),
        ),
        migrations.AddIndex(
            model_name="financepayrollrecord",
            index=models.Index(fields=["payment_reference"], name="payroll_reg_payment_eac6e4_idx"),
        ),
    ]
