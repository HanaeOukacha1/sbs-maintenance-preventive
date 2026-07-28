import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface FormEnumProps {
  title: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
}

export default function FormEnum({ title, options, value, onChange }: FormEnumProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{title}</Text>
      <View style={styles.optionsContainer}>
        {options.map((option, index) => {
          const isSelected = value === option;
          return (
            <TouchableOpacity
              key={index}
              style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
              onPress={() => onChange(option)}
            >
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  optionButtonSelected: {
    backgroundColor: '#22b5d8',
    borderColor: '#22b5d8',
  },
  optionText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 14,
  },
  optionTextSelected: {
    color: '#ffffff',
  },
});
