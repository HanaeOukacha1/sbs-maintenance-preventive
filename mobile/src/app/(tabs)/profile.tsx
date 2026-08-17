import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LogOut, User as UserIcon, Mail, Shield, Settings, ChevronRight } from 'lucide-react-native';
import authService from '../../services/authService';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await authService.getCurrentUser();
        setUser(u);
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    router.replace('/');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  const userEmail = user?.sub || user?.email || 'technicien@sbs.ma';
  const userRole = user?.role || 'TECHNICIEN';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Header section */}
        <View style={styles.header}>
          <Text style={styles.title}>Mon Profil</Text>
        </View>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <UserIcon color="#fff" size={40} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userEmail.split('@')[0].toUpperCase()}</Text>
            <View style={styles.emailRow}>
              <Mail color="#64748b" size={14} style={{ marginRight: 6 }} />
              <Text style={styles.userEmail}>{userEmail}</Text>
            </View>
            <View style={styles.roleBadge}>
              <Shield color="#0284c7" size={12} style={{ marginRight: 4 }} />
              <Text style={styles.roleText}>{userRole}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut color="#ef4444" size={20} style={{ marginRight: 10 }} />
            <Text style={styles.logoutText}>Se Déconnecter</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>SBS App v1.0.0</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#0284c7', // Sky 600
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe', // Sky 100
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7', // Sky 600
  },
  actionsContainer: {
    marginTop: 'auto',
    marginBottom: 24,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2', // Red 50
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca', // Red 200
  },
  logoutText: {
    color: '#ef4444', // Red 500
    fontWeight: '700',
    fontSize: 16,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  }
});
