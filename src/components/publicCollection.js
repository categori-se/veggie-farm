import {createCollectionClient} from '../lib/account/collectionClient.js';
import {validateSharedGarden} from '../lib/garden/sharedGarden.js';

// Editions are fetched without credentials. The default reference may initialize
// a fresh guest canvas; existing experiments require an explicit replace action.
export function publicCollection({copyGarden,reference,onReference,autoLoad=false,search=globalThis.location.search}={}) {
  const params=new URLSearchParams(search),explicit=params.has('publicWorkspace') || params.has('publicCollection');
  const workspace=explicit?params.get('publicWorkspace'):reference?.workspaceId;
  const collection=explicit?params.get('publicCollection'):reference?.collectionId;
  if(!workspace && !collection)return null;
  const root=document.createElement(explicit?'section':'details');root.className='planner-account public-collection';
  if(!explicit){const summary=document.createElement('summary');summary.textContent='Published public examples';root.append(summary);}
  const heading=document.createElement('h2'),status=document.createElement('p'),list=document.createElement('ul');
  heading.textContent='Published garden collection';status.textContent='Open to load the current public edition.';status.setAttribute('role','status');root.append(heading,status,list);
  const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
  if(!uuid.test(workspace || '') || !uuid.test(collection || '')){status.textContent='This collection link is incomplete.';return root;}
  const client=createCollectionClient();let loading=false,loaded=false;
  const load=async()=>{
    if(loading || loaded)return;loading=true;status.textContent='Loading public edition…';
    try{
      const edition=await client.request('GET',`/public/collections/${workspace}/${collection}`,undefined,undefined,{publicRead:true});
      if(!Array.isArray(edition.gardens) || edition.gardens.length>20)throw Error('Invalid edition');
      edition.gardens.forEach(validateSharedGarden);loaded=true;
      const date=new Date(edition.publishedAt).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});
      heading.textContent=edition.name;status.textContent=`Published ${date}. Editable copies do not change this public edition.`;
      if(!explicit){
        root.querySelector('summary').textContent=`Published public examples · ${edition.gardens.length} gardens`;
        const open=document.createElement('button');open.type='button';open.textContent='Open published examples in canvas';
        open.onclick=()=>{if(window.confirm('Replace local demo experiments with the published examples? Your personal gardens stay unchanged. Download a backup first to keep any demo edits.'))onReference?.(edition,true);};
        status.after(open);onReference?.(edition,false);
      }
      for(const garden of edition.gardens){
        const li=document.createElement('li'),name=document.createElement('strong'),details=document.createElement('p'),button=document.createElement('button');
        name.textContent=garden.name;details.textContent=`${garden.beds.length} beds · ${garden.placements.length} plantings. ${garden.property.source || 'Published garden design.'}`;
        button.type='button';button.textContent='Open an editable copy';button.onclick=()=>{copyGarden(garden);status.textContent='Editable copy opened in your canvas. The published edition is unchanged.';};
        li.append(name,details,button);list.append(li);
      }
    }catch{list.replaceChildren();status.textContent=explicit?'This public edition is unavailable or has been withdrawn. Your private gardens are unchanged.':'The published edition could not be loaded. The canvas retains its bundled reference or local experiment; personal gardens are unchanged.';}
    finally{loading=false;}
  };
  if(explicit || autoLoad)void load();else root.addEventListener('toggle',()=>{if(root.open)void load();});
  return root;
}
