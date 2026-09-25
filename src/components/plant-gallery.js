// Progressive enhancement: authored photographs and complete credits remain
// readable without JavaScript. Source metadata is never interpreted as HTML.
export function enhancePlantGallery({invalidation} = {}) {
  const cleanups = [];
  for (const gallery of document.querySelectorAll('.plant-stage-gallery:not([data-enhanced])')) {
    const figures = [...gallery.querySelectorAll('.plant-stage-strip > figure')];
    if (!figures.length) continue;
    gallery.dataset.enhanced = 'true';
    const dialog = document.createElement('dialog');
    dialog.className = 'plant-photo-dialog';
    dialog.setAttribute('aria-label', 'Plant photograph and source');
    const controls = document.createElement('div'); controls.className = 'plant-photo-controls';
    const makeButton = (label) => {const button=document.createElement('button');button.type='button';button.textContent=label;return button;};
    const previous=makeButton('Previous photo'), next=makeButton('Next photo'), close=makeButton('Close');
    const position=document.createElement('span');position.setAttribute('aria-live','polite');
    controls.append(previous,position,next,close);
    const body=document.createElement('div');dialog.append(controls,body);gallery.append(dialog);
    let active=0;
    const show = index => {
      const replacingFocusedCaption = body.contains(document.activeElement);
      active=(index+figures.length)%figures.length;
      const figure=figures[active].cloneNode(true);
      const trigger=figure.querySelector('button');
      if(trigger)trigger.replaceWith(trigger.querySelector('img'));
      const caption=figure.querySelector('figcaption');caption.hidden=false;
      figure.querySelector('.plant-stage-label')?.remove();
      body.replaceChildren(figure);position.textContent=`${active+1} of ${figures.length}`;
      if(!dialog.open)dialog.showModal();
      else if(replacingFocusedCaption)next.focus();
    };
    figures.forEach((figure,index)=>{
      const img=figure.querySelector('img'),caption=figure.querySelector('figcaption');
      const button=makeButton('');button.setAttribute('aria-label',`Look closer: ${figure.dataset.stage}`);button.setAttribute('aria-haspopup','dialog');
      img.before(button);button.append(img);
      const label=document.createElement('span');label.className='plant-stage-label';label.textContent=figure.dataset.stage;button.append(label);
      caption.hidden=true;button.addEventListener('click',()=>show(index));
    });
    previous.addEventListener('click',()=>show(active-1));next.addEventListener('click',()=>show(active+1));close.addEventListener('click',()=>dialog.close());
    dialog.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();show(active+(event.key==='ArrowRight'?1:-1));}});
    cleanups.push(()=>{dialog.close();dialog.remove();for(const f of figures){const b=f.querySelector('button');b.replaceWith(b.querySelector('img'));f.querySelector('figcaption').hidden=false;}delete gallery.dataset.enhanced;});
  }
  if(invalidation)invalidation.then(()=>cleanups.forEach(fn=>fn()));
}
