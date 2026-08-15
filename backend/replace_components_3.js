const fs = require('fs');
const filepath = 'c:/Users/hanae/Desktop/Stage PFA 2026/mobile/src/components/FicheInterventionModal.tsx';
let content = fs.readFileSync(filepath, 'utf-8');

function escapeStr(s) {
    if (!s) return s;
    return s.replace(/'/g, "\\'");
}

// 1. Fix the checklistType issue ONLY at the component root level
const target = "  if (!equipement) return null;\n\n  const typeEq = equipement.type_equipement || 'AUTRE';";
const replacement = "  if (!equipement) return null;\n\n  const typeEq = equipement.type_equipement || 'AUTRE';\n  const checklistType = mission?.checklist_type || 'MSANTE_STANDARD';\n  const feuilleAmee = feuille || '';";
if (content.includes(target)) {
    content = content.replace(target, replacement);
}

// 2. Replace <F ... /> with F({ ... })
content = content.replace(/<F label="([^"]+)" k="([^"]+)"(?: placeholder="([^"]+)")?( numeric)? \/>/g, (match, label, k, placeholder, numeric) => {
    let args = `{ label: '${escapeStr(label)}', k: '${escapeStr(k)}'`;
    if (placeholder) args += `, placeholder: '${escapeStr(placeholder)}'`;
    if (numeric) args += `, numeric: true`;
    args += ' }';
    return `{F(${args})}`;
});

// 3. Replace <Flex ... /> with Flex({ ... })
content = content.replace(/<Flex label="([^"]+)" k="([^"]+)"(?: placeholder="([^"]+)")?( numeric)? \/>/g, (match, label, k, placeholder, numeric) => {
    let args = `{ label: '${escapeStr(label)}', k: '${escapeStr(k)}'`;
    if (placeholder) args += `, placeholder: '${escapeStr(placeholder)}'`;
    if (numeric) args += `, numeric: true`;
    args += ' }';
    return `{Flex(${args})}`;
});

// 4. Replace <Row>...</Row> with {Row({ children: <>...</> })}
content = content.replace(/<Row>([\s\S]*?)<\/Row>/g, '{Row({ children: <>\n$1\n</> })}');

// 5. Replace <CommonFields /> with {CommonFields()}
content = content.replace(/<CommonFields \/>/g, '{CommonFields()}');

// 6. Replace <PcFields /> and <PcFields hideStorage={true} /> with {PcFields(...)}
content = content.replace(/<PcFields \/>/g, '{PcFields({})}');
content = content.replace(/<PcFields hideStorage=\{true\} \/>/g, '{PcFields({ hideStorage: true })}');

fs.writeFileSync(filepath, content, 'utf-8');
console.log("Replaced components with function calls and injected checklistType safely!");
