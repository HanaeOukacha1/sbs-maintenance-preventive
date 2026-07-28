import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, Alert, Text } from 'react-native';
import DynamicForm from '../components/DynamicForm';

// Un schéma d'exemple pour tester (copié depuis les logs)
const TEST_SCHEMA = {
  "type": "object",
  "properties": {
    "utilisateur": { "type": "string", "title": "UTILISATEUR" },
    "etat_system": { "type": "string", "title": "Etat System", "enum": ["ACTIVE", "INACTIVE"] },
    "etat_sw": { "type": "boolean", "title": "Etat Software (OK/NON)" }
  }
};

export default function FormTestScreen() {
  const [result, setResult] = useState<any>(null);

  const handleSubmit = (answers: Record<string, any>) => {
    // Cette fonction simule ce qui se passera quand le technicien valide
    console.log("RÉPONSES DE L'AUDIT :", answers);
    setResult(answers);
    Alert.alert("Succès", "Les données ont été consolidées dans l'objet JSON final.");
  };

  return (
    <SafeAreaView style={styles.container}>
      <DynamicForm 
        schema={TEST_SCHEMA} 
        onSubmit={handleSubmit} 
      />
      
      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>JSON Final (Prêt pour SQLite) :</Text>
          <Text style={styles.resultJson}>{JSON.stringify(result, null, 2)}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  resultContainer: {
    backgroundColor: '#1e293b',
    padding: 20,
    margin: 20,
    borderRadius: 12,
  },
  resultTitle: {
    color: '#94a3b8',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  resultJson: {
    color: '#10b981', // Vert style code
    fontFamily: 'monospace',
  }
});
