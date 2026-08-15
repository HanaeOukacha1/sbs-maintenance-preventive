import re

def flatten_tsx(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    def make_f(label, k, placeholder=None, numeric=False):
        p = placeholder if placeholder else label
        kb = "'numeric'" if numeric else "'default'"
        return f'<View style={{styles.inputGroup}}><Text style={{styles.label}}>{label}</Text><TextInput style={{styles.input}} value={{eqData[\'{k}\'] || \'\'}} onChangeText={{t => setEqData({{ ...eqData, \'{k}\': t }})}} placeholder="{p}" keyboardType={{{kb}}} /></View>'

    def make_flex(label, k, placeholder=None, numeric=False):
        p = placeholder if placeholder else label
        kb = "'numeric'" if numeric else "'default'"
        return f'<View style={{[styles.inputGroup, {{ flex: 1 }}]}}><Text style={{styles.label}}>{label}</Text><TextInput style={{styles.input}} value={{eqData[\'{k}\'] || \'\'}} onChangeText={{t => setEqData({{ ...eqData, \'{k}\': t }})}} placeholder="{p}" keyboardType={{{kb}}} /></View>'

    def f_replacer(m):
        label = m.group(1)
        k = m.group(2)
        placeholder = m.group(3)
        numeric = 'numeric' in m.group(0)
        return make_f(label, k, placeholder, numeric)

    content = re.sub(r'<F\s+label="([^"]+)"\s+k="([^"]+)"(?:[^>]*?placeholder="([^"]+)")?[^>]*/>', f_replacer, content)

    def flex_replacer(m):
        label = m.group(1)
        k = m.group(2)
        placeholder = m.group(3)
        numeric = 'numeric' in m.group(0)
        return make_flex(label, k, placeholder, numeric)
        
    content = re.sub(r'<Flex\s+label="([^"]+)"\s+k="([^"]+)"(?:[^>]*?placeholder="([^"]+)")?[^>]*/>', flex_replacer, content)

    content = content.replace('<Row>', '<View style={styles.row}>')
    content = content.replace('</Row>', '</View>')

    common_fields = f'''
        {make_f('Désignation / Type', 'designation', 'Ex: PC Portable, Imprimante...')}
        <View style={{styles.row}}>
          {make_flex('Marque', 'marque', 'Ex: Dell, HP...')}
          {make_flex('Modèle', 'modele', 'Ex: Latitude 5410')}
        </View>
        <View style={{styles.row}}>
          {make_flex('N° Série', 'numero_serie', 'N° de série')}
          {make_flex('N° Inventaire', 'numero_inventaire', 'N° inventaire')}
        </View>
'''
    content = content.replace('<CommonFields />', common_fields)

    def pc_fields_replacer(m):
        hide_storage = 'hideStorage' in m.group(0)
        res = f'''
        <View style={{styles.row}}>
          {make_flex('CPU / Processeur', 'cpu', 'Ex: Core i5 10gen')}
          {make_flex('RAM', 'ram', 'Ex: 8 Go')}
        </View>
        <View style={{styles.row}}>'''
        if not hide_storage:
            res += f'''
          {make_flex('Disque Dur / Stockage', 'disque_dur', 'Ex: 256 Go SSD')}'''
        res += f'''
          {make_flex("Système d'Exploitation", "systeme_exploitation", "Ex: Win 11 Pro")}
        </View>'''
        return res

    content = re.sub(r'<PcFields\s*[^>]*/>', pc_fields_replacer, content)
    
    start_iife = r'\{\(\(\) => \{\s*const F =.*?const PcFields = [^\n]+\n\s*'
    content = re.sub(start_iife, '{', content, flags=re.DOTALL)
    content = content.replace('})()}', '}')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

flatten_tsx(r'c:\Users\hanae\Desktop\Stage PFA 2026\mobile\src\components\FicheInterventionModal.tsx')
print("Refactored successfully")
