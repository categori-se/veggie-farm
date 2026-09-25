// Explicit planning scenarios, not diagnoses or calibrated probability models.
export function sunDecision(hours) {
  if (hours === '' || hours == null || !Number.isFinite(Number(hours)) || +hours < 0 || +hours > 16) return {label: 'Measure first', plants: [], note: 'Enter 0–16 hours of direct sun measured on a representative growing-season day.'};
  if (+hours < 3) return {label: 'Too little light for this vegetable shortlist', plants: [], note: 'Try a brighter location or containers. This tool does not evaluate woodland ornamentals.'};
  if (+hours < 6) return {label: 'Trial leafy crops', plants: ['Leaf lettuce', 'Spinach', 'Collards', 'Swiss chard', 'Kale'], note: 'These crops tolerate partial shade. Start with a small trial; tolerance does not promise the yield of a sunny bed. Tree roots also compete for water.'};
  return {label: 'A sunny vegetable bed', plants: ['Tomatoes', 'Peppers', 'Cucumbers', 'Beans', 'Leafy greens'], note: 'At least six hours opens more choices. Check seasonal shade, mature spacing, temperature and water before choosing a crop.'};
}
export function parseGardenDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return null;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(+date) && date.toISOString().slice(0,10) === value ? date : null;
}
export function harvestWindow({startDate, minimumDays, maximumDays, firstFrost = ''}) {
  const start = parseGardenDate(startDate), frost = firstFrost ? parseGardenDate(firstFrost) : null;
  if (!start || (firstFrost && !frost) || minimumDays === '' || maximumDays === '' || !Number.isInteger(+minimumDays) || !Number.isInteger(+maximumDays) || +minimumDays < 1 || +maximumDays < +minimumDays || +maximumDays > 730) return {error: 'Enter a real start date and a whole-day maturity range from 1 to 730 days; the upper value must not be smaller. Frost date is optional.'};
  const earliest = new Date(+start + +minimumDays * 86400000).toISOString().slice(0,10);
  const latest = new Date(+start + +maximumDays * 86400000).toISOString().slice(0,10);
  return {earliest, latest, frostOverlap: frost ? latest >= firstFrost : null};
}
export const companionOptions = {
  space: {title: 'Lettuce before a tomato canopy closes', action: 'Plan to harvest the lettuce before the tomato occupies its mature space. Mark both footprints and the removal date.', measure: 'Record lettuce harvest and the date tomato leaves begin shading the row.', limit: 'This is a space-and-timing arrangement, not a promise of improved flavor or pest control.'},
  habitat: {title: 'Flowers beside the food garden', action: 'Keep a sequence of flowers near crops to support adult beneficial insects. Leave access for scouting.', measure: 'Count flower visitors and pest damage in the same small area each week.', limit: 'Visitors do not prove pest suppression; small gardens may see only modest benefits.'},
  succession: {title: 'An early crop makes room for the next', action: 'Choose a short-season crop and reserve a realistic harvest-to-replant interval. Keep a second sowing small enough to manage.', measure: 'Record bed-clear date, next sowing and days to the first useful harvest.', limit: 'Do not assume a preceding legume supplies all the next crop’s nitrogen. Use soil evidence.'}
};
export const pruningOptions = {
  unknown: {title: 'Identify before cutting', action: 'Record the species, cultivar, bloom season and whether flowers or fruit form on old or new growth. Use the matching crop guide before selecting a pruning system.'},
  apple: {title: 'Apple: plan structural work in late dormancy', action: 'Use late winter, before new growth, as the general structural-pruning window. Photograph crossing branches and the tree’s training system first. Suspected disease needs its own pruning guidance.'},
  spring: {title: 'Spring-flowering shrub: preserve last year’s buds', action: 'For shrubs such as lilac and forsythia, plan pruning just after flowering. Cutting earlier can remove the coming display.'},
  newwood: {title: 'Confirmed new-wood flowering shrub', action: 'For a species confirmed to bloom on the current season’s growth, plan pruning before new spring growth. Species and cultivar still determine how much to remove.'},
  cane: {title: 'Raspberry: determine the bearing system first', action: 'Summer-bearing and fall-bearing systems use different canes. Label which canes fruited before following the raspberry guide; a blanket annual cut can remove a summer crop.'}
};
export function diseaseDecision({wet = false, crowded = false, symptoms = false} = {}) {
  const actions = [];
  if (wet) actions.push('Water the root zone and allow foliage to dry. Delay handling wet plants.');
  if (crowded) actions.push('Check mature spacing and supports; reduce crowding without stripping the plant.');
  if (symptoms) actions.push('Photograph both leaf surfaces and the whole plant; record the host, first symptom date and spread. Seek identification before selecting a treatment.');
  if (!actions.length) actions.push('Keep a regular scouting record. No checked condition does not establish that the plant is disease-free.');
  return {title: symptoms ? 'Investigate the symptoms' : 'Reduce favorable conditions', actions, note: 'Weather and crowding are clues, not a diagnosis. Powdery mildew can spread with dry leaf surfaces; a dry leaf does not rule it out. A treatment must match the identified problem.'};
}
