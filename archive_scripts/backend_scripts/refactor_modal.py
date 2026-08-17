import re

with open(r'c:\Users\hanae\Desktop\Stage PFA 2026\mobile\src\components\FicheInterventionModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace <Row> and </Row>
content = content.replace('<Row>', '<View style={styles.row}>')
content = content.replace('</Row>', '</View>')

# Replace <CommonFields />
common_fields = '''
                <View style={styles.inputGroup}><Text style={styles.label}>Désignation / Type</Text><TextInput style={styles.input} value={eqData['designation'] || ''} onChangeText={t => setEqData({ ...eqData, designation: t })} placeholder="Ex: PC Portable, Imprimante..." /></View>
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}><Text style={styles.label}>Marque</Text><TextInput style={styles.input} value={eqData['marque'] || ''} onChangeText={t => setEqData({ ...eqData, marque: t })} placeholder="Ex: Dell, HP..." /></View>
                  <View style={[styles.inputGroup, { flex: 1 }]}><Text style={styles.label}>Modèle</Text><TextInput style={styles.input} value={eqData['modele'] || ''} onChangeText={t => setEqData({ ...eqData, modele: t })} placeholder="Ex: Latitude 5410" /></View>
                </View>
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}><Text style={styles.label}>N° Série</Text><TextInput style={styles.input} value={eqData['numero_serie'] || ''} onChangeText={t => setEqData({ ...eqData, numero_serie: t })} placeholder="N° de série" /></View>
                  <View style={[styles.inputGroup, { flex: 1 }]}><Text style={styles.label}>N° Inventaire</Text><TextInput style={styles.input} value={eqData['numero_inventaire'] || ''} onChangeText={t => setEqData({ ...eqData, numero_inventaire: t })} placeholder="N° inventaire" /></View>
                </View>
'''
content = content.replace('<CommonFields />', common_fields)

# Replace <PcFields ... />
def pc_fields_repl(m):
    hide_storage = 'hideStorage' in m.group(0)
    res = '''
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}><Text style={styles.label}>CPU / Processeur</Text><TextInput style={styles.input} value={eqData['cpu'] || ''} onChangeText={t => setEqData({ ...eqData, cpu: t })} placeholder="Ex: Core i5 10gen" /></View>
                  <View style={[styles.inputGroup, { flex: 1 }]}><Text style={styles.label}>RAM</Text><TextInput style={styles.input} value={eqData['ram'] || ''} onChangeText={t => setEqData({ ...eqData, ram: t })} placeholder="Ex: 8 Go" /></View>
                </View>
                <View style={styles.row}>'''
    if not hide_storage:
        res += '''
                  <View style={[styles.inputGroup, { flex: 1 }]}><Text style={styles.label}>Disque Dur / Stockage</Text><TextInput style={styles.input} value={eqData['disque_dur'] || ''} onChangeText={t => setEqData({ ...eqData, disque_dur: t })} placeholder="Ex: 256 Go SSD" /></View>'''
    res += '''
                  <View style={[styles.inputGroup, { flex: 1 }]}><Text style={styles.label}>Système d'Exploitation</Text><TextInput style={styles.input} value={eqData['systeme_exploitation'] || ''} onChangeText={t => setEqData({ ...eqData, systeme_exploitation: t })} placeholder="Ex: Win 11 Pro" /></View>
                </View>
'''
    return res

content = re.sub(r'<PcFields\s*[^>]*/>', pc_fields_repl, content)

def f_repl(m):
    label = m.group(1)
    k = m.group(2)
    placeholder = m.group(3) if m.group(3) else label
    numeric = 'numeric' in m.group(0)
    kb = "'numeric'" if numeric else "'default'"
    return f'''<View style={{styles.inputGroup}}><Text style={{styles.label}}>{label}</Text><TextInput style={{styles.input}} value={{eqData['{k}'] || ''}} onChangeText={{t => setEqData({{ ...eqData, {k}: t }})}} placeholder="{placeholder}" keyboardType={{{kb}}} /></View>'''

content = re.sub(r'<F\s+label="([^"]+)"\s+k="([^"]+)"(?:\s+placeholder="([^"]+)")?[^>]*/>', f_repl, content)

def flex_repl(m):
    label = m.group(1)
    k = m.group(2)
    placeholder = m.group(3) if m.group(3) else label
    numeric = 'numeric' in m.group(0)
    kb = "'numeric'" if numeric else "'default'"
    return f'''<View style={{[styles.inputGroup, {{ flex: 1 }}]}}><Text style={{styles.label}}>{label}</Text><TextInput style={{styles.input}} value={{eqData['{k}'] || ''}} onChangeText={{t => setEqData({{ ...eqData, {k}: t }})}} placeholder="{placeholder}" keyboardType={{{kb}}} /></View>'''

content = re.sub(r'<Flex\s+label="([^"]+)"\s+k="([^"]+)"(?:\s+placeholder="([^"]+)")?[^>]*/>', flex_repl, content)

# Remove the IIFE and definitions
content = re.sub(r'\{\(\(\) => \{\s*const F =.*?const PcFields = [^\n]+\n\s*', '', content, flags=re.DOTALL)
content = content.replace('})()}', '')

with open(r'c:\Users\hanae\Desktop\Stage PFA 2026\mobile\src\components\FicheInterventionModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
