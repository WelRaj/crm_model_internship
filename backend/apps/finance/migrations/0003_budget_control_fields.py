from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("finance", "0002_creditnote_status_choices"),
    ]

    operations = [
        migrations.AddField(
            model_name="budget",
            name="scope_type",
            field=models.CharField(db_index=True, default="Department", max_length=30),
        ),
        migrations.AddField(
            model_name="budget",
            name="category",
            field=models.CharField(db_index=True, default="Operating Expenses", max_length=80),
        ),
        migrations.AddField(
            model_name="budget",
            name="fiscal_year",
            field=models.CharField(db_index=True, default="FY 2026-27", max_length=20),
        ),
        migrations.AddField(
            model_name="budget",
            name="contingency_amount",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=14),
        ),
        migrations.AddField(
            model_name="budget",
            name="committed_amount",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=14),
        ),
        migrations.AddField(
            model_name="budget",
            name="alert_threshold",
            field=models.DecimalField(decimal_places=2, default=80, max_digits=5),
        ),
        migrations.AddField(
            model_name="budget",
            name="block_threshold",
            field=models.DecimalField(decimal_places=2, default=100, max_digits=5),
        ),
        migrations.AddField(
            model_name="budget",
            name="owner",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="budget",
            name="cost_center",
            field=models.CharField(blank=True, db_index=True, max_length=80),
        ),
        migrations.AddField(
            model_name="budget",
            name="remarks",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="budget",
            name="approved_by",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AlterField(
            model_name="budget",
            name="status",
            field=models.CharField(db_index=True, default="Draft", max_length=30),
        ),
        migrations.AddField(
            model_name="budgetrevision",
            name="status",
            field=models.CharField(db_index=True, default="Pending", max_length=20),
        ),
        migrations.AddField(
            model_name="budgetrevision",
            name="requested_by",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="budgetrevision",
            name="approved_by",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="budgetrevision",
            name="approved_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddIndex(
            model_name="budget",
            index=models.Index(fields=["fiscal_year", "category"], name="budgets_fiscal__d59194_idx"),
        ),
    ]
