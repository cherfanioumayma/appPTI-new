import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import Button from '../components/Button';
import Input from '../components/Input';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../services/firebase'; // db = getFirestore(app)
import { doc, setDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

const RegisterScreen = () => {
  const navigation = useNavigation();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirm: '',
    role: '', // Ajout du rôle
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
    setError('');
  };

  const handleRegister = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password || !form.confirm || !form.role) {
      setError('Tous les champs sont obligatoires.');
      return;
    }
    if (form.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      // Enregistre le profil et le rôle dans Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        role: form.role,
        createdAt: new Date(),
      });
      // Navigation selon le rôle
      if (form.role === 'superviseur') {
        navigation.replace('DashboardScreen');
      } else {
        navigation.replace('SOSButtonScreen');
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.light }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Ionicons name="person-add" size={64} color={COLORS.primary} />
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Inscris-toi pour continuer</Text>
        </View>

        <View style={styles.form}>
          <Input
            placeholder="Prénom"
            value={form.firstName}
            onChangeText={v => handleChange('firstName', v)}
            icon="person"
          />
          <Input
            placeholder="Nom"
            value={form.lastName}
            onChangeText={v => handleChange('lastName', v)}
            icon="person"
          />
          <Input
            placeholder="Email"
            value={form.email}
            onChangeText={v => handleChange('email', v)}
            icon="mail"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            placeholder="Mot de passe"
            value={form.password}
            onChangeText={v => handleChange('password', v)}
            icon="lock-closed"
            secureTextEntry
          />
          <Input
            placeholder="Confirmer le mot de passe"
            value={form.confirm}
            onChangeText={v => handleChange('confirm', v)}
            icon="lock-closed"
            secureTextEntry
          />

          {/* Sélection du rôle */}
          <View style={styles.roleContainer}>
            <Text style={styles.roleLabel}>Choisissez votre rôle :</Text>
            <View style={styles.roleButtons}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  form.role === 'travailleur' && styles.roleButtonSelected,
                ]}
                onPress={() => handleChange('role', 'travailleur')}
              >
                <Text style={[
                  styles.roleButtonText,
                  form.role === 'travailleur' && styles.roleButtonTextSelected,
                ]}>Travailleur</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  form.role === 'superviseur' && styles.roleButtonSelected,
                ]}
                onPress={() => handleChange('role', 'superviseur')}
              >
                <Text style={[
                  styles.roleButtonText,
                  form.role === 'superviseur' && styles.roleButtonTextSelected,
                ]}>Superviseur</Text>
              </TouchableOpacity>
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title={loading ? 'Création...' : 'Créer mon compte'}
            onPress={handleRegister}
            style={styles.button}
            disabled={loading}
          />

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>
              Déjà un compte ? <Text style={{ color: COLORS.primary }}>Se connecter</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: COLORS.light,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 4,
  },
  form: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  button: {
    marginTop: 16,
    marginBottom: 8,
  },
  error: {
    color: COLORS.danger,
    textAlign: 'center',
    marginVertical: 8,
    fontWeight: '500',
  },
  link: {
    textAlign: 'center',
    color: COLORS.gray,
    marginTop: 8,
    fontSize: 15,
  },
  roleContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  roleLabel: {
    fontSize: 15,
    color: COLORS.dark,
    marginBottom: 8,
    fontWeight: '500',
  },
  roleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray,
    backgroundColor: COLORS.light,
    alignItems: 'center',
  },
  roleButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  roleButtonText: {
    color: COLORS.gray,
    fontWeight: '600',
  },
  roleButtonTextSelected: {
    color: COLORS.white,
  },
});

export default RegisterScreen;