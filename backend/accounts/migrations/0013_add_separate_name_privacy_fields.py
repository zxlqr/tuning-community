# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0011_remove_role_bonus'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='is_first_name_private',
            field=models.BooleanField(default=False, help_text='Если включено, имя не будет видно другим пользователям', verbose_name='Скрыть имя'),
        ),
        migrations.AddField(
            model_name='user',
            name='is_last_name_private',
            field=models.BooleanField(default=False, help_text='Если включено, фамилия не будет видна другим пользователям', verbose_name='Скрыть фамилию'),
        ),
    ]

