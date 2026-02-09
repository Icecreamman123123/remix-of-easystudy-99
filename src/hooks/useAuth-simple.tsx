import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, signUp, signIn, signOut, initializeAuth, getCurrentUser } from "@/lib/auth-simple";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  publisherName: string;
  setPublisherName: (name: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [publisherName, setPublisherNameState] = useState<string>("");

  useEffect(() => {
    // Load publisher name from local storage
    const storedName = localStorage.getItem("publisherName");
    if (storedName) {
      setPublisherNameState(storedName);
    }

    // Initialize auth from localStorage
    const currentUser = initializeAuth();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const setPublisherName = (name: string) => {
    setPublisherNameState(name);
    localStorage.setItem("publisherName", name);
  };

  const handleSignUp = async (email: string, password: string, displayName?: string) => {
    const result = await signUp(email, password, displayName);
    if (!result.error) {
      setUser(getCurrentUser());
    }
    return result;
  };

  const handleSignIn = async (email: string, password: string) => {
    const result = await signIn(email, password);
    if (!result.error) {
      setUser(getCurrentUser());
    }
    return result;
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signUp: handleSignUp, 
      signIn: handleSignIn, 
      signOut: handleSignOut, 
      publisherName, 
      setPublisherName 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
