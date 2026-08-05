import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { decode } from 'base-64';
import { TEMPLATE_ANCFCC_B64 } from '../utils/templates';
import { Buffer } from 'buffer';

/**
 * Génère le fichier Word hors-ligne et ouvre la fenêtre de partage.
 * @param {Object} mission 
 * @param {Object} equipement 
 * @param {Object} reponses 
 */
export const generateWordReport = async (mission, equipement, reponses) => {
  try {
    // 1. Convertir le Base64 en binaire (Buffer)
    // On utilise Buffer de NodeJS (polyfilled par la lib 'buffer')
    const zip = new PizZip(Buffer.from(TEMPLATE_ANCFCC_B64, 'base64'));
    
    // 2. Initialiser Docxtemplater
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: {
        start: '{{',
        end: '}}'
      }
    });

    // 3. Préparer le contexte de données
    const dateInter = new Date().toLocaleDateString('fr-FR');
    const organisme = mission?.checklist_type === 'ADM' ? 'Autoroute du Maroc (ADM)' : (equipement?.organisme || 'ANCFCC');
    const context = {
      date_intervention: dateInter,
      nom_technicien: '',
      nom_responsable: '', // Laisser vide pour la signature manuelle
      organisme: organisme,
      puissance_kva: equipement?.puissance_kva || equipement?.cpu || '', // mapping fallback pour ADM
      zone: equipement?.zone || equipement?.ram || '', // mapping fallback
      nb_batteries: equipement?.nb_batteries || '',
      ville: equipement?.ville || mission?.site_ville || '',
      marque_modele: `${equipement?.marque || ''} ${equipement?.modele || ''}`.trim(),
      etablissement: equipement?.etablissement || mission?.site_nom || '',
      nom_site: equipement?.nom_site || mission?.site_nom || '',
      numero_serie: equipement?.numero_serie || '',
      capacite_batteries: equipement?.capacite_batteries || equipement?.disque_dur || '', // mapping fallback
    };

    // Mapping des 10 points (pt1 à pt10)
    for (let i = 1; i <= 10; i++) {
      let rep = reponses[`pt${i}`] || reponses[(i-1).toString()] || '';
      
      let val_oui = '';
      if (typeof rep === 'string' && ['oui', 'ok', 'fait', 'bon'].includes(rep.toLowerCase())) {
        val_oui = 'X';
      } else if (rep && typeof rep === 'object' && ['oui', 'ok', 'fait', 'bon'].includes((rep.reponse || '').toLowerCase())) {
        val_oui = 'X';
      }

      context[`pt${i}_oui`] = val_oui;
      context[`pt${i}_obs`] = ''; // Les observations par point sont laissées vides sur l'app
    }

    // 4. Appliquer les données au document
    doc.render(context);

    // 5. Générer le fichier en Base64
    const generatedBuffer = doc.getZip().generate({
      type: 'base64',
      compression: 'DEFLATE',
    });

    // 6. Sauvegarder dans le système de fichiers local
    const typeExport = mission?.checklist_type === 'ADM' ? 'ADM' : 'ANCFCC';
    const filename = `Rapport_${typeExport}_${mission.site_nom.replace(/[^a-zA-Z0-9]/g, '_')}_${equipement.numero_serie || 'Eq'}.docx`;
    const fileUri = FileSystem.documentDirectory + filename;

    await FileSystem.writeAsStringAsync(fileUri, generatedBuffer, {
      encoding: 'base64',
    });

    // 7. Ouvrir la fenêtre de partage
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        dialogTitle: 'Partager le rapport',
        UTI: 'org.openxmlformats.wordprocessingml.document'
      });
    } else {
      alert("Le partage n'est pas disponible sur cet appareil.");
    }
  } catch (error) {
    console.error("Erreur lors de la génération du Word :", error);
    alert("Impossible de générer le fichier Word : " + error.message);
  }
};
