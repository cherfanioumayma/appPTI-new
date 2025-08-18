import * as Location from 'expo-location';
import { GPS_CONFIG } from '../utils/constants';

class LocationService {
  constructor() {
    this.locationSubscription = null;
    this.currentLocation = null;
    this.isTracking = false;
    this.onLocationUpdate = null;
  }

  // Demander les permissions de localisation
  async requestPermissions() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission de localisation refusée');
      }
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error);
      return { success: false, error: error.message };
    }
  }

  // Obtenir la position actuelle
  async getCurrentLocation() {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10
      });

      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
        speed: location.coords.speed,
        heading: location.coords.heading
      };

      return { success: true, location: this.currentLocation };
    } catch (error) {
      console.error('Erreur lors de la récupération de la position:', error);
      return { success: false, error: error.message };
    }
  }

  // Démarrer le suivi en temps réel
  async startTracking(callback) {
    try {
      // Vérifier les permissions
      const permissionResult = await this.requestPermissions();
      if (!permissionResult.success) {
        return permissionResult;
      }

      // Configurer les options de localisation
      const locationOptions = {
        accuracy: Location.Accuracy.High,
        timeInterval: GPS_CONFIG.UPDATE_INTERVAL,
        distanceInterval: GPS_CONFIG.DISTANCE_FILTER,
        foregroundService: {
          notificationTitle: 'Suivi PTI actif',
          notificationBody: 'Votre position est suivie pour votre sécurité',
          notificationColor: '#2196F3'
        }
      };

      // Démarrer le suivi
      this.locationSubscription = await Location.watchPositionAsync(
        locationOptions,
        (location) => {
          this.currentLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp,
            speed: location.coords.speed,
            heading: location.coords.heading
          };

          // Appeler le callback avec la nouvelle position
          if (callback) {
            callback(this.currentLocation);
          }

          // Appeler le callback global si défini
          if (this.onLocationUpdate) {
            this.onLocationUpdate(this.currentLocation);
          }
        }
      );

      this.isTracking = true;
      return { success: true };
    } catch (error) {
      console.error('Erreur lors du démarrage du suivi:', error);
      return { success: false, error: error.message };
    }
  }

  // Arrêter le suivi
  stopTracking() {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
      this.isTracking = false;
    }
  }

  // Obtenir la dernière position connue
  getLastKnownLocation() {
    return this.currentLocation;
  }

  // Vérifier si le suivi est actif
  isLocationTracking() {
    return this.isTracking;
  }

  // Définir un callback global pour les mises à jour de position
  setLocationUpdateCallback(callback) {
    this.onLocationUpdate = callback;
  }

  // Calculer la distance entre deux points (formule de Haversine)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance en km
    return distance;
  }

  // Convertir les degrés en radians
  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  // Détecter l'immobilité (si l'utilisateur ne bouge pas depuis X minutes)
  detectImmobility(thresholdMinutes = 5) {
    if (!this.currentLocation) return false;
    
    const now = Date.now();
    const timeDiff = now - this.currentLocation.timestamp;
    const minutesDiff = timeDiff / (1000 * 60);
    
    return minutesDiff > thresholdMinutes;
  }

  // Obtenir l'adresse à partir des coordonnées (géocodage inverse)
  async getAddressFromCoordinates(latitude, longitude) {
    try {
      const address = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });

      if (address.length > 0) {
        const location = address[0];
        return {
          street: location.street,
          city: location.city,
          region: location.region,
          country: location.country,
          postalCode: location.postalCode,
          fullAddress: `${location.street}, ${location.city}, ${location.region}`
        };
      }
      
      return null;
    } catch (error) {
      console.error('Erreur lors du géocodage inverse:', error);
      return null;
    }
  }

  // Vérifier si la position est dans une zone géofencing
  isInGeofence(latitude, longitude, centerLat, centerLon, radiusKm) {
    const distance = this.calculateDistance(latitude, longitude, centerLat, centerLon);
    return distance <= radiusKm;
  }
}

// Instance singleton
const locationService = new LocationService();
export default locationService; 