# Frontend SPA (React + Vite)

This is the frontend portion of the FullStack architecture, built with React 19, Vite 8, and TypeScript. It serves as the primary user interface, connecting seamlessly to both the Django API Gateway and the AI Microservice.

## 🚀 Tech Stack

- **Framework:** React 19 (Single Page Application)
- **Build Tool:** Vite 8
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** `shadcn/ui` (Radix primitives) + 70 custom components
- **Routing:** React Router v7
- **HTTP Client:** Custom `axios` configuration (`src/http.ts`)

## 📂 Project Structure

```text
frontend/
├── index.html           # Main HTML shell
├── vite.config.ts       # Vite bundler configuration
├── tailwind.config.ts   # Tailwind v4 configuration
└── src/
    ├── App.tsx          # Root router
    ├── main.tsx         # React bootstrap & Providers
    ├── http.ts          # Axios base URL & global config (with credentials)
    ├── components/
    │   ├── ui/          # 70+ shadcn/ui & custom business components
    │   ├── Layout.tsx   # Persistent nav + route outlet
    │   └── ChatWidget.tsx # Floating AI Assistant Widget
    ├── pages/           # Route views (Login, Customers, Notes, etc.)
    └── context/         # React Contexts (AuthContext, ToastContext)
```

## 🔐 Advanced Authentication (Proactive Sessions)

The frontend handles authentication without ever touching JWTs directly in JavaScript (preventing XSS).
- Short-lived `access_token` and long-lived `transaction_id` cookies are managed securely by the browser (`HttpOnly`).
- **Proactive Refresh:** The `checkValidityToken.ts` system automatically intercepts Axios requests. If the session is within 2 minutes of expiring, it silently refreshes the cookies in the background before allowing the request to proceed. This guarantees zero workflow interruption.
- **Kill-Switch:** If the backend rejects a session (e.g., user exceeded device limits), the interceptor forces a hard logout and redirects to `/login`.

## 🤖 The AI Chat Widget

Integrated tightly into the UI is the `ChatWidget.tsx`. It provides a persistent, floating interface for the RAG AI Microservice.
- Features drag-and-drop document ingestion.
- Multi-file staging.
- Streaming responses from the generative AI.

## 🏃‍♂️ Getting Started

### Installation
Make sure you are in the `frontend` directory, then install dependencies:
```bash
npm install
```

### Development Server
Run the local Vite development server:
```bash
npm run dev
```
The app will typically be available at `http://localhost:5173`.
