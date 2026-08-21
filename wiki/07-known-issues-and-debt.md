# ⚠️ Known Issues & Technical Debt

| Component | Issue |
|-----------|-------|
| `NotesCRUD/views.py` | All HTTP handler methods are **duplicated**. The second set overrides the first. |
| `Tasks/views.py` | Same duplication issue. Contains dead code. |
| `Tasks/urls.py` | `urlpatterns` is defined twice. |
| `Customers.tsx` | `setEditingCustomer` is called on the Edit button but never declared (runtime error if clicked). |
| Global Settings | `IsAdminForDelete` permission requires session auth on all endpoints, locking down Notes and Tasks inadvertently. |
| `authentication/` | App folder exists but is empty and not installed. |
