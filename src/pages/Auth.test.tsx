import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@/test/test-utils'
import Auth from './Auth'
import { supabase } from '@/integrations/supabase/client'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}))

describe('Auth Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders login form by default', () => {
      render(<Auth />)

      expect(screen.getByText('Laurel County PVA')).toBeInTheDocument()
      expect(screen.getByText('Document Management System')).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /login/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /sign up/i })).toBeInTheDocument()
    })

    it('renders email and password inputs', () => {
      render(<Auth />)

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    })

    it('renders login button', () => {
      render(<Auth />)

      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
    })
  })

  describe('Tab Navigation', () => {
    it('switches to signup form when signup tab is clicked', async () => {
      const user = userEvent.setup()
      render(<Auth />)

      const signupTab = screen.getByRole('tab', { name: /sign up/i })
      await user.click(signupTab)

      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
    })
  })

  describe('Login Flow', () => {
    it('calls signInWithPassword with correct credentials', async () => {
      const user = userEvent.setup()
      const mockSignIn = vi.mocked(supabase.auth.signInWithPassword)
      mockSignIn.mockResolvedValueOnce({ data: { user: null, session: null }, error: null })

      render(<Auth />)

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /login/i }))

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        })
      })
    })

    it('shows loading state during login', async () => {
      const user = userEvent.setup()
      const mockSignIn = vi.mocked(supabase.auth.signInWithPassword)
      mockSignIn.mockImplementation(() => new Promise(() => {})) // Never resolves

      render(<Auth />)

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /login/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /logging in/i })).toBeInTheDocument()
      })
    })

    it('disables button during login', async () => {
      const user = userEvent.setup()
      const mockSignIn = vi.mocked(supabase.auth.signInWithPassword)
      mockSignIn.mockImplementation(() => new Promise(() => {}))

      render(<Auth />)

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /login/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /logging in/i })).toBeDisabled()
      })
    })
  })

  describe('Signup Flow', () => {
    it('calls signUp with correct credentials', async () => {
      const user = userEvent.setup()
      const mockSignUp = vi.mocked(supabase.auth.signUp)
      mockSignUp.mockResolvedValueOnce({ data: { user: null, session: null }, error: null })

      render(<Auth />)

      // Switch to signup tab
      await user.click(screen.getByRole('tab', { name: /sign up/i }))

      // Fill in the signup form (note: different IDs for signup form)
      const emailInput = screen.getByPlaceholderText('you@example.com')
      const passwordInput = screen.getByPlaceholderText('Create a password')

      await user.type(emailInput, 'newuser@example.com')
      await user.type(passwordInput, 'newpassword123')
      await user.click(screen.getByRole('button', { name: /sign up/i }))

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith({
          email: 'newuser@example.com',
          password: 'newpassword123',
        })
      })
    })
  })

  describe('Error Handling', () => {
    it('handles login error gracefully', async () => {
      const user = userEvent.setup()
      const mockSignIn = vi.mocked(supabase.auth.signInWithPassword)
      mockSignIn.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials', name: 'AuthError', status: 401 }
      })

      render(<Auth />)

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: /login/i }))

      await waitFor(() => {
        // Button should be re-enabled after error
        expect(screen.getByRole('button', { name: /login/i })).not.toBeDisabled()
      })
    })
  })

  describe('Session Check', () => {
    it('checks for existing session on mount', async () => {
      const mockGetSession = vi.mocked(supabase.auth.getSession)
      mockGetSession.mockResolvedValueOnce({
        data: { session: null },
        error: null
      })

      render(<Auth />)

      await waitFor(() => {
        expect(mockGetSession).toHaveBeenCalled()
      })
    })
  })
})
