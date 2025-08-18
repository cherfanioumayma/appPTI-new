import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import { alertService, userService } from '../services/firebase';
import { COLORS, ALERT_STATUS, ALERT_TYPES } from '../utils/constants';

const DashboardScreen = ({ navigation }) => {
  const { userData, getFullName } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 48.8566,
    longitude: 2.3522,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    loadDashboardData();
    setupRealtimeListeners();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Charger les travailleurs
      const workersResult = await userService.getWorkers();
      if (workersResult.success) {
        setWorkers(workersResult.data);
      }

      // Charger les alertes récentes
      const alertsResult = await alertService.getUserAlerts(userData.uid);
      if (alertsResult.success) {
        setAlerts(alertsResult.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const setupRealtimeListeners = () => {
    // Écouter les nouvelles alertes en temps réel
    const unsubscribe = alertService.onAlertsChange((newAlerts) => {
      setAlerts(newAlerts);
      
      // Notifier si nouvelle alerte critique
      const criticalAlerts = newAlerts.filter(
        alert => alert.status === ALERT_STATUS.PENDING && 
        (alert.type === ALERT_TYPES.SOS || alert.type === ALERT_TYPES.FALL)
      );
      
      if (criticalAlerts.length > 0) {
        Alert.alert(
          '🚨 Nouvelle alerte critique',
          `${criticalAlerts.length} nouvelle(s) alerte(s) nécessite(nt) votre attention immédiate.`,
          [{ text: 'Voir', onPress: () => setSelectedAlert(criticalAlerts[0]) }]
        );
      }
    });

    return unsubscribe;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleAlertPress = (alert) => {
    setSelectedAlert(alert);
  };

  const handleAlertAction = async (alertId, action) => {
    try {
      let newStatus;
      switch (action) {
        case 'acknowledge':
          newStatus = ALERT_STATUS.ACKNOWLEDGED;
          break;
        case 'resolve':
          newStatus = ALERT_STATUS.RESOLVED;
          break;
        case 'cancel':
          newStatus = ALERT_STATUS.CANCELLED;
          break;
        default:
          return;
      }

      const result = await alertService.updateAlertStatus(alertId, newStatus);
      if (result.success) {
        Alert.alert('Succès', 'Statut de l\'alerte mis à jour');
        setSelectedAlert(null);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut');
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case ALERT_TYPES.SOS:
        return 'warning';
      case ALERT_TYPES.FALL:
        return 'alert-circle';
      case ALERT_TYPES.IMMOBILITY:
        return 'time';
      default:
        return 'notifications';
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case ALERT_TYPES.SOS:
        return COLORS.danger;
      case ALERT_TYPES.FALL:
        return COLORS.warning;
      case ALERT_TYPES.IMMOBILITY:
        return COLORS.info;
      default:
        return COLORS.gray;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case ALERT_STATUS.PENDING:
        return COLORS.danger;
      case ALERT_STATUS.ACKNOWLEDGED:
        return COLORS.warning;
      case ALERT_STATUS.RESOLVED:
        return COLORS.success;
      case ALERT_STATUS.CANCELLED:
        return COLORS.gray;
      default:
        return COLORS.gray;
    }
  };

  const formatTime = (timestamp) => {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Tableau de bord</Text>
          <Text style={styles.subtitle}>Superviseur: {getFullName()}</Text>
        </View>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Statistiques */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color={COLORS.primary} />
            <Text style={styles.statNumber}>{workers.length}</Text>
            <Text style={styles.statLabel}>Travailleurs</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="warning" size={24} color={COLORS.danger} />
            <Text style={styles.statNumber}>
              {alerts.filter(a => a.status === ALERT_STATUS.PENDING).length}
            </Text>
            <Text style={styles.statLabel}>Alertes actives</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            <Text style={styles.statNumber}>
              {alerts.filter(a => a.status === ALERT_STATUS.RESOLVED).length}
            </Text>
            <Text style={styles.statLabel}>Résolues</Text>
          </View>
        </View>

        {/* Carte */}
        <View style={styles.mapContainer}>
          <Text style={styles.sectionTitle}>Localisation des travailleurs</Text>
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            region={mapRegion}
            onRegionChangeComplete={setMapRegion}
          >
            {workers.map((worker) => (
              <Marker
                key={worker.uid}
                coordinate={{
                  latitude: worker.lastLocation?.latitude || 48.8566,
                  longitude: worker.lastLocation?.longitude || 2.3522,
                }}
                title={worker.displayName}
                description={`Statut: ${worker.isOnline ? 'En ligne' : 'Hors ligne'}`}
              >
                <View style={[
                  styles.marker,
                  { backgroundColor: worker.isOnline ? COLORS.success : COLORS.gray }
                ]}>
                  <Ionicons name="person" size={16} color={COLORS.white} />
                </View>
              </Marker>
            ))}
            
            {alerts.filter(a => a.status === ALERT_STATUS.PENDING).map((alert) => (
              <Marker
                key={alert.id}
                coordinate={{
                  latitude: alert.location?.latitude || 48.8566,
                  longitude: alert.location?.longitude || 2.3522,
                }}
                title={`Alerte ${alert.type}`}
                description={alert.userName}
                onPress={() => handleAlertPress(alert)}
              >
                <View style={[
                  styles.alertMarker,
                  { backgroundColor: getAlertColor(alert.type) }
                ]}>
                  <Ionicons 
                    name={getAlertIcon(alert.type)} 
                    size={16} 
                    color={COLORS.white} 
                  />
                </View>
              </Marker>
            ))}
          </MapView>
        </View>

        {/* Alertes récentes */}
        <View style={styles.alertsContainer}>
          <View style={styles.alertsHeader}>
            <Text style={styles.sectionTitle}>Alertes récentes</Text>
            <Button
              title="Voir tout"
              onPress={() => navigation.navigate('AlertHistory')}
              variant="outline"
              size="small"
            />
          </View>
          
          {alerts.slice(0, 5).map((alert) => (
            <TouchableOpacity
              key={alert.id}
              style={styles.alertCard}
              onPress={() => handleAlertPress(alert)}
            >
              <View style={styles.alertHeader}>
                <View style={styles.alertIconContainer}>
                  <Ionicons 
                    name={getAlertIcon(alert.type)} 
                    size={20} 
                    color={getAlertColor(alert.type)} 
                  />
                </View>
                <View style={styles.alertInfo}>
                  <Text style={styles.alertTitle}>
                    {alert.userName} - {alert.type.toUpperCase()}
                  </Text>
                  <Text style={styles.alertTime}>
                    {formatTime(alert.timestamp)}
                  </Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(alert.status) }
                ]}>
                  <Text style={styles.statusText}>
                    {alert.status}
                  </Text>
                </View>
              </View>
              
              {alert.description && (
                <Text style={styles.alertDescription}>
                  {alert.description}
                </Text>
              )}
            </TouchableOpacity>
          ))}
          
          {alerts.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle" size={48} color={COLORS.gray} />
              <Text style={styles.emptyText}>Aucune alerte en cours</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal de détail d'alerte */}
      {selectedAlert && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Détails de l'alerte
              </Text>
              <TouchableOpacity onPress={() => setSelectedAlert(null)}>
                <Ionicons name="close" size={24} color={COLORS.gray} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalText}>
                <Text style={styles.modalLabel}>Travailleur:</Text> {selectedAlert.userName}
              </Text>
              <Text style={styles.modalText}>
                <Text style={styles.modalLabel}>Type:</Text> {selectedAlert.type}
              </Text>
              <Text style={styles.modalText}>
                <Text style={styles.modalLabel}>Heure:</Text> {formatTime(selectedAlert.timestamp)}
              </Text>
              <Text style={styles.modalText}>
                <Text style={styles.modalLabel}>Statut:</Text> {selectedAlert.status}
              </Text>
              
              {selectedAlert.description && (
                <Text style={styles.modalText}>
                  <Text style={styles.modalLabel}>Description:</Text> {selectedAlert.description}
                </Text>
              )}
            </View>
            
            <View style={styles.modalActions}>
              {selectedAlert.status === ALERT_STATUS.PENDING && (
                <>
                  <Button
                    title="Acquitter"
                    onPress={() => handleAlertAction(selectedAlert.id, 'acknowledge')}
                    variant="secondary"
                    style={styles.modalButton}
                  />
                  <Button
                    title="Résoudre"
                    onPress={() => handleAlertAction(selectedAlert.id, 'resolve')}
                    variant="success"
                    style={styles.modalButton}
                  />
                </>
              )}
              
              <Button
                title="Fermer"
                onPress={() => setSelectedAlert(null)}
                variant="outline"
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  
  refreshButton: {
    padding: 8,
  },
  
  scrollView: {
    flex: 1,
  },
  
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginTop: 8,
  },
  
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  
  mapContainer: {
    margin: 20,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 12,
  },
  
  map: {
    height: 200,
    borderRadius: 12,
  },
  
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  
  alertMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  
  alertsContainer: {
    margin: 20,
  },
  
  alertsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  alertCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  alertIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  
  alertInfo: {
    flex: 1,
  },
  
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
  
  alertTime: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 2,
  },
  
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  statusText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  
  alertDescription: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 8,
  },
  
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  
  emptyText: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 12,
  },
  
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  
  modalBody: {
    marginBottom: 20,
  },
  
  modalText: {
    fontSize: 16,
    color: COLORS.dark,
    marginBottom: 8,
  },
  
  modalLabel: {
    fontWeight: '600',
  },
  
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  
  modalButton: {
    flex: 1,
  },
});

export default DashboardScreen; 