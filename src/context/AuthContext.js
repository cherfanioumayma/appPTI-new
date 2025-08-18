import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, userService } from '../services/firebase';
import { USER_ROLES } from '../utils/constants';

// Créer le contexte
const AuthContext = createContext();

// Hook personnalisé pour utiliser le contexte
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

// Provider du contexte
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialiser l'état d'authentification
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Écouter les changements d'état d'authentification Firebase
        const unsubscribe = authService.onAuthStateChange(async (firebaseUser) => {
          if (firebaseUser) {
            // Utilisateur connecté
            setUser(firebaseUser);
            setIsAuthenticated(true);
            
            // Récupérer les données utilisateur depuis Firestore
            const userDataResult = await userService.getUserData(firebaseUser.uid);
            if (userDataResult.success) {
              setUserData(userDataResult.data);
              // Sauvegarder les données utilisateur localement
              await AsyncStorage.setItem('userData', JSON.stringify(userDataResult.data));
            }
          } else {
            // Utilisateur déconnecté
            setUser(null);
            setUserData(null);
            setIsAuthenticated(false);
            // Nettoyer le stockage local
            await AsyncStorage.removeItem('userData');
          }
          setLoading(false);
        });

        // Nettoyer l'écouteur lors du démontage
        return () => unsubscribe();
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'authentification:', error);
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Fonction de connexion
  const login = async (email, password) => {
    try {
      setLoading(true);
      const result = await authService.login(email, password);
      
      if (result.success) {
        // Les données utilisateur seront récupérées par l'écouteur d'état
        return { success: true };
      } else {
        return result;
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Fonction d'inscription
  const register = async (email, password, userData) => {
    try {
      setLoading(true);
      const result = await authService.register(email, password, userData);
      
      if (result.success) {
        // Les données utilisateur seront récupérées par l'écouteur d'état
        return { success: true };
      } else {
        return result;
      }
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Fonction de déconnexion
  const logout = async () => {
    try {
      setLoading(true);
      const result = await authService.logout();
      
      if (result.success) {
        setUser(null);
        setUserData(null);
        setIsAuthenticated(false);
        await AsyncStorage.removeItem('userData');
      }
      
      return result;
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Fonction de mise à jour des données utilisateur
  const updateUserData = async (newUserData) => {
    try {
      if (!user) {
        return { success: false, error: 'Aucun utilisateur connecté' };
      }

      const result = await userService.updateUserData(user.uid, newUserData);
      
      if (result.success) {
        // Mettre à jour les données locales
        const updatedData = { ...userData, ...newUserData };
        setUserData(updatedData);
        await AsyncStorage.setItem('userData', JSON.stringify(updatedData));
      }
      
      return result;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des données utilisateur:', error);
      return { success: false, error: error.message };
    }
  };

  // Vérifier si l'utilisateur est un superviseur
  const isSupervisor = () => {
    return userData?.role === USER_ROLES.SUPERVISOR;
  };

  // Vérifier si l'utilisateur est un travailleur
  const isWorker = () => {
    return userData?.role === USER_ROLES.WORKER;
  };

  // Vérifier si l'utilisateur est un administrateur
  const isAdmin = () => {
    return userData?.role === USER_ROLES.ADMIN;
  };

  // Obtenir le nom complet de l'utilisateur
  const getFullName = () => {
    if (userData) {
      return userData.displayName || `${userData.firstName} ${userData.lastName}`;
    }
    return user?.displayName || user?.email || 'Utilisateur';
  };

  // Valeur du contexte
  const value = {
    user,
    userData,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUserData,
    isSupervisor,
    isWorker,
    isAdmin,
    getFullName
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 