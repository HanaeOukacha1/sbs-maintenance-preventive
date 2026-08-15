const fs = require('fs');
const filepath = 'c:/Users/hanae/Desktop/Stage PFA 2026/mobile/src/components/FicheInterventionModal.tsx';
let content = fs.readFileSync(filepath, 'utf-8');

// Replace <F ... /> with F({ ... })
content = content.replace(/<F label="([^"]+)" k="([^"]+)"(?: placeholder="([^"]+)")?( numeric)? \/>/g, (match, label, k, placeholder, numeric) => {
    let args = `{ label: '${label}', k: '${k}'`;
    if (placeholder) args += `, placeholder: '${placeholder}'`;
    if (numeric) args += `, numeric: true`;
    args += ' }';
    return `{F(${args})}`;
});

// Replace <Flex ... /> with Flex({ ... })
content = content.replace(/<Flex label="([^"]+)" k="([^"]+)"(?: placeholder="([^"]+)")?( numeric)? \/>/g, (match, label, k, placeholder, numeric) => {
    let args = `{ label: '${label}', k: '${k}'`;
    if (placeholder) args += `, placeholder: '${placeholder}'`;
    if (numeric) args += `, numeric: true`;
    args += ' }';
    return `{Flex(${args})}`;
});

// Replace <Row>...</Row> with {Row({ children: <>...</> })}
// We can use a simple regex if there's no nested Row. (There are no nested Rows).
content = content.replace(/<Row>([\s\S]*?)<\/Row>/g, '{Row({ children: <>\n$1\n</> })}');

// Replace <CommonFields /> with {CommonFields()}
content = content.replace(/<CommonFields \/>/g, '{CommonFields()}');

// Replace <PcFields /> and <PcFields hideStorage={true} /> with {PcFields(...)}
content = content.replace(/<PcFields \/>/g, '{PcFields({})}');
content = content.replace(/<PcFields hideStorage=\{true\} \/>/g, '{PcFields({ hideStorage: true })}');

fs.writeFileSync(filepath, content, 'utf-8');
console.log("Replaced components with function calls");
