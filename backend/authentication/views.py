from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.contrib.auth.hashers import check_password, make_password
from django.conf import settings
from django.core.cache import cache
import secrets
import uuid
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
import base64
from captcha.image import ImageCaptcha

from django.utils import timezone
from datetime import timedelta
from .models import SystemUser, LoginHistory, SystemUser, PasswordHistory
from .serializers import SignupSerializer
from .rate_limit import check_login_rate_limit, check_refresh_rate_limit, check_captcha_rate_limit, RateLimitExceeded
db_using = "customer_orders_db"

class LoginView(APIView):
    """
    POST /api/auth/login/
    Authenticate a user and issue either a session cookie or a JWT token pair,
    depending on the backend's AUTH_MODE setting.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        captcha_id = request.data.get('captcha_id')
        captcha_value = request.data.get('captcha_value')

        def log_attempt(success, reason=None, user_obj=None):
            ip_address = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', 'unknown'))
            user_agent = request.META.get('HTTP_USER_AGENT', 'unknown')
        
            LoginHistory.objects.using('customer_orders_db').create(
                user=user_obj,
                ip_address=ip_address,
                is_success=success,
                metadata={
                    "email_attempted": email or "Missing Email",
                    "user_agent": user_agent,
                    "failure_reason": reason
                }
            )

        if not email or not password:
            log_attempt(False, "Missing credentials")
            return Response(
                {"message": "Email and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 1. fetch the expected captcha from redis
        expected_captcha = cache.get(f"captcha_{captcha_id}")

        # 2. delete it immediately from redis
        if expected_captcha:
            cache.delete(f"captcha_{captcha_id}")

        # 3. validate
        if not expected_captcha or expected_captcha.upper() != captcha_value.upper():
            log_attempt(False, "Invalid or expired CAPTCHA")
            return Response(
                {"message": "Invalid or expired CAPTCHA."},
                status = status.HTTP_400_BAD_REQUEST,
            )
        
        try:
            check_login_rate_limit(email)
        except RateLimitExceeded as e:
            log_attempt(False, "Rate limited")
            return Response({"message": str(e)}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        try:
            user = SystemUser.objects.using('customer_orders_db').get(email=email)
        except SystemUser.DoesNotExist:
            log_attempt(False, "User not found")
            return Response(
                {"message": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not check_password(password, user.password):
            log_attempt(False, "Wrong password", user_obj=user)
            return Response(
                {"message": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            log_attempt(False, "Account disabled", user_obj=user)
            return Response(
                {"message": "Account is disabled."},
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh = RefreshToken.for_user(user)
        # Add custom claims if needed
        refresh['user_role'] = user.role
        
        # Generate Opaque Transaction ID (8 chars)
        transaction_id = secrets.token_urlsafe(6)
        
        # --- CLEANUP PREVIOUS SESSIONS (3-Device FIFO Queue) ---
        user_sessions_key = f'user_sessions_{user.id}'
        active_sessions = cache.get(user_sessions_key, [])
        
        # Add the new session
        active_sessions.append(transaction_id)
        
        # If user exceeds 3 active devices, remove the oldest one
        if len(active_sessions) > 3:
            oldest_txn_id = active_sessions.pop(0)
            cache.delete(oldest_txn_id)
            
        # Save the updated active sessions list
        cache.set(user_sessions_key, active_sessions, timeout=604800)
        # --------------------------------------------------------
        
        # Store in Redis for 7 days (604800 seconds)
        cache.set(transaction_id, str(refresh), timeout=604800)
        
        # LOG THE SUCCESS!
        log_attempt(True, None, user_obj=user)

        response = Response({
            "message": "Login successful.",
            "user": {"id": user.id, "email": user.email, "role": user.role},
            "access_exp": refresh.access_token['exp']
        }, status=status.HTTP_200_OK)
        
        response.set_cookie(
            'access_token', 
            str(refresh.access_token),
            httponly=True,
            secure=True,
            samesite='None',
            max_age=600 # 10 minutes (matches token expiry)
        )
        
        response.set_cookie(
            'transaction_id',
            transaction_id,
            httponly=True,
            secure=True,
            samesite='None',
            max_age=604800 # 7 days
        )
        
        return response


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Destroy the session or revoke the opaque refresh token from Redis.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        response = Response({"message": "Logout successful."}, status=status.HTTP_200_OK)
        
        transaction_id = request.COOKIES.get("transaction_id")
        if transaction_id:
            cache.delete(transaction_id)
        
        response.delete_cookie("access_token")
        response.delete_cookie("transaction_id")
        
        return response

class OpaqueTokenRefreshView(APIView):
    """
    POST /api/auth/token/refresh/
    Takes an opaque transaction_id, rate-limits it, fetches the real 
    refresh token from Redis, and returns a new access token.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        transaction_id = request.COOKIES.get("transaction_id")
        if not transaction_id:
            return Response({"message": "Transaction ID is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Get client IP for rate limiting
        ip_address = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', 'unknown'))
        
        try:
            check_refresh_rate_limit(ip_address)
        except RateLimitExceeded as e:
            return Response({"message": str(e)}, status=status.HTTP_429_TOO_MANY_REQUESTS)
            
        real_refresh_token = cache.get(transaction_id)
        if not real_refresh_token:
            response = Response({"message": "Invalid or expired transaction ID."}, status=status.HTTP_401_UNAUTHORIZED)
            response.delete_cookie("access_token")
            response.delete_cookie("transaction_id")
            return response
            
        try:
            refresh = RefreshToken(real_refresh_token)
            
            response = Response({
                "access_exp": refresh.access_token['exp']
            }, status=status.HTTP_200_OK)
            
            response.set_cookie(
                'access_token', 
                str(refresh.access_token),
                httponly=True,
                secure=True,
                samesite='None',
                max_age=600
            )
            
            return response
        except Exception as e:
            response = Response({"message": "Token is invalid or expired."}, status=status.HTTP_401_UNAUTHORIZED)
            response.delete_cookie("access_token")
            response.delete_cookie("transaction_id")
            return response


class CurrentUserView(APIView):
    """
    GET /api/auth/me/
    Return the currently authenticated user's details.
    Supports both Token (request.user) and Session (request.session).
    """
    def get(self, request):
        # 1. Try Token Auth First
        if request.user and getattr(request.user, 'is_authenticated', False) and isinstance(request.user, SystemUser):
            return Response(
                {"user": {"id": request.user.id, "email": request.user.email, "role": request.user.role}},
                status=status.HTTP_200_OK,
            )
        
        # 2. Fallback to Session Auth
        user_id = request.session.get('user_id')
        if not user_id:
            return Response(
                {"message": "Not authenticated."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            user = SystemUser.objects.using('customer_orders_db').get(id=user_id)
            return Response(
                {"user": {"id": user.id, "email": user.email, "role": user.role}},
                status=status.HTTP_200_OK,
            )
        except SystemUser.DoesNotExist:
            request.session.flush()
            return Response(
                {"message": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )


class CaptchaView(APIView):
    """
    GET /api/auth/captcha/
    Generates a 5-character string, stores it in Redis, and returns the image as Base64.
    """
    permission_classes = [AllowAny]

    def get(self,request):
        # 0. Check Rate Limit
        ip_address = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', 'unknown'))
        try:
            check_captcha_rate_limit(ip_address)
        except RateLimitExceeded as e:
            return Response({"message": str(e)}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        # 1. generate 5 char string
        captcha_text = ''.join(secrets.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789') for _ in range(5))

        # 2. generate unique id for cptcha session
        captcha_id = str(uuid.uuid4())

        # 3. store in redis (expired in 5 mins)
        cache.set(f"captcha_{captcha_id}",captcha_text,timeout=300)

        # 4. generate image
        image = ImageCaptcha(width=160, height=60)
        data = image.generate(captcha_text)

        # 5. convert to base 64 for frontend to render directly
        base64_img = base64.b64encode(data.getvalue()).decode('utf-8')

        return Response({
            'captcha_id': captcha_id,
            'image': f"data:image/png;base64,{base64_img}"
        })

class LoginHistoryView(APIView):
    """
    GET /api/auth/login-history/
    Returns the recent login history. We return the most recent 50 logs concisely.
    """
    def get(self, request):
        # 1. The Lazy Purge: Auto-delete logs older than 30 days
        thirty_days_ago = timezone.now() - timedelta(days=30)
        LoginHistory.objects.using('customer_orders_db').filter(created_at__lt=thirty_days_ago).delete()

        # 2. Pagination logic
        try:
            offset = int(request.GET.get('offset', 0))
            limit = int(request.GET.get('limit', 50))
        except ValueError:
            offset = 0
            limit = 50

        # 3. Fetch data
        queryset = LoginHistory.objects.using('customer_orders_db').all()
        total_count = queryset.count()
        history = queryset[offset:offset+limit]

        data = []
        for h in history:
            data.append({
                "id": h.id,
                "email": h.metadata.get("email_attempted", "Unknown"),
                "ip_address": h.ip_address,
                "status": "Success" if h.is_success else f"Failed ({h.metadata.get('failure_reason')})",
                "user_agent": h.metadata.get("user_agent", "Unknown"),
                "date": h.created_at.isoformat()
            })
            
        return Response({
            "history": data,
            "pagination": {
                "total": total_count,
                "offset": offset,
                "limit": limit,
                "has_more": (offset + limit) < total_count
            }
        }, status=status.HTTP_200_OK)

    def delete(self, request):
        """Purge all login history or a specific log."""
        log_id = request.GET.get('id')
        if log_id:
            LoginHistory.objects.using('customer_orders_db').filter(id=log_id).delete()
            return Response({"message": "Log deleted successfully."}, status=status.HTTP_200_OK)
            
        LoginHistory.objects.using('customer_orders_db').all().delete()
        return Response({"message": "Audit log successfully purged."}, status=status.HTTP_200_OK)

# 3 new views - ChangePasswordView, AdminResetPasswordView, AdminUsersListView

def invalidate_user_sessions(user_id):
    """ helper funciton to wipe the active jwt tokens for a user in redis """
    user_sessions_key = f'user_sessions_{user_id}'
    active_sessions = cache.get(user_sessions_key,[])
    for txn_id in active_sessions:
        cache.delete(txn_id)
    cache.delete(user_sessions_key)

def is_recent_password(user, raw_password):
    """ checks if the password matches the user's last 3 pwds hashes"""
    recent_hashes = PasswordHistory.objects.using(db_using).filter(user=user).values_list('pwd_hash',flat=True)[:3]

    for p in recent_hashes:
        if check_password(raw_password,p):
            return True
    return False


class ChangePasswordView(APIView):
    """ 
    POST /api/auth/change-password/
    Standard user password change
    """
    def post(self,request):
        user_id = request.session.get('user_id') or (request.user.id if request.user else None)
        if not user_id:
            return Response({'message':"Not authenticated"},status=status.HTTP_401_UNAUTHORIZED)

        user = SystemUser.objects.using(db_using).get(id=user_id)
        old_pwd = request.data.get('old_password')
        new_pwd = request.data.get('new_password')

        if not old_pwd or not new_pwd:
            return Response({'message': 'Both old and new passowrds are required'},status=status.HTTP_400_BAD_REQUEST)
        
        if not check_password(old_pwd, user.password):
            return Response({'message': 'Incorrect old password'},status=status.HTTP_400_BAD_REQUEST)
        
        if is_recent_password(user, new_pwd):
            return Response({'message': 'Cannot reuse any of the last 3 passwords'},status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_pwd)
        return Response({'message': 'Password updated successfully'},status=status.HTTP_200_OK)


class AdminUsersListView(APIView):
    """ 
    GET /api/auth/users/
    List all the users for the Admin Dashboard
    """
    def get(self,request):
        user_id = request.session.get('user_id') or (request.user.id if request.user else None)

        if not user_id:
            return Response({'message':"Not authenticated"},status=status.HTTP_401_UNAUTHORIZED)
        admin = SystemUser.objects.using(db_using).get(id=user_id)
        if admin.role != 'admin':
            return Response({'message':"Admin privileges required"},status=status.HTTP_403_FORBIDDEN)
        
        users = SystemUser.objects.using(db_using).all().values('id', 'email', 'role', 'is_active', 'created_at')
                
        return Response(list(users),status=status.HTTP_200_OK)


class AdminResetPasswordView(APIView):
    """ 
    POST /api/admin/users/<id>/reset-password/
    Force reset a user's password and wipe sessions.
    """

    def post(self,request, user_id):
        admin_id = request.session.get('user_id') or (request.user.id if request.user else None)
        if not admin_id:
            return Response({'message':"Not authenticated"},status=status.HTTP_401_UNAUTHORIZED)
        
        admin = SystemUser.objects.using(db_using).get(id=admin_id)
        if admin.role != 'admin':
            return Response({'message':"Admin privileges required"},status=status.HTTP_403_FORBIDDEN)
        
        new_password = request.data.get('new_password')
        if not new_password:
            return Response({'message':"New password is required"},status=status.HTTP_400_BAD_REQUEST)
        

        try:
            target_user = SystemUser.objects.using(db_using).get(id=user_id)
        except SystemUser.DoesNotExist:
            return Response({'message':"User not found."},status=status.HTTP_404_NOT_FOUND)
        

        if is_recent_password(target_user, new_password):
            return Response({"message": "Cannot use any of the user's last 3 passwords."}, status=status.HTTP_400_BAD_REQUEST)

        target_user.set_password(new_password)
        invalidate_user_sessions(target_user.id)
        return Response({"message": f"Password for {target_user.email} reset successfully. Active sessions revoked."}, status=status.HTTP_200_OK)


class SignupView(APIView):
    """
    POST /api/auth/signup/
    Public endpoint to register a new user. Role is forced to 'user'.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({"message": "User registered successfully."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminUpdateRoleView(APIView):
    """
    PATCH /api/auth/admin/users/<user_id>/role/
    Allows admin to toggle user role.
    """
    def patch(self, request, user_id):
        admin_id = request.session.get('user_id') or (request.user.id if request.user else None)
        if not admin_id:
            return Response({'message':"Not authenticated"},status=status.HTTP_401_UNAUTHORIZED)
        
        admin = SystemUser.objects.using(db_using).get(id=admin_id)
        if admin.role != 'admin':
            return Response({'message':"Admin privileges required"},status=status.HTTP_403_FORBIDDEN)
        
        try:
            target_user = SystemUser.objects.using(db_using).get(id=user_id)
        except SystemUser.DoesNotExist:
            return Response({'message':"User not found."},status=status.HTTP_404_NOT_FOUND)
        
        new_role = request.data.get('role')
        if new_role not in ['admin', 'user']:
            return Response({"message": "Invalid role."}, status=status.HTTP_400_BAD_REQUEST)
        
        target_user.role = new_role
        target_user.save(using=db_using)
        
        # Invalidate sessions if they are being demoted? 
        # (Optional, but let's do it just in case)
        if new_role == 'user':
            invalidate_user_sessions(target_user.id)
            
        return Response({"message": f"User {target_user.email} role updated to {new_role}."}, status=status.HTTP_200_OK)

