// Only explicitly supplied product destinations become shopping links.
export function catalogProductLinks(record) {
  const box=document.createElement('div');box.className='catalog-purchase-links';
  for(const entry of record.purchaseLinks || []) {
    try {
      const url=new URL(entry.url);
      if(url.protocol!=='https:' || url.username || url.password || url.pathname==='/')continue;
      const link=document.createElement('a');link.textContent='View product ↗';link.href=url.href;
      link.target='_blank';link.rel='noopener noreferrer';box.append(link);
    } catch {}
  }
  return box;
}
