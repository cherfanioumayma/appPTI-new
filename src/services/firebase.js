import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot 
} from 'firebase/firestore';
import { FIREBASE_CONFIG, USER_ROLES } from '../utils/constants';

// Initialiser Firebase
const app = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);

// Service d'authentification
export const authService = {
  // Inscription d'un nouvel utilisateur
  async register(email, password, userData) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Mettre à jour le profil utilisateur
      await updateProfile(user, {
        displayName: userData.displayName || userData.firstName + ' ' + userData.lastName
      });
      
      // Créer le document utilisateur dans Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: userData.displayName || userData.firstName + ' ' + userData.lastName,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role || USER_ROLES.WORKER,
        phone: userData.phone || '',
        emergencyContact: userData.emergencyContact || '',
        createdAt: new Date(),
        isActive: true
      });
      
      return { success: true, user };
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      return { success: false, error: error.message };
    }
  },

  // Connexion utilisateur
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      return { success: false, error: error.message };
    }
  },

  // Déconnexion
  async logout() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      return { success: false, error: error.message };
    }
  },

  // Écouter les changements d'état d'authentification
  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, callback);
  },

  // Obtenir l'utilisateur actuel
  getCurrentUser() {
    return auth.currentUser;
  }
};

// Service de gestion des utilisateurs
export const userService = {
  // Obtenir les données d'un utilisateur
  async getUserData(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return { success: true, data: userDoc.data() };
      } else {
        return { success: false, error: 'Utilisateur non trouvé' };
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des données utilisateur:', error);
      return { success: false, error: error.message };
    }
  },

  // Mettre à jour les données d'un utilisateur
  async updateUserData(uid, userData) {
    try {
      await updateDoc(doc(db, 'users', uid), {
        ...userData,
        updatedAt: new Date()
      });
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la mise à jour des données utilisateur:', error);
      return { success: false, error: error.message };
    }
  },

  // Obtenir tous les travailleurs (pour les superviseurs)
  async getWorkers() {
    try {
      const workersQuery = query(
        collection(db, 'users'),
        where('role', '==', USER_ROLES.WORKER),
        where('isActive', '==', true)
      );
      
      const snapshot = await getDocs(workersQuery);
      const workers = [];
      snapshot.forEach(doc => {
        workers.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, data: workers };
    } catch (error) {
      console.error('Erreur lors de la récupération des travailleurs:', error);
      return { success: false, error: error.message };
    }
  }
};

// Service de gestion des alertes
export const alertService = {
  // Créer une nouvelle alerte
  async createAlert(alertData) {
    try {
      const alertRef = await addDoc(collection(db, 'alerts'), {
        ...alertData,
        createdAt: new Date(),
        status: 'pending'
      });
      return { success: true, alertId: alertRef.id };
    } catch (error) {
      console.error('Erreur lors de la création de l\'alerte:', error);
      return { success: false, error: error.message };
    }
  },

  // Mettre à jour le statut d'une alerte
  async updateAlertStatus(alertId, status) {
    try {
      await updateDoc(doc(db, 'alerts', alertId), {
        status,
        updatedAt: new Date()
      });
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      return { success: false, error: error.message };
    }
  },

  // Écouter les alertes en temps réel
  onAlertsChange(callback) {
    const alertsQuery = query(
      collection(db, 'alerts'),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(alertsQuery, (snapshot) => {
      const alerts = [];
      snapshot.forEach(doc => {
        alerts.push({ id: doc.id, ...doc.data() });
      });
      callback(alerts);
    });
  },

  // Obtenir les alertes d'un utilisateur
  async getUserAlerts(userId) {
    try {
      const alertsQuery = query(
        collection(db, 'alerts'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(alertsQuery);
      const alerts = [];
      snapshot.forEach(doc => {
        alerts.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, data: alerts };
    } catch (error) {
      console.error('Erreur lors de la récupération des alertes:', error);
      return { success: false, error: error.message };
    }
  }
};

export { auth, db }; 