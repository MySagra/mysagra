'use client'

import { 
    getUsers,
    createUser, 
    deleteUser 
} from "@/services/users.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { User } from "@/types/user";
import { UserFormValues } from "@/schemas/userForm";

// Query to get all users
export function useUsers() {
    return useQuery({
        queryKey: ["users"],
        queryFn: getUsers
    });
}

// Mutation to create a new user
export function useCreateUser() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (userData: UserFormValues) => createUser(userData),
        onSuccess: (newUser) => {
            // Optimistically update the cache
            queryClient.setQueryData<User[]>(["users"], (old) => {
                if (!old) return [newUser];
                return [...old, newUser];
            });
        },
        onError: () => {
            // In case of error, invalidate cache to reload data
            queryClient.invalidateQueries({ queryKey: ["users"] });
        }
    });
}

// Mutation to delete a user
export function useDeleteUser() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (userId: number) => deleteUser(userId),
        onSuccess: (_, userId) => {
            // Optimistically remove from cache
            queryClient.setQueryData<User[]>(["users"], (old) => {
                if (!old) return old;
                return old.filter(u => u.id !== userId);
            });
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
        }
    });
}
