# Generated by Django 4.1.4 on 2023-01-10 17:40

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("base", "0010_product_unit"),
    ]

    operations = [
        migrations.AlterField(
            model_name="product",
            name="unit",
            field=models.CharField(blank=True, default="kg", max_length=100, null=True),
        ),
    ]
