import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';

interface FormSwitchProps {
  title: string;
  value: boolean;
  onChange: (val: boolean) => void;
}

export default function FormSwitch({ title, value, onChange }: FormSwitchProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{title}</Text>
      <Switch
        trackColor={{ false: '#e2e8f0', true: '#8dd9ec' }}
        thumbColor={value ? '#22b5d8' : '#f4f3f4'}
        ios_backgroundColor="#e2e8f0"
        onValueChange={onChange}
        value={!!value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
    marginRight: 10,
  },
});
