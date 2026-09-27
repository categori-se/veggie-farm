// Deterministic compatibility key for older catalog links. Garden records need
// not be rewritten just to resolve a report or compare a saved selection.
export function catalogIdentity(value) {
  if (typeof value !== 'string' || !/^plant:[^:]+:/.test(value) || /^plant:(?:community|catalog|openfarm):/.test(value)) return value;
  let hash = 14695981039346656037n;
  for (const byte of new TextEncoder().encode(value)) hash = BigInt.asUintN(64, (hash ^ BigInt(byte)) * 1099511628211n);
  return `plant:catalog:${hash.toString(16).padStart(16,'0')}`;
}
