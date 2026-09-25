// A profile edit timestamp is not a measurement timestamp. Legacy readings
// remain undated; only a same-calendar-day measurement informs today's status.
export function measurementDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(value+'T12:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value ? value : null;
}
export function soilReadingContext(profile, today) {
  const value = profile?.soilTemperatureF;
  if (typeof value !== 'number' || !Number.isFinite(value)) return {status:'missing',value:null,date:null,ageDays:null};
  const date = measurementDate(profile.soilTemperatureMeasuredOn);
  if (!date || !measurementDate(today)) return {status:'undated',value,date,ageDays:null};
  const ageDays = Math.round((Date.parse(today+'T12:00:00Z')-Date.parse(date+'T12:00:00Z'))/86400000);
  return {status:ageDays===0?'today':ageDays>0?'older':'future',value,date,ageDays};
}
