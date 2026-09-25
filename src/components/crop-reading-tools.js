// A single action surface moves between the desktop contents rail and mobile
// disclosure. It routes to existing controls; private notebook state stays there.
export function mountCropReadingTools({invalidation} = {}) {
  let root, profile, observer;
  const desktop = matchMedia('(min-width: 1200px)');
  const position = () => {
    if (!root || !profile?.isConnected) return;
    const toc = document.querySelector('#observablehq-toc');
    if (desktop.matches && toc) {
      if (root.parentNode !== toc) toc.prepend(root);
      root.open = true;
    } else {
      if (root.parentNode !== profile.parentNode) profile.before(root);
      root.open = false;
    }
  };
  const reveal = target => {
    if (!target) return;
    for (let node = target; node; node = node.parentElement) if (node.tagName === 'DETAILS') node.open = true;
    target.scrollIntoView({block:'center', behavior:'smooth'});
    target.focus({preventScroll:true});
  };
  const mount = () => {
    profile = document.querySelector('.crop-dashboard,.fruit-dashboard');
    if (!profile || root) return;
    const main = document.querySelector('#observablehq-main');
    const actions = main?.querySelector('.garden-actions');
    if (!actions) return; // Wait for the existing notebook controls to mount.
    root = document.createElement('details');root.className = 'crop-reading-tools';
    const summary = document.createElement('summary');summary.textContent = 'Use this guide';root.append(summary);
    const controls = document.createElement('div');root.append(controls);
    const button = (label, action) => {const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=action;controls.append(b);};
    profile.tabIndex = -1;
    button('Growing facts', () => reveal(profile));
    const evidence = profile.querySelector('[data-crop-evidence]') || [...main.querySelectorAll('h2')].find(h => /^Sources?\b/i.test(h.textContent));
    if (evidence) {evidence.tabIndex=-1;button('Sources & context',()=>reveal(evidence));}
    button('Record an observation',()=>{
      const observe=[...actions.querySelectorAll('button')].find(b=>b.textContent==='Observe');
      if(observe){reveal(observe);observe.click();}
    });
    const existing = profile.querySelector('a[href*="plant-database"]');
    const name = main.querySelector('h1')?.textContent.replace(/^Growing\s+/,'').trim() || '';
    const fruitSearch={'Apples':'apple','Pears':'pear','Plums':'plum','Sour Cherries':'cherry','Blueberries':'blueberry','Raspberries':'raspberry','Black Currants':'currant','Gooseberries':'gooseberry','Strawberries':'strawberry','Ground Cherries':'ground cherry'};
    const compare = document.createElement('a');compare.textContent='Compare varieties';
    compare.href=existing?.href || '/content/reference/plant-database?search='+encodeURIComponent(fruitSearch[name] || name);controls.append(compare);
    position();observer.disconnect();
  };
  observer=new MutationObserver(mount);observer.observe(document.querySelector('#observablehq-main')||document.body,{childList:true,subtree:true});
  desktop.addEventListener('change',position);mount();
  invalidation?.then(()=>{observer.disconnect();desktop.removeEventListener('change',position);root?.remove();});
}
