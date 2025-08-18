import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import { COLORS } from '../utils/constants';

const SettingsScreen = () => {
  const { userData, logout, updateUserData, getFullName } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: userData?.firstName || '',
    lastName: userData?.lastName || '',
    phone: userData?.phone || '',
    emergencyContact: userData?.emergencyContact || ''
  });
  const [notifications, setNotifications] = useState(true);
  const [locationTracking, setLocationTracking] = useState(true);
  const [autoRecord, setAutoRecord] = useState(true);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      const result = await updateUserData(formData);
      if (result.success) {
        Alert.alert('Succès', 'Profil mis à jour avec succès');
        setIsEditing(false);
      } else {
        Alert.alert('Erreur', result.error || 'Impossible de mettre à jour le profil');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnexion', 
          style: 'destructive',
          onPress: async () => {
            const result = await logout();
            if (!result.success) {
              Alert.alert('Erreur', 'Impossible de se déconnecter');
            }
          }
        }
      ]
    );
  };

  const renderProfileSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="person" size={24} color={COLORS.primary} />
        <Text style={styles.sectionTitle}>Profil utilisateur</Text>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
          <Ionicons 
            name={isEditing ? "close" : "create"} 
            size={24} 
            color={COLORS.primary} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.profileInfo}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={COLORS.white} />
          </View>
          <Text style={styles.userName}>{getFullName()}</Text>
          <Text style={styles.userRole}>
            {userData?.role === 'supervisor' ? 'Superviseur' : 'Travailleur'}
          </Text>
        </View>

        {isEditing ? (
          <View style={styles.editForm}>
            <Input
              label="Prénom"
              value={formData.firstName}
              onChangeText={(value) => handleInputChange('firstName', value)}
              placeholder="Entrez votre prénom"
            />
            <Input
              label="Nom"
              value={formData.lastName}
              onChangeText={(value) => handleInputChange('lastName', value)}
              placeholder="Entrez votre nom"
            />
            <Input
              label="Téléphone"
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              placeholder="Entrez votre numéro de téléphone"
              keyboardType="phone-pad"
            />
            <Input
              label="Contact d'urgence"
              value={formData.emergencyContact}
              onChangeText={(value) => handleInputChange('emergencyContact', value)}
              placeholder="Nom et téléphone du contact d'urgence"
            />
            
            <View style={styles.editActions}>
              <Button
                title="Annuler"
                onPress={() => setIsEditing(false)}
                variant="outline"
                style={styles.editButton}
              />
              <Button
                title="Sauvegarder"
                onPress={handleSaveProfile}
                style={styles.editButton}
              />
            </View>
          </View>
        ) : (
          <View style={styles.profileDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email:</Text>
              <Text style={styles.detailValue}>{userData?.email}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Téléphone:</Text>
              <Text style={styles.detailValue}>
                {userData?.phone || 'Non renseigné'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Contact d'urgence:</Text>
              <Text style={styles.detailValue}>
                {userData?.emergencyContact || 'Non renseigné'}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  const renderSettingsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="settings" size={24} color={COLORS.primary} />
        <Text style={styles.sectionTitle}>Paramètres de l'application</Text>
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Ionicons name="notifications" size={20} color={COLORS.gray} />
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Notifications</Text>
            <Text style={styles.settingDescription}>
              Recevoir les alertes et notifications
            </Text>
          </View>
        </View>
        <Switch
          value={notifications}
          onValueChange={setNotifications}
          trackColor={{ false: COLORS.lightGray, true: COLORS.primary }}
          thumbColor={COLORS.white}
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Ionicons name="location" size={20} color={COLORS.gray} />
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Suivi GPS</Text>
            <Text style={styles.settingDescription}>
              Autoriser le suivi de localisation
            </Text>
          </View>
        </View>
        <Switch
          value={locationTracking}
          onValueChange={setLocationTracking}
          trackColor={{ false: COLORS.lightGray, true: COLORS.primary }}
          thumbColor={COLORS.white}
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Ionicons name="mic" size={20} color={COLORS.gray} />
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Enregistrement automatique</Text>
            <Text style={styles.settingDescription}>
              Enregistrer l'audio lors des alertes
            </Text>
          </View>
        </View>
        <Switch
          value={autoRecord}
          onValueChange={setAutoRecord}
          trackColor={{ false: COLORS.lightGray, true: COLORS.primary }}
          thumbColor={COLORS.white}
        />
      </View>
    </View>
  );

  const renderSecuritySection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="shield-checkmark" size={24} color={COLORS.primary} />
        <Text style={styles.sectionTitle}>Sécurité</Text>
      </View>

      <TouchableOpacity style={styles.menuItem}>
        <View style={styles.menuItemInfo}>
          <Ionicons name="key" size={20} color={COLORS.gray} />
          <Text style={styles.menuItemTitle}>Changer le mot de passe</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem}>
        <View style={styles.menuItemInfo}>
          <Ionicons name="finger-print" size={20} color={COLORS.gray} />
          <Text style={styles.menuItemTitle}>Authentification biométrique</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem}>
        <View style={styles.menuItemInfo}>
          <Ionicons name="lock-closed" size={20} color={COLORS.gray} />
          <Text style={styles.menuItemTitle}>Verrouillage automatique</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
      </TouchableOpacity>
    </View>
  );

  const renderAboutSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="information-circle" size={24} color={COLORS.primary} />
        <Text style={styles.sectionTitle}>À propos</Text>
      </View>

      <TouchableOpacity style={styles.menuItem}>
        <View style={styles.menuItemInfo}>
          <Ionicons name="document-text" size={20} color={COLORS.gray} />
          <Text style={styles.menuItemTitle}>Conditions d'utilisation</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem}>
        <View style={styles.menuItemInfo}>
          <Ionicons name="shield" size={20} color={COLORS.gray} />
          <Text style={styles.menuItemTitle}>Politique de confidentialité</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem}>
        <View style={styles.menuItemInfo}>
          <Ionicons name="help-circle" size={20} color={COLORS.gray} />
          <Text style={styles.menuItemTitle}>Aide et support</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
      </TouchableOpacity>

      <View style={styles.versionInfo}>
        <Text style={styles.versionText}>Version 1.0.0</Text>
        <Text style={styles.versionText}>© 2024 App PTI</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.title}>Paramètres</Text>
        </View>

        {/* Sections */}
        {renderProfileSection()}
        {renderSettingsSection()}
        {renderSecuritySection()}
        {renderAboutSection()}

        {/* Déconnexion */}
        <View style={styles.logoutSection}>
          <Button
            title="Se déconnecter"
            onPress={handleLogout}
            variant="danger"
            style={styles.logoutButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  
  scrollView: {
    flex: 1,
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
  
  section: {
    backgroundColor: COLORS.white,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
    marginLeft: 12,
    flex: 1,
  },
  
  profileInfo: {
    alignItems: 'center',
  },
  
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 4,
  },
  
  userRole: {
    fontSize: 14,
    color: COLORS.gray,
  },
  
  editForm: {
    width: '100%',
  },
  
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  
  editButton: {
    flex: 1,
  },
  
  profileDetails: {
    width: '100%',
  },
  
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  
  detailLabel: {
    fontSize: 16,
    color: COLORS.gray,
    fontWeight: '500',
  },
  
  detailValue: {
    fontSize: 16,
    color: COLORS.dark,
    flex: 1,
    textAlign: 'right',
  },
  
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.dark,
  },
  
  settingDescription: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 2,
  },
  
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  
  menuItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  menuItemTitle: {
    fontSize: 16,
    color: COLORS.dark,
    marginLeft: 12,
  },
  
  versionInfo: {
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  
  versionText: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  
  logoutSection: {
    padding: 20,
    marginTop: 16,
  },
  
  logoutButton: {
    marginBottom: 20,
  },
});

export default SettingsScreen; 