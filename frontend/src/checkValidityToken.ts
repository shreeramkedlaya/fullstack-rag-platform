let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

// ✅ Helper to check if session is expired or within the 2-min buffer
export const isSessionExpired = (): boolean => {
    const accessExpStr = localStorage.getItem('access_exp');
    if (!accessExpStr) return true;

    const exp = parseInt(accessExpStr, 10);
    const currentTime = Date.now() / 1000;

    const bufferTime = 120; // 2 minute early refresh buffer
    return (exp - currentTime) < bufferTime;
};

// ✅ Helper to execute the refresh request
export const refreshAccessToken = async (): Promise<void> => {
    try {
        // Dynamically import the custom axios instance to avoid circular dependencies
        const { default: axiosInstance } = await import("./http");
        console.log("🔄 Attempting proactive session refresh...");
        const response = await axiosInstance.post(`/auth/token/refresh/`, {}, { withCredentials: true });
        const newExp = response.data.access_exp;
        localStorage.setItem('access_exp', newExp.toString());
        console.log("✅ Session refreshed successfully");
    } catch (error) {
        console.error("❌ Session refresh failed", error);
        localStorage.removeItem('access_exp');
        throw error;
    }
};

// ✅ Core function to block requests until session is definitely valid
export const ensureValidSession = async (): Promise<void> => {
    if (isSessionExpired()) {
        if (!isRefreshing) {
            isRefreshing = true;
            refreshPromise = refreshAccessToken().finally(() => {
                isRefreshing = false;
                refreshPromise = null;
            });
        }

        if (refreshPromise) {
            await refreshPromise;
        }
    }
};
