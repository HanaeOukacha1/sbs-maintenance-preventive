import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Mail, Lock, LogIn } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import authService from '../services/authService';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await authService.login(email.trim(), password);
      setIsLoading(false);
      // Redirection vers le dashboard mobile (écran à créer)
      router.replace('/(tabs)/missions');
    } catch (err) {
      setIsLoading(false);
      const errorMessage = err.message || 'Identifiants incorrects ou serveur inaccessible.';
      setError(errorMessage === 'Network Error' ? 'Impossible de contacter le serveur (Vérifiez le réseau ou l\'IP).' : errorMessage);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.formContainer}>
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.title}>Substancium</Text>
          <Text style={styles.subtitle}>Audit & Maintenance</Text>
        </View>

        {/* Message d'erreur */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Champ Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Adresse Email</Text>
          <View style={styles.inputWrapper}>
            <Mail color="#64748b" size={20} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="technicien@substancium.ma"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>
        </View>

        {/* Champ Mot de passe */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mot de passe</Text>
          <View style={styles.inputWrapper}>
            <Lock color="#64748b" size={20} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>
        </View>

        {/* Bouton Connexion */}
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <LogIn color="#ffffff" size={20} style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Se Connecter</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
  },
  formContainer: {
    paddingHorizontal: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0f172a',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#22b5d8',
    fontWeight: '600',
    marginTop: 5,
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 55,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
    height: '100%',
  },
  button: {
    backgroundColor: '#22b5d8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 55,
    borderRadius: 12,
    marginTop: 10,
    shadowColor: '#22b5d8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#8dd9ec',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
