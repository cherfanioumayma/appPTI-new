import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Vibration,
  Animated,
  Dimensions,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import locationService from '../services/locationService';
import audioService from '../services/audioService';
import { alertService } from '../services/firebase';
import { COLORS, ALERT_TYPES } from '../utils/constants';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const SOSButtonScreen = () => {
  const { userData, getFullName } = useAuth();
  const [isAlertActive, setIsAlertActive] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [recordingAudio, setRecordingAudio] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    // Démarrer le suivi GPS
    startLocationTracking();
    
    // Nettoyer lors du démontage
    return () => {
      locationService.stopTracking();
      audioService.cleanup();
    };
  }, []);

  const startLocationTracking = async () => {
    const result = await locationService.startTracking((location) => {
      setCurrentLocation(location);
    });
    
    if (!result.success) {
      Alert.alert(
        'Erreur GPS',
        'Impossible de démarrer le suivi GPS. Vérifiez les permissions.',
        [{ text: 'OK' }]
      );
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const handleSOSPress = async () => {
    if (isAlertActive) {
      // Annuler l'alerte
      Alert.alert(
        'Annuler l\'alerte',
        'Êtes-vous sûr de vouloir annuler l\'alerte SOS ?',
        [
          { text: 'Non', style: 'cancel' },
          { text: 'Oui', onPress: cancelAlert }
        ]
      );
    } else {
      // Déclencher l'alerte
      Alert.alert(
        'Alerte SOS',
        'Êtes-vous sûr de vouloir déclencher une alerte SOS ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Déclencher', onPress: triggerSOSAlert, style: 'destructive' }
        ]
      );
    }
  };

  const triggerSOSAlert = async () => {
    try {
      setIsAlertActive(true);
      startPulseAnimation();
      
      // Vibrer pour confirmer l'alerte
      Vibration.vibrate([0, 500, 200, 500]);
      
      // Obtenir la position actuelle
      const locationResult = await locationService.getCurrentLocation();
      if (!locationResult.success) {
        throw new Error('Impossible d\'obtenir la position GPS');
      }

      // Démarrer l'enregistrement audio
      setRecordingAudio(true);
      const audioResult = await audioService.recordAlertMessage(10000); // 10 secondes
      setRecordingAudio(false);

      // Créer l'alerte dans Firebase
      const alertData = {
        userId: userData.uid,
        userName: getFullName(),
        type: ALERT_TYPES.SOS,
        location: locationResult.location,
        audioUri: audioResult.success ? audioResult.uri : null,
        timestamp: new Date(),
        status: 'pending',
        description: 'Alerte SOS manuelle déclenchée'
      };

      const alertResult = await alertService.createAlert(alertData);
      
      if (alertResult.success) {
        Alert.alert(
          'Alerte envoyée',
          'Votre alerte SOS a été envoyée avec succès. Les secours ont été notifiés.',
          [{ text: 'OK' }]
        );
      } else {
        throw new Error('Erreur lors de l\'envoi de l\'alerte');
      }
      
    } catch (error) {
      console.error('Erreur lors du déclenchement de l\'alerte:', error);
      setIsAlertActive(false);
      stopPulseAnimation();
      setRecordingAudio(false);
      
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors du déclenchement de l\'alerte. Veuillez réessayer.',
        [{ text: 'OK' }]
      );
    }
  };

  const cancelAlert = () => {
    setIsAlertActive(false);
    stopPulseAnimation();
    setRecordingAudio(false);
    
    // Arrêter l'enregistrement audio si en cours
    if (audioService.isCurrentlyRecording()) {
      audioService.stopRecording();
    }
    
    Vibration.vibrate([0, 200]);
  };

  const getStatusText = () => {
    if (recordingAudio) {
      return 'Enregistrement audio en cours...';
    }
    if (isAlertActive) {
      return 'Alerte SOS active - Secours notifiés';
    }
    return 'Appuyez pour déclencher une alerte SOS';
  };

  const getStatusColor = () => {
    if (recordingAudio) {
      return COLORS.warning;
    }
    if (isAlertActive) {
      return COLORS.danger;
    }
    return COLORS.gray;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Bonjour, {getFullName()}</Text>
        <Text style={styles.statusText}>Statut: En ligne</Text>
      </View>

      {/* Bouton SOS principal */}
      <View style={styles.sosContainer}>
        <Animated.View
          style={[
            styles.sosButton,
            isAlertActive && styles.sosButtonActive,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          <TouchableOpacity
            style={styles.sosTouchable}
            onPress={handleSOSPress}
            activeOpacity={0.8}
          >
            <Ionicons
              name="warning"
              size={80}
              color={isAlertActive ? COLORS.white : COLORS.danger}
            />
            <Text style={[styles.sosText, isAlertActive && styles.sosTextActive]}>
              SOS
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={[styles.statusDescription, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </View>

      {/* Informations de localisation */}
      <View style={styles.locationInfo}>
        <View style={styles.locationHeader}>
          <Ionicons name="location" size={20} color={COLORS.primary} />
          <Text style={styles.locationTitle}>Position actuelle</Text>
        </View>
        
        {currentLocation ? (
          <View style={styles.locationDetails}>
            <Text style={styles.locationText}>
              Lat: {currentLocation.latitude.toFixed(6)}
            </Text>
            <Text style={styles.locationText}>
              Lng: {currentLocation.longitude.toFixed(6)}
            </Text>
            <Text style={styles.locationText}>
              Précision: {currentLocation.accuracy?.toFixed(1)}m
            </Text>
          </View>
        ) : (
          <Text style={styles.locationText}>Acquisition de la position...</Text>
        )}
      </View>

      {/* Actions rapides */}
      <View style={styles.quickActions}>
        <Button
          title="Historique"
          onPress={() => navigation.navigate('AlertHistory')}
          variant="outline"
          style={styles.actionButton}
        />
        <Button
          title="Paramètres"
          onPress={() => navigation.navigate('Settings')}
          variant="outline"
          style={styles.actionButton}
        />
      </View>

      {/* Indicateur d'enregistrement */}
      {recordingAudio && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>Enregistrement audio...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
    padding: 20,
  },
  
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  
  statusText: {
    fontSize: 16,
    color: COLORS.success,
    fontWeight: '500',
  },
  
  sosContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  
  sosButton: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: (width * 0.6) / 2,
    backgroundColor: COLORS.white,
    borderWidth: 4,
    borderColor: COLORS.danger,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.danger,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  sosButtonActive: {
    backgroundColor: COLORS.danger,
    borderColor: COLORS.white,
  },
  
  sosTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  sosText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.danger,
    marginTop: 8,
  },
  
  sosTextActive: {
    color: COLORS.white,
  },
  
  statusDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '500',
  },
  
  locationInfo: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  locationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
    marginLeft: 8,
  },
  
  locationDetails: {
    gap: 4,
  },
  
  locationText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  
  recordingIndicator: {
    position: 'absolute',
    top: 100,
    right: 20,
    backgroundColor: COLORS.warning,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
    marginRight: 6,
  },
  
  recordingText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '500',
  },
});

export default SOSButtonScreen;