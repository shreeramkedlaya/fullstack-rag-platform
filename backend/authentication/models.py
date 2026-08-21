from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.hashers import make_password

db_using = "customer_orders_db"

class SystemUser(models.Model):
    """
    Custom user model for session-based authentication.
    Intentionally decoupled from Django's AUTH_USER_MODEL to keep
    auth logic fully under our control as a learning exercise.

    Physical table lives in customer_orders_db (via db_using).
    The Python home is now authentication/ — a dedicated auth app —
    so this model is no longer tied to the CustomerOrders domain.
    """
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('user', 'User'),
    )
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)  # stores hashed password
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_authenticated(self):
        """
        Always return True. This is a way to tell if the user has been
        authenticated by DRF permission classes.
        """
        return True

    # Routes reads/writes to customer_orders_db (same physical table as before).
    # Only the Python/app-label home has changed.
    db_using = db_using
    class Meta:
        db_table = "system_user"

    def __str__(self):
        return f"{self.email} ({self.role})"

    def set_password(self,raw_password):
        """ helper to has pwd properly """
        self.password = make_password(raw_password)
        self.save()

class LoginHistory(models.Model):
    # Nullable ForeignKey in case they attempt to log in with an email that doesn't exist
    user = models.ForeignKey(SystemUser, on_delete=models.SET_NULL,null=True, blank=True)
    ip_address = models.CharField(max_length=50)
    is_success = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    metadata = models.JSONField(default=dict)

    db_using = db_using

    class Meta:
        db_table = 'login_history'
        ordering = ['-created_at']
    
    def __str__(self):
        email = self.metadata.get('email_attempted','Unknown')
        reason = self.metadata.get('failure_reason')
        status = 'Success' if self.is_success else f"Failed ({reason})"
        return f"[{self.created_at}] {email} from {self.ip_address} - {status}"


class PasswordHistory(models.Model):
    user = models.ForeignKey(SystemUser, on_delete=models.CASCADE, related_name='password_history')
    pwd_hash = models.CharField(max_length=128)
    created_at=models.DateTimeField(auto_now_add=True)

    db_using = db_using

    class Meta:
        db_table = "password_history"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.created_at}"


@receiver(post_save, sender=SystemUser)
def track_password_history(sender, instance, created, **kwargs):
    """ automatically tracks pwd history and keeps only latest 3 """

    # check if the history record with this hash exists(prevents duplicates on non-password updates)
    if not PasswordHistory.objects.using(db_using).filter(user=instance, pwd_hash=instance.password).exists():
        PasswordHistory.objects.using(db_using).create(
            user=instance,
            pwd_hash=instance.password
        )

    # keep last 3 pwds
    history_ids = PasswordHistory.objects.using(db_using).filter(
        user=instance
    ).order_by('-created_at').values_list('id', flat=True)[3:]

    if history_ids:
        PasswordHistory.objects.using(db_using).filter(id__in=history_ids).delete()