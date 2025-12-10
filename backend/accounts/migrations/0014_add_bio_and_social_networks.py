# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0013_add_separate_name_privacy_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='bio',
            field=models.TextField(blank=True, help_text='Краткое описание о себе', max_length=500, null=True, verbose_name='Описание'),
        ),
        migrations.AddField(
            model_name='user',
            name='instagram',
            field=models.CharField(blank=True, help_text='Ссылка или username Instagram', max_length=200, null=True, verbose_name='Instagram'),
        ),
        migrations.AddField(
            model_name='user',
            name='telegram',
            field=models.CharField(blank=True, help_text='Ссылка или username Telegram', max_length=200, null=True, verbose_name='Telegram'),
        ),
        migrations.AddField(
            model_name='user',
            name='youtube',
            field=models.CharField(blank=True, help_text='Ссылка или username YouTube', max_length=200, null=True, verbose_name='YouTube'),
        ),
        migrations.AddField(
            model_name='user',
            name='vk',
            field=models.CharField(blank=True, help_text='Ссылка или username VK', max_length=200, null=True, verbose_name='VK'),
        ),
    ]

