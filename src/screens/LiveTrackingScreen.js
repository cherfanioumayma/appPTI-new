import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import locationService from '../services/locationService';
import { userService } from '../services/firebase';
import { COLORS } from '../utils/constants';

const { width, height } = Dimensions.get('window');

const LiveTrackingScreen = () => {
  const { userData, isSupervisor, getFullName } = useAuth();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [isTracking, setIsTracking] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 48.8566,
    longitude: 2.3522,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [trackingHistory, setTrackingHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (isSupervisor) {
      loadWorkers();
    } else {
      startLocationTracking();
    }
  }, [isSupervisor]);

  const loadWorkers = async () => {
    try {
      const result = await userService.getWorkers();
      if (result.success) {
        setWorkers(result.data);
        
        // Centrer la carte sur le premier travailleur ou position par défaut
        if (result.data.length > 0 && result.data[0].lastLocation) {
          setMapRegion({
            latitude: result.data[0].lastLocation.latitude,
            longitude: result.data[0].lastLocation.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des travailleurs:', error);
    }
  };

  const startLocationTracking = async () => {
    try {
      const result = await locationService.startTracking((location) => {
        setCurrentLocation(location);
        
        // Ajouter à l'historique de suivi
        setTrackingHistory(prev => [...prev, location]);
        
        // Centrer la carte sur la position actuelle
        setMapRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      });
      
      if (result.success) {
        setIsTracking(true);
      } else {
        Alert.alert(
          'Erreur GPS',
          'Impossible de démarrer le suivi GPS. Vérifiez les permissions.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Erreur lors du démarrage du suivi:', error);
    }
  };

  const stopLocationTracking = () => {
    locationService.stopTracking();
    setIsTracking(false);
  };

  const centerOnCurrentLocation = () => {
    if (currentLocation) {
      setMapRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const centerOnWorkers = () => {
    if (workers.length > 0) {
      const bounds = workers.reduce((acc, worker) => {
        if (worker.lastLocation) {
          acc.minLat = Math.min(acc.minLat, worker.lastLocation.latitude);
          acc.maxLat = Math.max(acc.maxLat, worker.lastLocation.latitude);
          acc.minLng = Math.min(acc.minLng, worker.lastLocation.longitude);
          acc.maxLng = Math.max(acc.maxLng, worker.lastLocation.longitude);
        }
        return acc;
      }, { minLat: 90, maxLat: -90, minLng: 180, maxLng: -180 });

      const centerLat = (bounds.minLat + bounds.maxLat) / 2;
      const centerLng = (bounds.minLng + bounds.maxLng) / 2;
      const deltaLat = Math.abs(bounds.maxLat - bounds.minLat) * 1.2;
      const deltaLng = Math.abs(bounds.maxLng - bounds.minLng) * 1.2;

      setMapRegion({
        latitude: centerLat,
        longitude: centerLng,
        latitudeDelta: Math.max(deltaLat, 0.01),
        longitudeDelta: Math.max(deltaLng, 0.01),
      });
    }
  };

  const clearTrackingHistory = () => {
    setTrackingHistory([]);
    setShowHistory(false);
  };

  const getWorkerStatusColor = (worker) => {
    if (!worker.isOnline) return COLORS.gray;
    if (worker.lastAlert && worker.lastAlert.status === 'pending') return COLORS.danger;
    return COLORS.success;
  };

  const formatDistance = (distance) => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  };

  const calculateTotalDistance = () => {
    if (trackingHistory.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < trackingHistory.length; i++) {
      const prev = trackingHistory[i - 1];
      const curr = trackingHistory[i];
      totalDistance += locationService.calculateDistance(
        prev.latitude, prev.longitude,
        curr.latitude, curr.longitude
      ) * 1000; // Convertir en mètres
    }
    
    return totalDistance;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {isSupervisor ? 'Suivi des travailleurs' : 'Suivi GPS'}
        </Text>
        <Text style={styles.subtitle}>
          {isSupervisor 
            ? `${workers.length} travailleur(s) en ligne`
            : isTracking ? 'Suivi actif' : 'Suivi inactif'
          }
        </Text>
      </View>

      {/* Carte */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={mapRegion}
          onRegionChangeComplete={setMapRegion}
          showsUserLocation={!isSupervisor}
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={true}
        >
          {/* Marqueur de position actuelle (pour les travailleurs) */}
          {!isSupervisor && currentLocation && (
            <Marker
              coordinate={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              }}
              title="Votre position"
              description={`Précision: ${currentLocation.accuracy?.toFixed(1)}m`}
            >
              <View style={styles.currentLocationMarker}>
                <Ionicons name="person" size={20} color={COLORS.white} />
              </View>
            </Marker>
          )}

          {/* Marqueurs des travailleurs (pour les superviseurs) */}
          {isSupervisor && workers.map((worker) => (
            <Marker
              key={worker.uid}
              coordinate={{
                latitude: worker.lastLocation?.latitude || 48.8566,
                longitude: worker.lastLocation?.longitude || 2.3522,
              }}
              title={worker.displayName}
              description={`Dernière mise à jour: ${worker.lastLocation ? new Date(worker.lastLocation.timestamp).toLocaleTimeString() : 'Inconnue'}`}
            >
              <View style={[
                styles.workerMarker,
                { backgroundColor: getWorkerStatusColor(worker) }
              ]}>
                <Ionicons name="person" size={16} color={COLORS.white} />
              </View>
            </Marker>
          ))}

          {/* Ligne de suivi (pour les travailleurs) */}
          {!isSupervisor && showHistory && trackingHistory.length > 1 && (
            <Polyline
              coordinates={trackingHistory.map(loc => ({
                latitude: loc.latitude,
                longitude: loc.longitude,
              }))}
              strokeColor={COLORS.primary}
              strokeWidth={3}
              lineDashPattern={[5, 5]}
            />
          )}
        </MapView>

        {/* Contrôles de la carte */}
        <View style={styles.mapControls}>
          <TouchableOpacity
            style={styles.mapButton}
            onPress={isSupervisor ? centerOnWorkers : centerOnCurrentLocation}
          >
            <Ionicons name="locate" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          
          {!isSupervisor && (
            <TouchableOpacity
              style={[styles.mapButton, showHistory && styles.mapButtonActive]}
              onPress={() => setShowHistory(!showHistory)}
            >
              <Ionicons name="analytics" size={24} color={showHistory ? COLORS.white : COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Informations de suivi */}
      {!isSupervisor && (
        <View style={styles.trackingInfo}>
          <View style={styles.infoCard}>
            <Ionicons name="location" size={20} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Position actuelle</Text>
              {currentLocation ? (
                <Text style={styles.infoValue}>
                  {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </Text>
              ) : (
                <Text style={styles.infoValue}>Acquisition...</Text>
              )}
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="speedometer" size={20} color={COLORS.secondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Distance parcourue</Text>
              <Text style={styles.infoValue}>
                {formatDistance(calculateTotalDistance())}
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="time" size={20} color={COLORS.info} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Points de suivi</Text>
              <Text style={styles.infoValue}>
                {trackingHistory.length}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {!isSupervisor && (
          <Button
            title={isTracking ? "Arrêter le suivi" : "Démarrer le suivi"}
            onPress={isTracking ? stopLocationTracking : startLocationTracking}
            variant={isTracking ? "danger" : "primary"}
            style={styles.actionButton}
          />
        )}
        
        {!isSupervisor && trackingHistory.length > 0 && (
          <Button
            title="Effacer l'historique"
            onPress={clearTrackingHistory}
            variant="outline"
            style={styles.actionButton}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  
  header: {
    padding: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  
  subtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },
  
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  
  map: {
    flex: 1,
  },
  
  currentLocationMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  
  workerMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  
  mapControls: {
    position: 'absolute',
    top: 20,
    right: 20,
    gap: 12,
  },
  
  mapButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  
  mapButtonActive: {
    backgroundColor: COLORS.primary,
  },
  
  trackingInfo: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  
  infoLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 2,
  },
  
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
  
  actions: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  
  actionButton: {
    marginBottom: 8,
  },
});

export default LiveTrackingScreen; 