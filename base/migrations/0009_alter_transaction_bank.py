# Generated by Django 4.1.4 on 2023-01-10 00:02

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("base", "0008_rename_product_transaction_order"),
    ]

    operations = [
        migrations.AlterField(
            model_name="transaction",
            name="bank",
            field=models.CharField(blank=True, max_length=200, null=True),
        ),
    ]
