from django.urls import path
from .views import *

urlpatterns = [
    path('login-history/', LoginHistoryView.as_view(), name='auth-login-history'),
    path('captcha/',CaptchaView.as_view(),name='auth-captcha'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('signup/', SignupView.as_view(), name='auth-signup'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('me/', CurrentUserView.as_view(), name='auth-me'),
    path('token/refresh/', OpaqueTokenRefreshView.as_view(), name='token-refresh'),
    path('change-password/', ChangePasswordView.as_view(), name='auth-change-password'),
    path('admin/users/', AdminUsersListView.as_view(), name='admin-users-list'),
    path('admin/users/<int:user_id>/reset-password/', AdminResetPasswordView.as_view(), name='admin-reset-password'),
    path('admin/users/<int:user_id>/role/', AdminUpdateRoleView.as_view(), name='admin-update-role'),
]
