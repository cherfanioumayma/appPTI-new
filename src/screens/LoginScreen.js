import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import { COLORS } from '../utils/constants';

const LoginScreen = ({ navigation }) => {
  const { login, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    // Validation email
    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    // Validation mot de passe
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        // La navigation sera gérée automatiquement par le contexte d'authentification
        console.log('Connexion réussie');
      } else {
        Alert.alert(
          'Erreur de connexion',
          result.error || 'Une erreur est survenue lors de la connexion',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Erreur',
        'Une erreur inattendue est survenue',
        [{ text: 'OK' }]
      );
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo et titre */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>PTI</Text>
            </View>
            <Text style={styles.title}>Protection du Travailleur Isolé</Text>
            <Text style={styles.subtitle}>Connectez-vous à votre compte</Text>
          </View>

          {/* Formulaire */}
          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="Entrez votre email"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon="mail-outline"
              error={errors.email}
            />

            <Input
              label="Mot de passe"
              placeholder="Entrez votre mot de passe"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              secureTextEntry
              leftIcon="lock-closed-outline"
              error={errors.password}
            />

            <Button
              title="Se connecter"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
            />

            {/* Lien d'inscription */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>
                Vous n'avez pas de compte ?{' '}
              </Text>
              <Button
                title="S'inscrire"
                onPress={() => navigation.navigate('Register')}
                variant="outline"
                size="small"
              />
            </View>
          </View>

          {/* Informations de sécurité */}
          <View style={styles.securityInfo}>
            <Text style={styles.securityTitle}>🔒 Sécurité</Text>
            <Text style={styles.securityText}>
              Vos données sont protégées et chiffrées. Cette application respecte 
              les normes de sécurité pour la protection des travailleurs isolés.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  
  keyboardAvoidingView: {
    flex: 1,
  },
  
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 8,
  },
  
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
  },
  
  form: {
    marginBottom: 32,
  },
  
  loginButton: {
    marginTop: 16,
  },
  
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  
  registerText: {
    fontSize: 16,
    color: COLORS.gray,
  },
  
  securityInfo: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  
  securityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
  },
  
  securityText: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
  },
});

export default LoginScreen; 