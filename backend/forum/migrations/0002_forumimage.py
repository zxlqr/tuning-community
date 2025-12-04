# Generated manually

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('forum', '0001_initial'),
        ('accounts', '0012_set_staff_for_managers'),
    ]

    operations = [
        migrations.CreateModel(
            name='ForumImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image', models.ImageField(help_text='Загруженное изображение', upload_to='forum/images/%Y/%m/%d/', verbose_name='Изображение')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Дата загрузки')),
                ('post', models.ForeignKey(blank=True, help_text='Сообщение, к которому относится изображение', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='images', to='forum.forumpost', verbose_name='Сообщение')),
                ('topic', models.ForeignKey(blank=True, help_text='Тема, к которой относится изображение', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='images', to='forum.forumtopic', verbose_name='Тема')),
                ('uploaded_by', models.ForeignKey(help_text='Пользователь, загрузивший изображение', on_delete=django.db.models.deletion.CASCADE, related_name='forum_images', to='accounts.user', verbose_name='Загружено пользователем')),
            ],
            options={
                'verbose_name': 'Изображение форума',
                'verbose_name_plural': 'Изображения форума',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='forumimage',
            index=models.Index(fields=['topic', '-created_at'], name='forum_forum_topic_i_created_idx'),
        ),
        migrations.AddIndex(
            model_name='forumimage',
            index=models.Index(fields=['post', '-created_at'], name='forum_forum_post_id_created_idx'),
        ),
    ]

