# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0009_user_avatar'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='is_email_private',
            field=models.BooleanField(default=False, help_text='Если включено, email не будет виден другим пользователям', verbose_name='Скрыть email'),
        ),
        migrations.AddField(
            model_name='user',
            name='is_name_private',
            field=models.BooleanField(default=False, help_text='Если включено, имя и фамилия не будут видны другим пользователям', verbose_name='Скрыть имя и фамилию'),
        ),
        migrations.AddField(
            model_name='user',
            name='is_phone_private',
            field=models.BooleanField(default=False, help_text='Если включено, телефон не будет виден другим пользователям', verbose_name='Скрыть телефон'),
        ),
    ]

