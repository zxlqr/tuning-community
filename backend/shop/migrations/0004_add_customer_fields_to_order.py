# Generated manually
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0003_create_shop'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='customer_first_name',
            field=models.CharField(blank=True, default='', max_length=100, verbose_name='Имя'),
        ),
        migrations.AddField(
            model_name='order',
            name='customer_last_name',
            field=models.CharField(blank=True, default='', max_length=100, verbose_name='Фамилия'),
        ),
        migrations.AddField(
            model_name='order',
            name='customer_middle_name',
            field=models.CharField(blank=True, max_length=100, null=True, verbose_name='Отчество'),
        ),
        migrations.AddField(
            model_name='order',
            name='customer_phone',
            field=models.CharField(blank=True, default='', max_length=20, verbose_name='Номер телефона'),
        ),
    ]

