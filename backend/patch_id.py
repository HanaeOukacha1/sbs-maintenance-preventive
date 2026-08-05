import os
import sys

file_path = r'c:\Users\hanae\Desktop\Stage PFA 2026\mobile\src\app\mission\[id].tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

# Add imports
if 'import * as FileSystem' not in code:
    code = code.replace("import api from '../../services/api';", "import api from '../../services/api';\nimport * as FileSystem from 'expo-file-system';\nimport * as Sharing from 'expo-sharing';\nimport * as SecureStore from 'expo-secure-store';")
    code = code.replace("ChevronRight, Layers,", "ChevronRight, Layers, Download,")

# Add the button below the list
export_btn = '''
        {filteredEquipements.length === 0 && search.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucun équipement pour cette feuille.</Text>
          </View>
        )}

        <TouchableOpacity 
          style={styles.exportExcelBtn} 
          onPress={async () => {
            try {
              Alert.alert('Génération', 'Génération du rapport Excel en cours...');
              const token = await SecureStore.getItemAsync('token');
              const url = api.defaults.baseURL + /missions/\/export;
              const fileUri = FileSystem.documentDirectory + Rapport_Mission_\.xlsx;
              const downloadResumable = FileSystem.createDownloadResumable(
                  url,
                  fileUri,
                  { headers: { Authorization: Bearer \ } }
              );
              const downloadResult = await downloadResumable.downloadAsync();
              if (downloadResult && downloadResult.uri) {
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(downloadResult.uri);
                } else {
                    Alert.alert("Succès", "Rapport Excel téléchargé.");
                }
              }
            } catch(e) {
              Alert.alert("Erreur", "Impossible de télécharger l'Excel");
            }
          }}
        >
          <Download color="#fff" size={20} />
          <Text style={styles.exportExcelText}>Télécharger Rapport Excel</Text>
        </TouchableOpacity>
'''
code = code.replace('''        {filteredEquipements.length === 0 && search.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucun équipement pour cette feuille.</Text>
          </View>
        )}''', export_btn)

# Fix the tabs layout
old_tab_style = '''  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8,
  },'''
new_tab_style = '''  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8,
    flexShrink: 0,
  },'''
code = code.replace(old_tab_style, new_tab_style)

old_tab_text = '''  tabText: { fontSize: 13, color: '#64748b', fontWeight: '500' },'''
new_tab_text = '''  tabText: { fontSize: 13, color: '#64748b', fontWeight: '500', flexShrink: 0 },'''
code = code.replace(old_tab_text, new_tab_text)

# Add export btn styles
if 'exportExcelBtn' not in code:
    styles_injection = '''
  exportExcelBtn: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 10
  },
  exportExcelText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16
  },
});'''
    code = code.replace('});', styles_injection)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Patched [id].tsx")
