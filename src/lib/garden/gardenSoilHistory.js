import {soilHistoryRows} from './soilTestHistory.js';
export function linkSoilReport(workspace,bedId,report,revision){
 if(!workspace.beds?.some(b=>b.id===bedId))throw Error('Choose a bed in this garden.');
 if(!report||typeof report.id!=='string'||!report.id||report.id.length>160)throw Error('Choose a saved soil report.');
 const reports=workspace.property?.soilReports||[];
 if(reports.some(r=>r.notebookOrigin?.id===report.id))throw Error('This report is already linked in this garden. Unlink it before changing its bed.');
 const normalized=soilHistoryRows([report])[0];if(!normalized.date)throw Error('The report needs a valid sample date before linking.');
 const row={id:report.id,bedId,date:normalized.date,ph:normalized.ph,source:'linked_notebook_soil_report',notebookOrigin:{id:report.id,revision:typeof revision==='string'?revision:null,bed:String(report.bed||'').slice(0,80)}};
 for(const [key,max] of Object.entries({laboratory:160,organicMatter:160,phosphorus:160,potassium:160,report:10000}))row[key]=String(report[key]||'').slice(0,max);
 return {...workspace,property:{...workspace.property,soilReports:[...reports,row]}};
}
export function unlinkSoilReport(workspace,id){
 if(!workspace.property?.soilReports?.some(r=>r.notebookOrigin?.id===id))throw Error('This soil report link is no longer present.');
 return {...workspace,property:{...workspace.property,soilReports:workspace.property.soilReports.filter(r=>r.notebookOrigin?.id!==id)}};
}
export function gardenSoilGroups(workspace,year,today){
 if(!Number.isInteger(year)||year<1900||year>2200||!soilHistoryRows([{date:today}])[0].date)return [];
 const beds=new Set(workspace.beds?.map(b=>b.id)),end=`${year}-12-31`,groups=new Map();
 for(const row of soilHistoryRows(workspace.property?.soilReports||[])){
  if(row.source!=='linked_notebook_soil_report'||!row.notebookOrigin?.id||!beds.has(row.bedId)||!row.date||row.date>end||row.date>today)continue;
  row.laboratory=row.laboratory.trim()||'Lab not recorded';
  const key=JSON.stringify([row.bedId,row.laboratory]);if(!groups.has(key))groups.set(key,{bedId:row.bedId,laboratory:row.laboratory,rows:[]});groups.get(key).rows.push(row);
 }
 return [...groups.values()].map(group=>{const dated=group.rows.filter(r=>r.ph!==null);return {...group,phSequence:group.laboratory!=='Lab not recorded'&&dated.length>1&&new Set(dated.map(r=>r.date)).size===dated.length?dated.map(r=>r.ph):null};});
}
