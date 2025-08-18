import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import { alertService } from '../services/firebase';
import { COLORS, ALERT_STATUS, ALERT_TYPES } from '../utils/constants';

const AlertHistoryScreen = () => {
  const { userData, isSupervisor } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedAlert, setSelectedAlert] = useState(null);

  useEffect(() => {
    loadAlerts();
  }, []);

  useEffect(() => {
    filterAlerts();
  }, [alerts, selectedFilter]);

  const loadAlerts = async () => {
    try {
      const result = await alertService.getUserAlerts(userData.uid);
      if (result.success) {
        setAlerts(result.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des alertes:', error);
    }
  };

  const filterAlerts = () => {
    let filtered = [...alerts];

    switch (selectedFilter) {
      case 'pending':
        filtered = filtered.filter(alert => alert.status === ALERT_STATUS.PENDING);
        break;
      case 'resolved':
        filtered = filtered.filter(alert => alert.status === ALERT_STATUS.RESOLVED);
        break;
      case 'sos':
        filtered = filtered.filter(alert => alert.type === ALERT_TYPES.SOS);
        break;
      case 'fall':
        filtered = filtered.filter(alert => alert.type === ALERT_TYPES.FALL);
        break;
      case 'immobility':
        filtered = filtered.filter(alert => alert.type === ALERT_TYPES.IMMOBILITY);
        break;
      default:
        // 'all' - pas de filtre
        break;
    }

    setFilteredAlerts(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
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
        loadAlerts(); // Recharger les alertes
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

  const formatDate = (timestamp) => {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderFilterButton = (filter, label, icon) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Ionicons 
        name={icon} 
        size={16} 
        color={selectedFilter === filter ? COLORS.white : COLORS.gray} 
      />
      <Text style={[
        styles.filterButtonText,
        selectedFilter === filter && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderAlertItem = ({ item }) => (
    <TouchableOpacity
      style={styles.alertCard}
      onPress={() => handleAlertPress(item)}
    >
      <View style={styles.alertHeader}>
        <View style={styles.alertIconContainer}>
          <Ionicons 
            name={getAlertIcon(item.type)} 
            size={24} 
            color={getAlertColor(item.type)} 
          />
        </View>
        <View style={styles.alertInfo}>
          <Text style={styles.alertTitle}>
            {item.userName || 'Utilisateur'} - {item.type.toUpperCase()}
          </Text>
          <Text style={styles.alertTime}>
            {formatDate(item.timestamp)}
          </Text>
          {item.location && (
            <Text style={styles.alertLocation}>
              📍 {item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}
            </Text>
          )}
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) }
        ]}>
          <Text style={styles.statusText}>
            {item.status}
          </Text>
        </View>
      </View>
      
      {item.description && (
        <Text style={styles.alertDescription}>
          {item.description}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.title}>Historique des alertes</Text>
        <Text style={styles.subtitle}>
          {filteredAlerts.length} alerte(s) trouvée(s)
        </Text>
      </View>

      {/* Filtres */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderFilterButton('all', 'Toutes', 'list')}
          {renderFilterButton('pending', 'En cours', 'time')}
          {renderFilterButton('resolved', 'Résolues', 'checkmark')}
          {renderFilterButton('sos', 'SOS', 'warning')}
          {renderFilterButton('fall', 'Chutes', 'alert-circle')}
          {renderFilterButton('immobility', 'Immobilité', 'timer')}
        </ScrollView>
      </View>

      {/* Liste des alertes */}
      <FlatList
        data={filteredAlerts}
        renderItem={renderAlertItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={64} color={COLORS.gray} />
            <Text style={styles.emptyTitle}>Aucune alerte</Text>
            <Text style={styles.emptyText}>
              Aucune alerte ne correspond aux filtres sélectionnés
            </Text>
          </View>
        }
      />

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
                <Text style={styles.modalLabel}>Date:</Text> {formatDate(selectedAlert.timestamp)}
              </Text>
              <Text style={styles.modalText}>
                <Text style={styles.modalLabel}>Statut:</Text> {selectedAlert.status}
              </Text>
              
              {selectedAlert.location && (
                <Text style={styles.modalText}>
                  <Text style={styles.modalLabel}>Position:</Text> {'\n'}
                  Lat: {selectedAlert.location.latitude.toFixed(6)}{'\n'}
                  Lng: {selectedAlert.location.longitude.toFixed(6)}
                </Text>
              )}
              
              {selectedAlert.description && (
                <Text style={styles.modalText}>
                  <Text style={styles.modalLabel}>Description:</Text> {selectedAlert.description}
                </Text>
              )}
            </View>
            
            <View style={styles.modalActions}>
              {isSupervisor && selectedAlert.status === ALERT_STATUS.PENDING && (
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
  
  filtersContainer: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
  },
  
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  
  filterButtonText: {
    fontSize: 14,
    color: COLORS.gray,
    marginLeft: 4,
  },
  
  filterButtonTextActive: {
    color: COLORS.white,
  },
  
  list: {
    flex: 1,
  },
  
  alertCard: {
    backgroundColor: COLORS.white,
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  
  alertIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    marginBottom: 4,
  },
  
  alertTime: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  
  alertLocation: {
    fontSize: 12,
    color: COLORS.gray,
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
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray,
    marginTop: 16,
  },
  
  emptyText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 8,
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

export default AlertHistoryScreen; 