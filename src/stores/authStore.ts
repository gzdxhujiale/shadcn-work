import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
    // State
    const user = ref<User | null>(null)
    const session = ref<Session | null>(null)
    const isLoading = ref(true)
    const error = ref<string | null>(null)
    let authSubscription: { unsubscribe: () => void } | null = null

    // Getters
    const isAuthenticated = computed(() => !!user.value)

    const userDisplayName = computed(() => {
        if (!user.value) return ''
        return user.value.user_metadata?.full_name ||
            user.value.user_metadata?.name ||
            user.value.email?.split('@')[0] ||
            'User'
    })

    const userEmail = computed(() => user.value?.email || '')

    const userAvatar = computed(() => {
        if (!user.value) return ''
        return user.value.user_metadata?.avatar_url ||
            user.value.user_metadata?.picture ||
            ''
    })

    // Actions

    /**
     * Initialize auth state and set up listener
     * Call this once when app mounts
     */
    const initialize = async () => {
        isLoading.value = true
        error.value = null

        try {
            // Get current session
            const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()

            if (sessionError) {
                console.error('Error getting session:', sessionError)
                error.value = sessionError.message
            } else {
                session.value = currentSession
                user.value = currentSession?.user ?? null
            }

            // Set up auth state change listener
            // Clean up old subscription first
            if (authSubscription) {
                authSubscription.unsubscribe()
            }

            const { data: { subscription } } = supabase.auth.onAuthStateChange(
                (event: AuthChangeEvent, newSession: Session | null) => {
                    console.log('Auth state changed:', event)
                    session.value = newSession
                    user.value = newSession?.user ?? null

                    if (event === 'SIGNED_OUT') {
                        // Clear any cached data
                        error.value = null
                    }
                }
            )
            authSubscription = subscription

            // Store subscription for cleanup if needed
            // Note: In a real app, you might want to store this and unsubscribe on app unmount

        } catch (err: any) {
            console.error('Error initializing auth:', err)
            error.value = err.message || 'Failed to initialize authentication'
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Sign in with email and password
     */
    const signInWithPassword = async (email: string, password: string) => {
        isLoading.value = true
        error.value = null

        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (signInError) {
                error.value = signInError.message
                return { success: false, error: signInError.message }
            }

            return { success: true, data }
        } catch (err: any) {
            error.value = err.message || 'Sign in failed'
            return { success: false, error: error.value }
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Sign up with email and password
     */
    const signUp = async (email: string, password: string, metadata?: { full_name?: string }) => {
        isLoading.value = true
        error.value = null

        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: metadata
                }
            })

            if (signUpError) {
                error.value = signUpError.message
                return { success: false, error: signUpError.message }
            }

            // Check if email confirmation is required
            if (data.user && !data.session) {
                return {
                    success: true,
                    data,
                    message: '请检查您的邮箱以确认注册。'
                }
            }

            return { success: true, data }
        } catch (err: any) {
            error.value = err.message || 'Sign up failed'
            return { success: false, error: error.value }
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Sign out the current user
     */
    const signOut = async () => {
        isLoading.value = true
        error.value = null

        try {
            const { error: signOutError } = await supabase.auth.signOut()

            if (signOutError) {
                error.value = signOutError.message
                return { success: false, error: signOutError.message }
            }

            user.value = null
            session.value = null
            return { success: true }
        } catch (err: any) {
            error.value = err.message || 'Sign out failed'
            return { success: false, error: error.value }
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Reset password - sends reset email
     */
    const resetPassword = async (email: string) => {
        isLoading.value = true
        error.value = null

        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/reset-password`
            })

            if (resetError) {
                error.value = resetError.message
                return { success: false, error: resetError.message }
            }

            return { success: true, message: '密码重置邮件已发送，请检查您的邮箱。' }
        } catch (err: any) {
            error.value = err.message || 'Password reset failed'
            return { success: false, error: error.value }
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Cleanup subscriptions
     * Call this on app unmount
     */
    const cleanup = () => {
        if (authSubscription) {
            authSubscription.unsubscribe()
            authSubscription = null
        }
    }

    return {
        // State
        user,
        session,
        isLoading,
        error,
        // Getters
        isAuthenticated,
        userDisplayName,
        userEmail,
        userAvatar,
        // Actions
        initialize,
        signInWithPassword,
        signUp,
        signOut,
        resetPassword,
        cleanup
    }
})
