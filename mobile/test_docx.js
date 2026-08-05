
const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const zip = new PizZip();
const doc = new Docxtemplater(zip, { delimiters: { start: '{{', end: '}}' } });
console.log('Options accept delimiters:', doc.options.delimiters);

