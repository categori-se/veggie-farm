// Public catalog copy is horticultural information, not a mirror of retailer
// operations. Original assertions and descriptions stay in source archives.
const logistics = /\b(?:shipp?ing|shipped|ship|shipment|deliver(?:y|ed|ies)?|invoice|UPS|Fed\s?Ex|orders?|checkout|refunds?|retail|discount|preassembled|sold|sale|purchas\w*|guarantee|minimum quantity|handling fee|stock availability)\b|\b\d+\s*%\s*off\b|\b(?:each bundle|bundle contains|bundled for savings|quantities vary|size supplied|shape when|our young|our trees|our fig trees|our fruit trees|trees diameter|tree starter kits|we are offering)\b/i;
const operationalParagraph = /^(?:Shipping note|Size supplied|Shape when|Our (?:trees|fig trees|fruit trees)|Each bundle|Please note: We cannot guarantee)/i;
export function growingText(value) {
 if(typeof value!=='string'||!value.trim())return null;
 const text=value.trim();
 if(operationalParagraph.test(text))return null;
 // Repair missing spaces at source sentence boundaries without splitting decimals.
 const normalized=text.replace(/([.!?])(?=[A-Z])/g,'$1 ');
 const sentences=[...new Intl.Segmenter('en',{granularity:'sentence'}).segment(normalized)].map(s=>s.segment.trim());
 const kept=sentences.filter(s=>!logistics.test(s));
 return kept.join(' ').trim()||null;
}
export function growingParagraphs(values=[]) {return [...new Set(values.map(growingText).filter(Boolean))];}
export function publicPlant(record) {
 const additionalFacts=(record.additionalFacts||[]).filter(f=>!logistics.test(f.text||'')).map(f=>({...f}));
 return {...record,description:growingText(record.description),careNotes:growingParagraphs(record.careNotes),additionalFacts};
}
