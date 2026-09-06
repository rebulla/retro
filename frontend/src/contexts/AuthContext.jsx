import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider } from '../config/firebase';
import { onAuthStateChanged, signInWithPopup, signOut, updateProfile } from 'firebase/auth';
import LoadingScreen from '../components/common/LoadingScreen';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSquad, setActiveSquad] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const refreshUser = async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return;
    try {
      const response = await fetch(`${API_URL}/auth/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          avatar: firebaseUser.photoURL
        })
      });
      
      if (response.ok) {
        const dbUser = await response.json();
        
        const mappedUser = {
          id: firebaseUser.uid,
          dbId: dbUser._id,
          name: dbUser.name,
          email: dbUser.email,
          avatar: dbUser.avatar,
          role: dbUser.globalRole,
          status: dbUser.status,
          squads: dbUser.squads || []
        };
        
        setUser(mappedUser);
        
        if (dbUser.squads && dbUser.squads.length > 0) {
          const savedSquadId = localStorage.getItem('activeSquadId');
          const foundSquad = dbUser.squads.find(s => s.squad._id === savedSquadId);
          if (foundSquad) {
            setActiveSquad(foundSquad.squad);
          } else {
            setActiveSquad(dbUser.squads[0].squad);
            localStorage.setItem('activeSquadId', dbUser.squads[0].squad._id);
          }
        }
      }
    } catch (error) {
      console.error("Erro ao sincronizar usuário com backend:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await refreshUser();
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
      const result = await signInWithPopup(auth, googleProvider);
      if (result?.user) {
        localStorage.setItem('lastGoogleUser', JSON.stringify({
          name: result.user.displayName,
          email: result.user.email,
          avatar: result.user.photoURL
        }));
      }
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
      setActiveSquad(null);
      localStorage.removeItem('activeSquadId');
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const value = {
    user,
    loading,
    activeSquad,
    setActiveSquad: (squad) => {
      setActiveSquad(squad);
      if (squad) localStorage.setItem('activeSquadId', squad._id);
      else localStorage.removeItem('activeSquadId');
    },
    loginWithGoogle,
    loginAsGuest,
    logout,
    updateUserName,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <LoadingScreen /> : children}
    </AuthContext.Provider>
  );
};
