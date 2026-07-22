from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("finance", "0006_tds_compliance_fields"),
    ]

    operations = [
        migrations.AlterField(
            model_name="tdsrecord",
            name="period",
            field=models.CharField(db_index=True, max_length=30),
        ),
    ]
