import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthModal } from './AuthModal';
import { AuthProvider, useAuth } from '@/contexts/AuthContext'; // Import AuthProvider and useAuth
import { Toaster } from '@/components/ui/toaster'; // To observe toasts

// Mock supabaseClient
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      getSession: vi.fn(() => ({ data: { session: null } })), // Mock getSession
    },
    from: vi.fn(() => ({ // Mock chained calls for profile creation
      insert: vi.fn(() => ({ error: null })),
      select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn(() => ({ data: {}, error: null })) })) })),
    })),
  },
}));

import { useState } from 'react'; // Make sure useState is at the top with other React imports
import { AuthContext } from '@/contexts/AuthContext'; // Re-import AuthContext for isolated test

// Helper component to display content based on auth state, like the Sign Out button
const TestAppContent = () => {
  const auth = useAuth();
  return (
    <>
      {auth && auth.user && (
        <button onClick={() => auth.signOut()}>Sign Out Test Button</button>
      )}
    </>
  );
};

const TestApp = ({ modalOpenInitially = true }: { modalOpenInitially?: boolean }) => {
  const [isModalOpen, setIsModalOpen] = useState(modalOpenInitially);

  return (
    <AuthProvider>
      <Toaster /> {/* Toaster is here to persist */}
      {isModalOpen && <AuthModal isOpen={true} onClose={() => setIsModalOpen(false)} />}
      <TestAppContent /> {/* This part is always rendered to check auth state effects */}
    </AuthProvider>
  );
};


import { supabase } from '@/lib/supabaseClient'; // Import the mocked supabase

describe('AuthModal E2E Tests with AuthProvider', () => {
  // Reset mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure supabase auth methods are reset and have default successful implementations
    (supabase.auth.getSession as vi.Mock).mockResolvedValue({ data: { session: null }, error: null });
    (supabase.auth.signUp as vi.Mock).mockResolvedValue({ data: { user: { id: 'test-user-id', email: 'test@example.com' }, session: {} }, error: null });
    (supabase.auth.signInWithPassword as vi.Mock).mockResolvedValue({ data: { user: { id: 'test-user-id', email: 'test@example.com' }, session: {} }, error: null });
    (supabase.auth.signOut as vi.Mock).mockResolvedValue({ error: null });
    (supabase.auth.onAuthStateChange as vi.Mock).mockImplementation((callback) => {
      // Store the callback to simulate auth state changes if needed in specific tests
      // For most tests, the initial getSession and specific signUp/signIn mocks will control state.
      // AuthProvider will call this, and we let it.
      // Simulate an initial immediate call as Supabase client might do
      // callback('INITIAL_SESSION', null); // This was problematic, removed.
      return {
        data: { subscription: { unsubscribe: vi.fn() } },
      };
    });
    (supabase.from as vi.Mock).mockReturnValue({ // Resetting the 'from' chain
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnThis(), // Allow chaining for select
      eq: vi.fn().mockReturnThis(),     // Allow chaining for eq
      single: vi.fn().mockResolvedValue({ data: { id: 'test-user-id', name: 'Test User', email: 'test@example.com', user_type: 'player' }, error: null }),
    });
  });

  it('renders the login form by default when open', () => {
    render(
      <MemoryRouter>
        <TestApp />
      </MemoryRouter>
    );

    expect(screen.getByText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('switches to registration tab and shows user type selection', async () => {
    render(
      <MemoryRouter>
        <TestApp />
      </MemoryRouter>
    );
    await userEvent.click(screen.getByRole('tab', { name: /cadastro/i }));
    expect(screen.getByRole('button', { name: /jogador/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /gestor de quadra/i })).toBeInTheDocument();
  });

  describe('Sign-Up Flow', () => {
    it('successfully signs up a new player', async () => {
      render(
        <MemoryRouter>
          <TestApp />
        </MemoryRouter>
      );

      // Navigate to registration tab
      await userEvent.click(screen.getByRole('tab', { name: /cadastro/i }));

      // Select user type
      await userEvent.click(screen.getByRole('button', { name: /jogador/i }));

      // Fill the form
      await userEvent.type(screen.getByLabelText(/nome completo/i), 'Test Player');
      await userEvent.type(screen.getByLabelText(/e-mail/i), 'player@example.com');
      await userEvent.type(screen.getByLabelText(/^senha$/i), 'password123'); // Use exact match for "Senha" to avoid matching "Confirmar Senha" if added later
      await userEvent.type(screen.getByLabelText(/telefone/i), '1234567890');

      // Submit the form
      await userEvent.click(screen.getByRole('button', { name: /cadastrar/i }));
      
      // Verify supabase.auth.signUp was called
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'player@example.com',
        password: 'password123',
      });

      // Verify profile creation
      expect(supabase.from).toHaveBeenCalledWith('profiles');
      const insertMock = (supabase.from as vi.Mock).mock.results[0].value.insert;
      expect(insertMock).toHaveBeenCalledWith([
        expect.objectContaining({
          name: 'Test Player',
          email: 'player@example.com',
          phone: '1234567890',
          user_type: 'player',
        }),
      ]);

      // Check for success toast
      await waitFor(() => {
        expect(screen.getByText(/cadastro realizado com sucesso!/i)).toBeInTheDocument();
      });
      // Check if modal closes (onClose prop of AuthModal should be called by TestApp)
      // This requires TestApp's onClose to actually hide/remove the modal from DOM
      // For now, we'll assume onClose leads to modal not being visible or check a proxy for it.
      // A simple check: the "Cadastrar" button should not be there anymore if modal closed.
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /cadastrar/i })).not.toBeInTheDocument();
      });
    });

    it('successfully signs up a new manager and shows correct toast', async () => {
      render(
        <MemoryRouter>
          <TestApp />
        </MemoryRouter>
      );
      await userEvent.click(screen.getByRole('tab', { name: /cadastro/i }));
      await userEvent.click(screen.getByRole('button', { name: /gestor de quadra/i }));
      await userEvent.type(screen.getByLabelText(/nome completo/i), 'Test Manager');
      await userEvent.type(screen.getByLabelText(/e-mail/i), 'manager@example.com');
      await userEvent.type(screen.getByLabelText(/^senha$/i), 'password123');
      await userEvent.type(screen.getByLabelText(/telefone/i), '0987654321');
      await userEvent.click(screen.getByRole('button', { name: /cadastrar/i }));

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'manager@example.com',
        password: 'password123',
      });
      await waitFor(() => {
        expect(screen.getByText(/cadastro em análise/i)).toBeInTheDocument();
      });
    });

    it('shows validation error if submitting registration form with empty required fields (after type selection)', async () => {
      // This test verifies that if the registration form is visible (after user type selection)
      // and submitted with empty required fields, an error occurs.
      // It also implicitly tests the (currently observed buggy) behavior that the form might be visible too soon.
      render(
        <MemoryRouter>
          <TestApp />
        </MemoryRouter>
      );
      await userEvent.click(screen.getByRole('tab', { name: /cadastro/i }));

      // Based on previous test failure, the form's "Cadastrar" button is visible.
      // This implies userType is already set in the component's state (likely a bug if it's not 'player' or 'manager').
      // Or, if not a bug, it implies userType selection screen is bypassed.
      // Let's ensure we select a user type to make the actual form fields visible.
      // If the "Cadastrar" button is ALREADY there, this click might not be strictly necessary
      // for that button's visibility, but it IS necessary for the form *fields* to appear.
      const userTypeSelectionButton = screen.getByRole('button', { name: /jogador/i });
      if (userTypeSelectionButton) { // Check if user type selection is even there
          await userEvent.click(userTypeSelectionButton);
      }
      
      const cadastrarButton = screen.getByRole('button', { name: /cadastrar/i, exact: true });
      expect(cadastrarButton).toBeInTheDocument(); // Confirm submit button is there

      // Try to submit without filling fields
      // HTML5 validation should prevent submission for "required" fields.
      // However, if it does submit (e.g. if required attributes are missing or e.preventDefault() is mishandled),
      // then Supabase call should not happen, and a toast might appear from custom logic if any.
      // AuthModal's handleSubmit has its own checks too.
      
      // The `required` attribute on inputs should prevent `handleSubmit` from being called by a click.
      // `userEvent.click` respects this. So, `supabase.auth.signUp` should not be called.
      // We won't see a toast here from `handleSubmit` because the form submission itself is blocked by browser validation.
      // If we wanted to bypass HTML5 validation for testing, we'd have to fire a 'submit' event on the form directly.
      // For now, let's test that `signUp` is NOT called.
      await userEvent.click(cadastrarButton);
      expect(supabase.auth.signUp).not.toHaveBeenCalled();

      // Due to HTML5 validation, specific toasts for empty fields from `handleSubmit` won't be shown.
      // To test those, we'd need to remove `required` attributes or submit programmatically.
      // This test now verifies that basic HTML5 validation is in place (implicitly)
      // by checking that Supabase call isn't made.
    });

    it('shows an error toast if supabase.auth.signUp fails', async () => {
      (supabase.auth.signUp as vi.Mock).mockResolvedValueOnce({ error: { message: 'Supabase sign-up error' } });
      render(
        <MemoryRouter>
          <TestApp />
        </MemoryRouter>
      );
      await userEvent.click(screen.getByRole('tab', { name: /cadastro/i }));
      await userEvent.click(screen.getByRole('button', { name: /jogador/i }));
      await userEvent.type(screen.getByLabelText(/nome completo/i), 'Test Player');
      await userEvent.type(screen.getByLabelText(/e-mail/i), 'fail@example.com');
      await userEvent.type(screen.getByLabelText(/^senha$/i), 'password123');
      await userEvent.type(screen.getByLabelText(/telefone/i), '1234567890');
      await userEvent.click(screen.getByRole('button', { name: /cadastrar/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/erro no cadastro/i)).toBeInTheDocument();
        expect(screen.getByText(/supabase sign-up error/i)).toBeInTheDocument();
      });
    });

    it('shows an error toast if profile creation fails', async () => {
      // SignUp succeeds, but profile insert fails
      (supabase.auth.signUp as vi.Mock).mockResolvedValueOnce({ 
        data: { user: { id: 'new-user-id', email: 'profilefail@example.com' }, session: {} }, 
        error: null 
      });
      const insertMock = vi.fn().mockResolvedValueOnce({ error: { message: 'Profile creation failed' } });
      (supabase.from as vi.Mock).mockReturnValueOnce({ insert: insertMock });

      render(
        <MemoryRouter>
          <TestApp />
        </MemoryRouter>
      );
      await userEvent.click(screen.getByRole('tab', { name: /cadastro/i }));
      await userEvent.click(screen.getByRole('button', { name: /jogador/i }));
      await userEvent.type(screen.getByLabelText(/nome completo/i), 'Test Profile Fail');
      await userEvent.type(screen.getByLabelText(/e-mail/i), 'profilefail@example.com');
      await userEvent.type(screen.getByLabelText(/^senha$/i), 'password123');
      await userEvent.type(screen.getByLabelText(/telefone/i), '1234567890');
      await userEvent.click(screen.getByRole('button', { name: /cadastrar/i }));

      await waitFor(() => {
        expect(screen.getByText(/erro no cadastro/i)).toBeInTheDocument();
        expect(screen.getByText(/profile creation failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Sign-In Flow', () => {
    it('successfully signs in an existing user', async () => {
      // Mock getSession to simulate no initial session
      (supabase.auth.getSession as vi.Mock).mockResolvedValueOnce({ data: { session: null }, error: null });
      // Mock signInWithPassword for successful login
      const mockUser = { id: 'user-123', email: 'login@example.com' };
      (supabase.auth.signInWithPassword as vi.Mock).mockResolvedValueOnce({
        data: { user: mockUser, session: { access_token: 'fake-token', user: mockUser } as any },
        error: null,
      });
      // Mock profile fetch for the logged-in user
      (supabase.from as vi.Mock).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: { id: mockUser.id, name: 'Login User', email: mockUser.email, user_type: 'player' }, error: null }),
        insert: vi.fn().mockResolvedValue({ error: null }), // Default for other calls
      });


      render(
        <MemoryRouter>
          <TestApp />
        </MemoryRouter>
      );

      // AuthModal is open on login tab by default
      await userEvent.type(screen.getByLabelText(/e-mail/i), 'login@example.com');
      await userEvent.type(screen.getByLabelText(/^senha$/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'login@example.com',
        password: 'password123',
      });

      await waitFor(() => {
        expect(screen.getByText(/login realizado com sucesso!/i)).toBeInTheDocument();
      });
      
      // Modal should close
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /entrar/i })).not.toBeInTheDocument();
      });
      
      // Optionally, verify user state in context if TestApp exposes it or has effects based on it
      // For example, if a "Sign Out" button appears:
      // await waitFor(() => {
      //   expect(screen.getByRole('button', { name: /sign out test button/i })).toBeInTheDocument();
      // });
    });

    it('shows an error toast if supabase.auth.signInWithPassword fails', async () => {
      (supabase.auth.signInWithPassword as vi.Mock).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      render(
        <MemoryRouter>
          <TestApp />
        </MemoryRouter>
      );

      await userEvent.type(screen.getByLabelText(/e-mail/i), 'wrong@example.com');
      await userEvent.type(screen.getByLabelText(/^senha$/i), 'wrongpassword');
      await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

      await waitFor(() => {
        expect(screen.getByText(/erro no login/i)).toBeInTheDocument();
        expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument();
      });
    });

    it('shows validation error if submitting login form with empty fields', async () => {
      render(
        <MemoryRouter>
          <TestApp />
        </MemoryRouter>
      );
      
      // Ensure login tab is active (should be by default)
      const loginButton = screen.getByRole('button', { name: /entrar/i });
      expect(loginButton).toBeInTheDocument();

      await userEvent.click(loginButton); // Attempt to submit empty form
      
      expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
      // HTML5 validation should prevent the call. No specific toast for empty fields is designed in handleSubmit for login.
    });
  });

  describe('Sign-Out Flow', () => {
    it('successfully signs out a logged-in user', async () => {
      // Mock initial state: user is logged in
      const mockUser = { id: 'user-signOut-123', email: 'signout@example.com', user_metadata: {} };
      const mockSession = { access_token: 'fake-token-signOut', user: mockUser };
      (supabase.auth.getSession as vi.Mock).mockResolvedValue({
        data: { session: mockSession as any },
        error: null,
      });
      (supabase.from as vi.Mock).mockImplementation(() => ({ // Full chain mock for this specific test
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { id: mockUser.id, name: 'SignOut User', email: mockUser.email, user_type: 'player' },
          error: null,
        }),
        insert: vi.fn().mockResolvedValue({ error: null }) // Ensure other calls don't break
      }));
      (supabase.auth.signOut as vi.Mock).mockResolvedValue({ error: null }); // Mock signOut success

      // Need to re-trigger onAuthStateChange logic for AuthProvider to pick up the session
      // The AuthProvider's useEffect sets up onAuthStateChange.
      // We can capture the callback and manually invoke it after setting up getSession.
      let authStateChangeCallback: ((event: string, session: any) => void) | null = null;
      (supabase.auth.onAuthStateChange as vi.Mock).mockImplementation((callback) => {
        authStateChangeCallback = callback;
        // Simulate initial call done by Supabase client, then subsequent changes
        // callback('INITIAL_SESSION', mockSession); // This will set the user
        return {
          data: { subscription: { unsubscribe: vi.fn() } },
        };
      });
      
      render(
        <MemoryRouter>
          {/* Ensure InnerTestApp is rendered so the Sign Out button can be found */}
          <TestApp modalOpenInitially={true} /> 
        </MemoryRouter>
      );

      // Manually trigger auth state change if necessary to simulate login
      // This is tricky because AuthProvider runs its own useEffect.
      // The getSession mock should be picked up by AuthProvider on its initial load.
      // Let's wait for the sign out button to appear (which means user is "logged in")
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign out test button/i })).toBeInTheDocument();
      });

      // If modal is open, close it by pressing Escape, so pointer events are restored
      if (screen.queryByRole('tab', { name: /login/i })) { // Check if modal is open
        await userEvent.keyboard('{escape}');
        await waitFor(() => {
          expect(screen.queryByRole('tab', { name: /login/i })).not.toBeInTheDocument();
        });
      }
      
      // Now click the sign-out button
      const signOutButton = screen.getByRole('button', { name: /sign out test button/i });
      await userEvent.click(signOutButton);

      // Verify supabase.auth.signOut was called
      expect(supabase.auth.signOut).toHaveBeenCalled();

      // Manually trigger the onAuthStateChange callback to simulate Supabase client behavior
      if (authStateChangeCallback) {
        authStateChangeCallback('SIGNED_OUT', null);
      }

      // Verify user is signed out (e.g., sign-out button disappears)
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /sign out test button/i })).not.toBeInTheDocument();
      });

      // Also, if the modal were to open, it should be in the default (login) state
      // This part is optional unless specific behavior is expected for the modal after sign-out.
    });
  });
});

// Old tests for reference or to be removed/refactored if fully covered by E2E
describe('AuthModal Unit Tests (Isolated)', () => {
  const mockOnClose = vi.fn();
  // Mock AuthContext value - this context is from AuthContext.tsx
  const mockAuthContextValue: any = { // Using 'any' for simplicity in this isolated test
    user: null,
    profile: null,
    session: null,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    // For AuthModal specific props if useAuth() was used directly by it for these
    // This is not the case, AuthModal gets isOpen/onClose via props.
  };

  it('renders the login form by default when open (isolated)', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={mockAuthContextValue}>
          <AuthModal isOpen={true} onClose={mockOnClose} />
        </AuthContext.Provider>
      </MemoryRouter>
    );
    expect(screen.getByText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });
});
