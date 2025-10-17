'use server'

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { cookies } from 'next/headers';

export const apiClient = axios.create({
    baseURL: `${process.env.API_URL}`,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true
});

// Flag to prevent multiple simultaneous refresh requests
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
    failedQueue.forEach(promise => {
        if (error) {
            promise.reject(error);
        } else {
            promise.resolve(token);
        }
    });
    failedQueue = [];
};

// Request interceptor to add access token to headers
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('accessToken')?.value;
        
        if (accessToken && config.headers) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Skip refresh for login and refresh endpoints
            if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
                return Promise.reject(error);
            }

            if (isRefreshing) {
                // If already refreshing, queue this request
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                    }
                    return apiClient(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const cookieStore = await cookies();
                const refreshToken = cookieStore.get('refreshToken')?.value;

                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                // Call refresh endpoint
                const response = await axios.post(
                    `${process.env.API_URL}/auth/refresh`,
                    null,
                    {
                        headers: {
                            'Cookie': `refreshToken=${refreshToken}`
                        }
                    }
                );

                const { accessToken: newAccessToken } = response.data;

                // Save the new access token
                cookieStore.set('accessToken', newAccessToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 60 * 15 // 15 minutes
                });

                // If backend returns a new refresh token, update it
                const setCookieHeader = response.headers['set-cookie'];
                if (setCookieHeader) {
                    const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
                    
                    for (const cookie of cookies) {
                        if (cookie.startsWith('refreshToken=')) {
                            const cookieParts = cookie.split(';');
                            const tokenPart = cookieParts[0];
                            const newRefreshToken = tokenPart.split('=')[1];
                            
                            let maxAge = 60 * 60 * 24 * 7;
                            
                            for (const part of cookieParts.slice(1)) {
                                const trimmed = part.trim();
                                if (trimmed.toLowerCase().startsWith('max-age=')) {
                                    maxAge = parseInt(trimmed.split('=')[1]);
                                }
                            }

                            cookieStore.set('refreshToken', newRefreshToken, {
                                httpOnly: true,
                                secure: process.env.NODE_ENV === 'production',
                                sameSite: 'lax',
                                maxAge: maxAge
                            });
                            break;
                        }
                    }
                }

                // Update the original request with new token
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                }

                processQueue(null, newAccessToken);
                isRefreshing = false;

                // Retry the original request
                return apiClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError as Error, null);
                isRefreshing = false;

                // Clear cookies on refresh failure
                const cookieStore = await cookies();
                cookieStore.delete('accessToken');
                cookieStore.delete('refreshToken');

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);