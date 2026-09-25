// Shared working-tree/history/build boundary. Patterns are a guard, not rights clearance.
export function publicFileIssues(name,body,{mode='100644'}={}){
 const failures=[],lower=name.toLowerCase();
 if(/[\x00-\x1f\\]/.test(name))failures.push('unsupported control character or path separator');
 if(mode==='120000'||mode==='160000')failures.push('symlink or nested repository');
 if(/^(?:services|infrastructure|vendor|tools|\.launch-private|\.ai-studio|\.agents|\.codex|node_modules|dist|private-data|local-data)(?:\/|$)/.test(lower))failures.push('excluded source directory');
 if(/^(?:data\/raw|data\/spatial\/source-cache|data\/spatial\/sources|src\/data\/spatial\/sources|docs\/launch|docs\/archive)(?:\/|$)/.test(lower))failures.push('private/generated history');
 if(/\.(?:png|jpe?g|webp|gif|avif|svg|ico|glb|gltf|obj|fbx|woff2?|ttf|otf|mp[34]|webm|wav|pdf|zip|kmz|tiff?|gpkg|sqlite|db)$/i.test(name))failures.push('media, archive or database');
 if(/(?:^|\/)(?:\.env(?:\..*)?|auth-config\.json|account-config\.json|media-config\.json|deploy-config\.json)$/.test(lower)&&!lower.endsWith('.env.example'))failures.push('private configuration');
 if(body.includes(0))failures.push('binary content');
 if(body.length>20_000_000)failures.push('file exceeds source size bound');
 const text=body.toString('utf8');
 if([/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,/\bgh[pousr]_[A-Za-z0-9]{30,}\b/,/\bgithub_pat_[A-Za-z0-9_]{30,}/,/\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}/,/(?:X-Amz-Signature|X-Goog-Signature)=[0-9a-f]{20,}/,/\/(?:home|Users)\/[A-Za-z0-9_.-]+\//].some(p=>p.test(text)))failures.push('sensitive pattern (value suppressed)');
 return failures;
}
