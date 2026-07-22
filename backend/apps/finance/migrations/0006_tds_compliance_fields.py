from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("finance", "0005_gst_return_compliance_fields"),
    ]

    operations = [
        migrations.AddField(model_name="tdsrecord", name="source_type", field=models.CharField(db_index=True, default="Client TDS Receivable", max_length=40)),
        migrations.AddField(model_name="tdsrecord", name="source_id", field=models.CharField(blank=True, db_index=True, max_length=120)),
        migrations.AddField(model_name="tdsrecord", name="party_id", field=models.CharField(blank=True, db_index=True, max_length=80)),
        migrations.AddField(model_name="tdsrecord", name="party_name", field=models.CharField(blank=True, max_length=180)),
        migrations.AddField(model_name="tdsrecord", name="section", field=models.CharField(db_index=True, default="194J", max_length=20)),
        migrations.AddField(model_name="tdsrecord", name="taxable_amount", field=models.DecimalField(decimal_places=2, default=0, max_digits=14)),
        migrations.AddField(model_name="tdsrecord", name="rate", field=models.DecimalField(decimal_places=3, default=0, max_digits=7)),
        migrations.AddField(model_name="tdsrecord", name="deduction_date", field=models.DateField(blank=True, db_index=True, null=True)),
        migrations.AddField(model_name="tdsrecord", name="deposit_due_date", field=models.DateField(blank=True, db_index=True, null=True)),
        migrations.AddField(model_name="tdsrecord", name="challan_no", field=models.CharField(blank=True, db_index=True, max_length=120)),
        migrations.AddField(model_name="tdsrecord", name="challan_date", field=models.DateField(blank=True, null=True)),
        migrations.AddField(model_name="tdsrecord", name="return_ack_no", field=models.CharField(blank=True, db_index=True, max_length=120)),
        migrations.AddField(model_name="tdsrecord", name="certificate_status", field=models.CharField(db_index=True, default="Pending", max_length=30)),
        migrations.AddField(model_name="tdsrecord", name="lower_deduction_certificate", field=models.CharField(blank=True, max_length=120)),
        migrations.AddField(model_name="tdsrecord", name="remarks", field=models.TextField(blank=True)),
        migrations.AddIndex(model_name="tdsrecord", index=models.Index(fields=["source_type", "status"], name="tds_records_source__58c30a_idx")),
        migrations.AddIndex(model_name="tdsrecord", index=models.Index(fields=["source_id"], name="tds_records_source__4c49ac_idx")),
    ]
