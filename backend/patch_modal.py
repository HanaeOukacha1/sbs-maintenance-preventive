import sys
with open(r'c:\Users\hanae\Desktop\Stage PFA 2026\mobile\src\components\FicheInterventionModal.tsx', 'r', encoding='utf-8') as f:
    orig = f.read()

# Add import if missing
if "react-native-signature-canvas" not in orig:
    orig = orig.replace(
        "import { X, CheckCircle2, Circle, Save, FileText } from 'lucide-react-native';",
        "import { X, CheckCircle2, Circle, Save, FileText } from 'lucide-react-native';\nimport SignatureScreen from 'react-native-signature-canvas';"
    )

# Add ref and state
if "const sigRef =" not in orig:
    orig = orig.replace(
        "const [reponses, setReponses] = useState<any>({});",
        "const [reponses, setReponses] = useState<any>({});\n  const sigRef = useRef<any>(null);\n  const [signature, setSignature] = useState<string | null>(null);"
    )

# Add initialization of utilisateur and signature
if "utilisateur: equipement.utilisateur_nom" not in orig:
    orig = orig.replace(
        "designation: equipement.designation || equipement.famille || equipement.type_equipement || '',",
        "designation: equipement.designation || equipement.famille || equipement.type_equipement || '',\n        utilisateur: equipement.utilisateur_nom || '',"
    )
    orig = orig.replace(
        "setReponses(equipement.saved_reponses || {});",
        "setReponses(equipement.saved_reponses || {});\n      setSignature(equipement.saved_reponses?.signature || null);"
    )

# Intercept save to read signature if it's CAPM/DPRF
# Wait, if we use the signature pad, we can just let them sign, and when they press 'Enregistrer' we need to read it.
# Actually, the built-in Confirm button is easier. We can just tell the user to click 'Confirmer' on the pad before 'Enregistrer'.
# We can just add the UI block for signature.

ui_block = '''
          {(checklistType === 'MSANTE_CAPM' || checklistType === 'MSANTE_DPRF') && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. Informations Utilisateur</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nom de l'utilisateur</Text>
                <TextInput 
                  style={styles.input} 
                  value={eqData.utilisateur || ''} 
                  onChangeText={t => setEqData({...eqData, utilisateur: t})} 
                  placeholder="Ex: M. Alaoui" 
                />
              </View>
              <Text style={styles.label}>Signature (Appuyez sur Confirmer après avoir signé)</Text>
              {signature ? (
                <View style={{alignItems: 'center'}}>
                  <Text style={{color: '#10b981', marginBottom: 10}}>Signature enregistrée !</Text>
                  <TouchableOpacity onPress={() => {setSignature(null); setReponses({...reponses, signature: null});}} style={{padding: 8, backgroundColor: '#fef2f2', borderRadius: 8}}>
                    <Text style={{color: '#ef4444'}}>Effacer</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ height: 200, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                  <SignatureScreen
                    ref={sigRef}
                    onOK={(sig) => {
                      setSignature(sig);
                      setReponses({...reponses, signature: sig});
                    }}
                    webStyle={.m-signature-pad {box-shadow: none; border: none;} .m-signature-pad--body {border: none;}}
                  />
                </View>
              )}
            </View>
          )}
'''

if "3. Informations Utilisateur" not in orig:
    orig = orig.replace(
        "<View style={{ height: 40 }} />\n        </ScrollView>",
        ui_block + "\n          <View style={{ height: 40 }} />\n        </ScrollView>"
    )

with open(r'c:\Users\hanae\Desktop\Stage PFA 2026\mobile\src\components\FicheInterventionModal.tsx', 'w', encoding='utf-8') as f:
    f.write(orig)

print("Patched FicheInterventionModal.tsx")
