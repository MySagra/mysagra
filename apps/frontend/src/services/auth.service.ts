'use server'

import { cookies } from 'next/headers';
import { apiClient } from "@/lib/apiClient";
import { UserLogin } from "@/types/user";

export async function login(username: string, password: string): Promise<UserLogin> {
    const response = await apiClient.post("auth/login", {
        username,
        password
    });

    const { accessToken, user } = response.data;
    const setCookieHeader = response.headers['set-cookie'];

    const cookieStore = await cookies();
    
    // Save the access token
    cookieStore.set('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 15 // 15 minutes
    });

    // Extract and save the refresh token from backend's Set-Cookie header
    if (setCookieHeader) {
        const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
        
        for (const cookie of cookies) {
            if (cookie.startsWith('refreshToken=')) {
                // Extract the refresh token value
                const cookieParts = cookie.split(';');
                const tokenPart = cookieParts[0]; // "refreshToken=value"
                const refreshToken = tokenPart.split('=')[1];
                
                // Extract cookie parameters (Max-Age, Path, etc.)
                let maxAge = 60 * 60 * 24 * 7; // Default 7 days
                
                for (const part of cookieParts.slice(1)) {
                    const trimmed = part.trim();
                    if (trimmed.toLowerCase().startsWith('max-age=')) {
                        maxAge = parseInt(trimmed.split('=')[1]);
                    }
                }

                // Save the refresh token in Next.js server
                cookieStore.set('refreshToken', refreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: maxAge
                });
                break;
            }
        }
    }

    return { user, accessToken };
}

export async function logout(): Promise<void> {
    try {
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get('refreshToken')?.value;

        // Send the refresh token to backend to invalidate it
        if (refreshToken) {
            await apiClient.post("auth/logout", null, {
                headers: {
                    'Cookie': `refreshToken=${refreshToken}`
                }
            });
        }
    } catch (error) {
        console.error('Error during logout:', error);
    } finally {
        // Delete both tokens
        const cookieStore = await cookies();
        cookieStore.delete('accessToken');
        cookieStore.delete('refreshToken');
    }
}

export async function refreshAccessToken(): Promise<string | null> {
    try {
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get('refreshToken')?.value;

        if (!refreshToken) {
            return null;
        }

        // Send the refresh token to backend via Cookie header
        const response = await apiClient.post("auth/refresh", null, {
            headers: {
                'Cookie': `refreshToken=${refreshToken}`
            }
        });

        const { accessToken } = response.data;

        // Save the new access token
        cookieStore.set('accessToken', accessToken, {
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

        return accessToken;
    } catch (error) {
        // If refresh fails, delete both tokens
        const cookieStore = await cookies();
        cookieStore.delete('accessToken');
        cookieStore.delete('refreshToken');
        console.error(error)
        return null;
    }
}

export async function getAccessToken(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get('accessToken')?.value || null;
}