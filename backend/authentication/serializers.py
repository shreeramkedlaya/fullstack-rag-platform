from rest_framework import serializers
from .models import SystemUser

class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = SystemUser
        fields = ['email', 'password']

    def validate_email(self, value):
        # We need to query using the correct db_using
        if SystemUser.objects.using(SystemUser.db_using).filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        # Force role='user' regardless of what the user tries to send
        # It's not in fields anyway, but let's be explicit
        user = SystemUser(
            email=validated_data['email'],
            role='user'
        )
        # Use set_password to properly hash it (this sets the password and calls save)
        # Wait, the models.py set_password calls self.save() without using db_using?
        # Let's check models.py set_password:
        # def set_password(self,raw_password):
        #     self.password = make_password(raw_password)
        #     self.save() # THIS WILL SAVE TO 'default' UNLESS ROUTER INTERCEPTS
        # Because we have db_router, self.save() will go to db_using if router allows.
        # It's safer to just hash it here or use self.save(using=db_using)
        # I will manually hash and save.
        from django.contrib.auth.hashers import make_password
        user.password = make_password(validated_data['password'])
        user.save(using=SystemUser.db_using)
        return user
