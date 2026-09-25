// Preview positions without changing the garden, so an empty result or a
// cancelled replacement cannot erase existing plantings.
export function bedFillPositions(bed, plant) {
  const spacing = Math.max(plant.spacing * bed.crowding, plant.matureDiameter * 0.45);
  const margin = bed.safeMargin + spacing / 2;
  if (![spacing, margin, bed.width, bed.height].every(Number.isFinite) || spacing <= 0 || margin < 0) return [];
  const positions = [];
  let row = 0;
  for (let y = margin; y <= bed.height - margin; y += spacing * 0.88) {
    const offset = row % 2 ? spacing * 0.5 : 0;
    for (let x = margin + offset; x <= bed.width - margin; x += spacing) {
      positions.push({x, y});
      if (positions.length === 160) return positions;
    }
    row++;
  }
  return positions;
}
