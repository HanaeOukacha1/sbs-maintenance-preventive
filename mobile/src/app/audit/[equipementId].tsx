import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DynamicForm from '../../components/DynamicForm';
import db from '../../services/dbService';

export default function AuditScreen() {
  const { equipementId, missionId } = useLocalSearchParams();
  const router = useRouter();

  const [equipement, setEquipement] = useState<any>(null);
  const [schema, setSchema] = useState<any>(null);
  const [schemaId, setSchemaId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    chargerDonneesAudit();
  }, [equipementId]);

  const chargerDonneesAudit = () => {
    try {
      // 1. Charger l'équipement
      const stmtEq = db.prepareSync('SELECT * FROM equipements WHERE id = ?');
      const eqs = stmtEq.executeSync([Number(equipementId)]).getAllSync();
      stmtEq.finalizeSync();

      if (!eqs || eqs.length === 0) {
        Alert.alert("Erreur", "Équipement introuvable.");
        setIsLoading(false);
        return;
      }
      
      const equip = eqs[0] as any;
      setEquipement(equip);

      // 2. Trouver le schéma JSON correspondant au type d'équipement
      // Si type='INCONNU', on peut charger un schéma générique ou bloquer.
      // Pour l'instant, on cherche par `type_equipement`
      const stmtSch = db.prepareSync('SELECT * FROM json_schemas WHERE type_equipement = ?');
      // Pour éviter les crashs si type_equipement est null dans la DB, on gère les 2 cas
      const schs = stmtSch.executeSync([equip.type_equipement]).getAllSync();
      stmtSch.finalizeSync();

      if (schs && schs.length > 0) {
        const sch = schs[0] as any;
        setSchemaId(sch.id);
        setSchema(JSON.parse(sch.schema_data));
      } else {
        // Fallback: Si on ne trouve pas le schéma exact, on cherche un schéma générique (ex: id=1) 
        // ou on affiche une erreur. Pour la démo, on essaye de prendre le premier schéma dispo.
        console.warn(`Aucun schéma trouvé pour le type ${equip.type_equipement}, tentative de fallback...`);
        const fallbackStmt = db.prepareSync('SELECT * FROM json_schemas LIMIT 1');
        const fbSchs = fallbackStmt.executeSync([]).getAllSync();
        fallbackStmt.finalizeSync();
        
        if (fbSchs && fbSchs.length > 0) {
          const sch = fbSchs[0] as any;
          setSchemaId(sch.id);
          setSchema(JSON.parse(sch.schema_data));
          Alert.alert("Info", `Schéma générique (${sch.nom}) utilisé car aucun spécifique à '${equip.type_equipement}' n'a été trouvé.`);
        } else {
          Alert.alert("Erreur critique", "Aucun formulaire disponible hors-ligne !");
        }
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Erreur", "Impossible de préparer l'audit.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidationAudit = (answers: Record<string, any>) => {
    try {
      const reponsesJson = JSON.stringify(answers);
      const dateCreation = new Date().toISOString();

      // Sauvegarde dans la table interventions locale
      const insertStmt = db.prepareSync(`
        INSERT INTO interventions (mission_id, equipement_id, schema_id, reponses, syncEnAttente, date_creation) 
        VALUES (?, ?, ?, ?, 1, ?)
      `);
      
      insertStmt.executeSync([
        Number(missionId) || 0, // 0 si hors mission
        equipement.id,
        schemaId,
        reponsesJson,
        dateCreation
      ]);
      insertStmt.finalizeSync();

      Alert.alert(
        "Audit Terminé", 
        "Les données ont été sauvegardées localement avec succès. Elles seront synchronisées dès le retour réseau.",
        [
          { text: "OK", onPress: () => router.back() }
        ]
      );
      
    } catch (e) {
      console.error("Erreur de sauvegarde de l'audit:", e);
      Alert.alert("Erreur", "Impossible de sauvegarder l'audit localement.");
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#22b5d8" />
      </View>
    );
  }

  if (!schema) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={{color: '#ef4444'}}>Erreur de chargement du schéma d'audit.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>Équipement: {equipement?.numero_serie}</Text>
      </View>
      
      <DynamicForm 
        schema={schema} 
        onSubmit={handleValidationAudit} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#1e293b',
    padding: 15,
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: 'bold',
  }
});
