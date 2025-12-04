# Generated manually

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0012_set_staff_for_managers'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='user',
            name='bonus_points',
        ),
        migrations.RemoveField(
            model_name='user',
            name='role',
        ),
    ]

