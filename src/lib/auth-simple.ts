// Simple local storage-based auth for pure Lovable setup
export interface User {
  id: string;
  email: string;
  displayName?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  publisherName: string;
  setPublisherName: (name: string) => void;
}

// Simple in-memory user store (for demo purposes)
let currentUser: User | null = null;

export const signUp = async (email: string, password: string, displayName?: string): Promise<{ error: Error | null }> => {
  try {
    // Simple validation
    if (!email || !password) {
      return { error: new Error("Email and password are required") };
    }

    // Create user (in real app, this would call Lovable auth API)
    const user: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      displayName: displayName || email.split('@')[0]
    };

    currentUser = user;
    localStorage.setItem('lovable_user', JSON.stringify(user));
    
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};

export const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
  try {
    // Simple validation
    if (!email || !password) {
      return { error: new Error("Email and password are required") };
    }

    // Check if user exists in localStorage (in real app, this would call Lovable auth API)
    const storedUser = localStorage.getItem('lovable_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.email === email) {
        currentUser = user;
        return { error: null };
      }
    }

    // Create user if doesn't exist (demo behavior)
    const user: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      displayName: email.split('@')[0]
    };

    currentUser = user;
    localStorage.setItem('lovable_user', JSON.stringify(user));
    
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};

export const signOut = async (): Promise<void> => {
  currentUser = null;
  localStorage.removeItem('lovable_user');
};

export const getCurrentUser = (): User | null => {
  if (currentUser) return currentUser;
  
  try {
    const storedUser = localStorage.getItem('lovable_user');
    if (storedUser) {
      currentUser = JSON.parse(storedUser);
      return currentUser;
    }
  } catch (error) {
    console.error('Error parsing stored user:', error);
  }
  
  return null;
};

export const initializeAuth = (): User | null => {
  return getCurrentUser();
};
