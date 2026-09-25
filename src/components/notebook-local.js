import {notebookPayload, importNotebookDraft} from '../lib/account/notebookCloud.js';
export function localNotebookControls(){
 const root=document.createElement('section');root.className='decision-workbench';
 root.innerHTML='<h2>Browser-local notebook</h2><p>No account is required. Records stay on this device. Export a backup before clearing browser data.</p><button type="button">Export notebook</button><p><label>Import notebook <input type="file" accept="application/json,.json"></label></p><p role="status"></p>';
 const status=root.querySelector('[role=status]');
 root.querySelector('button').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(notebookPayload(),null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='garden-notebook.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 root.querySelector('input').onchange=async e=>{try{const file=e.target.files?.[0];if(!file)return;if(file.size>2000000)throw Error('Notebook backups are limited to 2 MB.');const data=JSON.parse(await file.text());if(!confirm('Merge this backup with this browser’s notebook? Existing records with the same IDs will be kept.'))return;await importNotebookDraft(data);status.textContent='Imported and saved in this browser.';}catch(error){status.textContent=error.message;}};
 return root;
}
