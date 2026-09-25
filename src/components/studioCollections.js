import {getAccessToken} from '../lib/account/auth.js';
import {createCollectionClient} from '../lib/account/collectionClient.js';
import {selectedSharedGarden} from '../lib/garden/sharedGarden.js';

export function studioCollections({getGarden,copyGarden}) {
  const root=document.createElement('details');root.className='planner-account studio-collections';
  root.innerHTML=`<summary>Shared collections</summary>
    <p>Choose individual gardens to share. Your private account saves and notebook stay separate.</p>
    <div class="collection-controls"><button data-action="refresh">Load collections</button><button data-action="more" hidden>More workspaces</button>
      <label>Workspace <select data-field="workspace"><option value="">Choose a workspace</option></select></label>
      <label>Collection <select data-field="collection"><option value="">Choose a collection</option></select></label><button data-action="open">Open collection</button></div>
    <details><summary>Create a workspace or collection</summary><label>Name <input data-field="name" maxlength="160"></label>
      <button data-action="workspace">Create workspace</button><button data-action="collection">Create collection in selected workspace</button></details>
    <div data-content hidden><h3 data-title></h3><p data-permission></p><ul data-gardens></ul>
      <label>Save current canvas to <select data-field="target"><option value="">New garden in this collection</option></select></label><button data-action="add">Save current garden to draft</button>
      <details data-owner><summary>People and teams</summary>
        <p>Only granted collections are shared. Editors can change drafts; only you can publish or manage access.</p>
        <ul data-grants></ul><label>Team <select data-field="team"><option value="">Direct account access</option></select></label>
        <label>Account email <input data-field="email" type="email" autocomplete="off"></label>
        <label>Access <select data-field="role"><option value="viewer">View</option><option value="editor">View and edit</option><option value="revoke">Revoke allow grant</option></select></label>
        <button data-action="grant">Apply collection access</button>
        <details><summary>Manage workspace teams</summary><label>New team name <input data-field="teamName" maxlength="160"></label><button data-action="team">Create team</button>
          <p>Choose a team and enter an account email above.</p><button data-action="member">Add team member</button><button data-action="revoke-member">Revoke team membership</button><ul data-members></ul></details>
      </details>
      <details data-owner><summary>Publish and recover</summary>
        <p>Public editions include the selected gardens’ locations and geometry. Working notes and parcel attributes are excluded. Editing a draft does not update its public edition.</p>
        <button data-action="preview">Review public edition</button><button data-action="withdraw">Withdraw public edition</button>
        <div data-preview hidden><ul data-preview-gardens></ul><button data-action="download">Download exact preview</button>
          <label><input type="checkbox" data-field="reviewed"> I reviewed these gardens and their locations for public access.</label><button data-action="publish">Publish this reviewed edition</button></div>
        <p data-publication></p><button data-action="history">Load earlier drafts</button><label>Earlier draft <select data-field="version"><option value="">Choose a version</option></select></label><button data-action="restore">Restore selected draft</button>
      </details></div>
    <p role="status" aria-live="polite">Sign in to create or open shared collections. Nothing uploads automatically.</p>`;
  root.querySelectorAll('button').forEach(button=>button.type='button');
  const $=selector=>root.querySelector(selector),field=name=>$(`[data-field="${name}"]`),status=$('[role="status"]');
  const client=createCollectionClient();let session=getAccessToken(),workspace=null,collection=null,preview=null,cursor=null,busy=false;
  const workspacePath=()=>`/workspaces/${field('workspace').value}`;
  const collectionPath=()=>`${workspacePath()}/collections/${field('collection').value}`;
  const clearPreview=()=>{preview=null;$('[data-preview]').hidden=true;$('[data-preview-gardens]').replaceChildren();field('reviewed').checked=false;};
  const clearCollection=()=>{collection=null;clearPreview();$('[data-content]').hidden=true;field('version').replaceChildren(new Option('Choose a version',''));field('target').replaceChildren(new Option('New garden in this collection',''));for(const selector of ['[data-title]','[data-permission]','[data-publication]','[data-grants]','[data-gardens]'])$(selector).replaceChildren();};
  const check=()=>{
    if(session===getAccessToken())return;
    session=getAccessToken();workspace=null;cursor=null;clearCollection();
    field('workspace').replaceChildren(new Option('Choose a workspace',''));field('collection').replaceChildren(new Option('Choose a collection',''));
    field('team').replaceChildren(new Option('Direct account access',''));
    field('email').value='';field('name').value='';field('teamName').value='';
    $('[data-grants]').replaceChildren();$('[data-members]').replaceChildren();$('[data-gardens]').replaceChildren();
    status.textContent='Account changed. Reload your collections.';
  };
  const messages={revision_conflict:'Someone changed this workspace. Your canvas is unchanged. Reload the collection before saving again.',preview_changed:'The draft changed. Review a fresh public preview.',sign_in_required:'Sign in to use shared collections.',session_changed:'Account changed. Reload your collections.',verified_account_required:'Use the email of an existing, enabled account with a verified email.',not_found:'This collection is unavailable or your access was removed.',request_too_large:'This selection exceeds the 2 MiB limit. Keep a JSON backup.',workspace_full:'This workspace has reached its size limit. Create another workspace.'};
  const run=async task=>{
    check();if(busy)return;busy=true;root.querySelectorAll('button,input,select').forEach(node=>node.disabled=true);
    try{await task();}catch(error){check();status.textContent=messages[error.code] || 'Could not complete this action. Your canvas is unchanged.';}
    finally{busy=false;root.querySelectorAll('button,input,select').forEach(node=>node.disabled=false);renderPermissions();}
  };
  function renderPermissions(){
    $('[data-action="add"]').disabled=!collection?.actions?.includes('edit');
    root.querySelectorAll('[data-owner]').forEach(node=>node.hidden=!collection?.canPublish);
    $('[data-action="publish"]').disabled=!preview || !field('reviewed').checked;
  }
  async function list(append=false){
    const value=await client.request('GET','/workspaces'+(append&&cursor?'?cursor='+encodeURIComponent(cursor):''));
    if(!append){workspace=null;clearCollection();field('workspace').replaceChildren(new Option('Choose a workspace',''));field('collection').replaceChildren(new Option('Choose a collection',''));}
    for(const item of value.workspaces)field('workspace').add(new Option(`${item.name}${item.owner?' · yours':' · shared'}`,item.id));
    cursor=value.nextCursor;$('[data-action="more"]').hidden=!cursor;status.textContent='Choose a workspace to see its collections.';
  }
  async function loadWorkspace(keepCollection=false){
    if(!field('workspace').value)throw Error('Choose a workspace');
    const selected=keepCollection?field('collection').value:'';
    workspace=await client.request('GET',workspacePath());clearCollection();
    field('collection').replaceChildren(new Option('Choose a collection',''));
    for(const item of workspace.collections)field('collection').add(new Option(item.name,item.id));
    field('collection').value=selected;
    field('team').replaceChildren(new Option('Direct account access',''));
    for(const item of workspace.teams || [])field('team').add(new Option(item.name,item.id));
    renderMembers();status.textContent='Workspace loaded. Choose a collection.';
  }
  function renderMembers(){
    $('[data-members]').replaceChildren();const team=workspace?.teams?.find(item=>item.id===field('team').value);
    for(const member of team?.members || []){const li=document.createElement('li');li.textContent=`${member.email} · ${member.status}`;$('[data-members]').append(li);}
  }
  async function open(){
    if(!field('collection').value)throw Error('Choose a collection');
    collection=await client.request('GET',collectionPath());workspace.revision=collection.revision;clearPreview();
    $('[data-content]').hidden=false;$('[data-title]').textContent=collection.name;
    $('[data-permission]').textContent=collection.canPublish?'Owned collection · private draft':collection.actions.includes('edit')?'Shared with you · can edit draft':'Shared with you · view only';
    $('[data-gardens]').replaceChildren();
    field('target').replaceChildren(new Option('New garden in this collection',''));
    for(const garden of collection.gardens){
      field('target').add(new Option(`Replace ${garden.name}`,garden.id));
      const li=document.createElement('li'),label=document.createElement('span'),button=document.createElement('button');
      label.textContent=`${garden.name} · ${garden.beds.length} beds `;button.type='button';button.textContent='Make a personal copy';
      button.onclick=()=>run(async()=>{await client.request('GET',collectionPath());copyGarden(garden);field('target').value=garden.id;status.textContent='Personal copy opened in your canvas. Save it explicitly to replace the selected shared draft garden; the public edition stays unchanged.';});
      li.append(label,button);$('[data-gardens]').append(li);
    }
    $('[data-grants]').replaceChildren();
    for(const grant of collection.grants || []){const li=document.createElement('li');li.textContent=`${grant.subject_email || workspace.teams?.find(t=>t.id===grant.subject_id)?.name || 'Team'} · ${grant.effect} ${grant.actions.join(', ')} · ${grant.status}`;$('[data-grants]').append(li);}
    const publication=$('[data-publication]');publication.replaceChildren();
    if(collection.publication){publication.append(`Published ${collection.publication.publishedAt}. `);const a=document.createElement('a');a.href=`/studio?publicWorkspace=${encodeURIComponent(workspace.id)}&publicCollection=${encodeURIComponent(collection.id)}`;a.textContent='Public collection';publication.append(a);}
    else publication.textContent='No active public edition.';
    renderPermissions();status.textContent='Collection loaded. Uploads and publication are explicit.';
  }
  async function mutation(suffix,method,input){
    const value=await client.request(method,collectionPath()+suffix,input,collection.revision);workspace.revision=value.revision;await open();return value;
  }
  const actions={
    refresh:()=>list(),more:()=>list(true),open,
    workspace:async()=>{const value=await client.request('POST','/workspaces',{name:field('name').value});await list();field('workspace').value=value.id;await loadWorkspace();},
    collection:async()=>{const value=await client.request('POST',workspacePath()+'/collections',{name:field('name').value},workspace?.revision);await loadWorkspace();field('collection').value=value.id;await open();},
    add:async()=>{
      const garden=selectedSharedGarden(getGarden()),gardens=structuredClone(collection.gardens),target=field('target').value;
      if(target){garden.id=target;garden.property.id=target;}
      const index=gardens.findIndex(item=>item.id===garden.id);
      if(!window.confirm(`${index<0?'Add':'Replace'} “${garden.name}” in this shared draft? Its location, geometry and working notes will be visible to collaborators. Your notebook and other gardens are excluded.`))return;
      if(index<0)gardens.push(garden);else gardens[index]=garden;
      await mutation('','PUT',{name:collection.name,gardens});status.textContent='Shared draft saved. Public edition is unchanged.';
    },
    grant:async()=>{const role=field('role').value;await mutation('/grants','PUT',{...(field('team').value?{teamId:field('team').value}:{email:field('email').value}),actions:role==='editor'?['view','edit']:['view'],effect:'allow',status:role==='revoke'?'revoked':'active'});},
    team:async()=>{await client.request('POST',workspacePath()+'/teams',{name:field('teamName').value},workspace.revision);await loadWorkspace(true);await open();},
    member:()=>membership('active'),'revoke-member':()=>membership('revoked'),
    preview:async()=>{
      preview=await client.request('GET',collectionPath()+'/preview');
      $('[data-preview-gardens]').replaceChildren();
      for(const garden of preview.publication.gardens){const li=document.createElement('li');const origin=garden.property.localOrigin;li.textContent=`${garden.name} · ${garden.beds.length} beds · location ${origin?`${origin.lat}, ${origin.lon}`:'not recorded'}`;$('[data-preview-gardens]').append(li);}
      $('[data-preview]').hidden=false;field('reviewed').checked=false;status.textContent='Review the gardens and locations. Download the exact preview to inspect all public fields.';
    },
    download:async()=>{if(!preview)return;const url=URL.createObjectURL(new Blob([JSON.stringify(preview.publication,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='garden-collection-public-preview.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},
    publish:async()=>{if(preview && field('reviewed').checked){await client.request('POST',collectionPath()+'/publish',{sha256:preview.sha256},preview.revision);await open();status.textContent='Reviewed edition published. Future draft edits stay private until you publish again.';}},
    withdraw:async()=>{if(window.confirm('Withdraw this collection’s public edition? Previously downloaded copies cannot be recalled.'))await mutation('/publish','DELETE');},
    history:async()=>{const value=await client.request('GET',collectionPath()+'/history');field('version').replaceChildren(new Option('Choose a version',''));for(const item of value.versions)field('version').add(new Option(`${item.updatedAt} · ${item.name} · ${item.gardenCount} gardens`,item.version));status.textContent=value.truncated?'Showing up to ten recent workspace versions. Older versions remain in storage.':'Draft history loaded.';},
    restore:async()=>{if(field('version').value && window.confirm('Restore this earlier draft? Current access permissions and public edition will stay unchanged.'))await mutation('/restore','POST',{version:field('version').value});}
  };
  async function membership(memberStatus){
    if(!field('team').value)throw Error('Choose a team');
    await client.request('PUT',workspacePath()+'/teams/'+field('team').value,{email:field('email').value,status:memberStatus},workspace.revision);
    await loadWorkspace(true);await open();
  }
  root.querySelectorAll('[data-action]').forEach(button=>button.onclick=()=>run(actions[button.dataset.action]));
  field('workspace').onchange=()=>run(()=>loadWorkspace());field('collection').onchange=clearCollection;
  field('team').onchange=renderMembers;field('reviewed').onchange=renderPermissions;root.addEventListener('focusin',check);
  const timer=setInterval(()=>{if(!root.isConnected){clearInterval(timer);return;}check();},1000);
  return root;
}
