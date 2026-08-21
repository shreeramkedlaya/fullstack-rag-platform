from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from authentication.models import SystemUser

class CustomJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        """
        Extracts the JWT from the 'access_token' HttpOnly cookie.
        Falls back to the Authorization header if not found.
        """
        raw_token = request.COOKIES.get('access_token') or None
        
        if raw_token is None:
            return super().authenticate(request)
            
        try:
            validated_token = self.get_validated_token(raw_token)
        except InvalidToken:
            return None
            
        return self.get_user(validated_token), validated_token

    def get_user(self, validated_token):
        """
        Attempts to find and return a user using the given validated token.
        Overrides the default behavior to query our custom SystemUser model
        instead of Django's default User model.
        """
        try:
            user_id = validated_token["user_id"]
        except KeyError:
            raise InvalidToken("Token contained no recognizable user identification")

        try:
            user = SystemUser.objects.get(id=user_id)
        except SystemUser.DoesNotExist:
            raise AuthenticationFailed("User not found", code="user_not_found")

        if not user.is_active:
            raise AuthenticationFailed("User is inactive", code="user_inactive")

        return user
