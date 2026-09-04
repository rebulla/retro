import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider } from '../config/firebase';
import { onAuthStateChanged, signInWithRedirect, getRedirectResult, signOut, updateProfile } from 'firebase/auth';
import LoadingScreen from '../components/common/LoadingScreen';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle redirect result when returning from Google login
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        localStorage.setItem('lastGoogleUser', JSON.stringify({
          name: result.user.displayName,
          email: result.user.email,
          avatar: result.user.photoURL
        }));
      }
    }).catch((error) => {
      if (error.code !== 'auth/no-auth-event') {
        console.error('Redirect result error:', error);
      }
    });

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName,
          email: firebaseUser.email,
          avatar: firebaseUser.photoURL,
          role: 'admin'
        });
        localStorage.removeItem('guestUser');
      } else {
        const savedGuest = localStorage.getItem('guestUser');
        if (savedGuest) {
          setUser(JSON.parse(savedGuest));
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async (forcePrompt = false, emailHint = null) => {
    try {
      if (forcePrompt) {
        googleProvider.setCustomParameters({ prompt: 'select_account' });
      } else if (emailHint) {
        googleProvider.setCustomParameters({ login_hint: emailHint });
      } else {
        googleProvider.setCustomParameters({});
      }
      await signInWithRedirect(auth, googleProvider);
    } catch (error) {
      console.error("Erro no login com Google:", error);
    }
  };

  const loginAsGuest = (name) => {
    const guestUser = {
      id: `guest-${Date.now()}`,
      name: name,
      email: null,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`,
      role: 'guest'
    };
    setUser(guestUser);
    localStorage.setItem('guestUser', JSON.stringify(guestUser));
  };

  const updateUserName = async (newName) => {
    if (user?.role === 'guest') {
      const updatedGuest = { ...user, name: newName };
      setUser(updatedGuest);
      localStorage.setItem('guestUser', JSON.stringify(updatedGuest));
    } else if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: newName });
      setUser({ ...user, name: newName });
    }
  };

  const logout = async () => {
    try {
      if (user?.role === 'guest') {
        setUser(null);
        localStorage.removeItem('guestUser');
      } else {
        await signOut(auth);
      }
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const value = {
    user,
    loading,
    loginWithGoogle,
    loginAsGuest,
    logout,
    updateUserName
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <LoadingScreen /> : children}
    </AuthContext.Provider>
  );
};
