# 🖥️ Frontend (React SPA)

## Structure
- **`src/pages/`**: Contains route views (`Login`, `Customers`, `CustomerDetail`, `Notes`).
- **`src/components/ui/`**: 70+ components based on shadcn/ui.
- **`src/context/`**: `AuthContext` (manages session state) and `ToastContext` (notifications).
- **`src/http.ts`**: Axios configuration forcing `withCredentials = true` to pass cookies.

## The AI Chat Widget (`ChatWidget.tsx`)
A floating assistant integrated globally.
- Features drag-and-drop document ingestion.
- Multi-file staging support (staged files before sending).
- Chat history, renaming, and deletion.
- Hybrid fallback (AI answers general questions if document search fails).
