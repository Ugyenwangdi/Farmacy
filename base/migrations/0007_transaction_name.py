# Generated by Django 4.1.4 on 2023-01-09 22:42

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("base", "0006_transaction"),
    ]

    operations = [
        migrations.AddField(
            model_name="transaction",
            name="name",
            field=models.CharField(blank=True, max_length=200, null=True),
        ),
    ]
