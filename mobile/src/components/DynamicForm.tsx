import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import FormInput from './FormInput';
import FormSwitch from './FormSwitch';
import FormEnum from './FormEnum';

interface DynamicFormProps {
  schema: any; // L'objet JSON Schema
  initialValues?: Record<string, any>; // Réponses précédentes (si modification)
  onSubmit: (answers: Record<string, any>) => void; // Callback appelé lors du clic sur Valider
}

export default function DynamicForm({ schema, initialValues = {}, onSubmit }: DynamicFormProps) {
  const [answers, setAnswers] = useState<Record<string, any>>(initialValues);

  // Si le schéma est vide ou invalide
  if (!schema || !schema.properties) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Le modèle de formulaire est invalide ou vide.</Text>
      </View>
    );
  }

  const handleFieldChange = (fieldName: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSubmit = () => {
    onSubmit(answers);
  };

  const renderField = (fieldName: string, fieldSchema: any) => {
    const value = answers[fieldName];
    const title = fieldSchema.title || fieldName;

    // 1. Champ Choix Multiple (Enum)
    if (fieldSchema.enum && Array.isArray(fieldSchema.enum)) {
      return (
        <FormEnum
          key={fieldName}
          title={title}
          options={fieldSchema.enum}
          value={value}
          onChange={(val) => handleFieldChange(fieldName, val)}
        />
      );
    }

    // 2. Champ Booléen (Vrai/Faux)
    if (fieldSchema.type === 'boolean') {
      return (
        <FormSwitch
          key={fieldName}
          title={title}
          value={value}
          onChange={(val) => handleFieldChange(fieldName, val)}
        />
      );
    }

    // 3. Champ Texte par défaut (string, number, etc.)
    return (
      <FormInput
        key={fieldName}
        title={title}
        value={value}
        onChange={(val) => handleFieldChange(fieldName, val)}
      />
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.headerTitle}>Audit Équipement</Text>
      
      {/* Génération dynamique des champs */}
      {Object.entries(schema.properties).map(([fieldName, fieldSchema]) => 
        renderField(fieldName, fieldSchema)
      )}

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Valider l'audit</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#22b5d8',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#22b5d8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
  }
});
