import {plantingSchedule} from '../lib/garden/plantingSchedule.js';

export function plannerPlantingSchedule({getPlacements, getBedName, getPlantName, onChange}) {
  const root = document.createElement('details');
  root.className = 'planner-planting-schedule';
  root.innerHTML = '<summary>Planting schedule</summary><p>Entered bed occupancy · select a band to preview its first visible day. Dashed bands have an open end. Gaps are unscheduled time, not a planting recommendation.</p><div class="planting-schedule-scroll" tabindex="0" role="region" aria-label="Planting schedule by bed"></div>';
  const scroll = root.querySelector('.planting-schedule-scroll');
  let pending;
  function render() {
    if (!pending || !root.open) return;
    const {year, date} = pending;
    const rows = plantingSchedule(getPlacements(), year);
    const table = document.createElement('table');
    table.innerHTML = '<caption></caption><thead><tr><th scope="col">Bed / plant</th><th scope="col">Planned dates</th><th scope="col"><span class="schedule-months"></span></th></tr></thead><tbody></tbody>';
    table.querySelector('caption').textContent = `${year} · ${rows.length} planting ${rows.length === 1 ? "group" : "groups"}`;
    const months = table.querySelector('.schedule-months');
    let monthIndex = 0;
    for (const name of ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']) {
      const span = document.createElement('span'); span.textContent = name; span.style.flex = String(new Date(Date.UTC(year, ++monthIndex, 0)).getUTCDate()); months.append(span);
    }
    for (const row of rows) {
      const tr = document.createElement('tr'), label = document.createElement('th'), dates = document.createElement('td'), timeline = document.createElement('td');
      label.scope = 'row';
      label.textContent = `${getBedName(row.bedId)} · ${getPlantName(row.plantId)} × ${row.count}`;
      dates.textContent = row.status === 'invalid' ? 'Check entered dates' : row.status === 'undated' ? 'Dates not entered' : `${row.start || 'Start open'} → ${row.end || 'End open'}`;
      timeline.className = 'schedule-track';
      if (row.band) {
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'schedule-band' + (row.band.open ? ' is-open' : '');
        button.style.left = `${row.band.left}%`; button.style.width = `${row.band.width}%`;
        button.setAttribute('aria-label', `${label.textContent}; ${dates.textContent}; preview ${row.band.date}`);
        button.title = button.getAttribute('aria-label');
        button.onclick = () => onChange(row.band.date);
        timeline.append(button);
      } else timeline.textContent = ['invalid','undated'].includes(row.status) ? 'No dated band' : 'Outside this year';
      if (date && Number(date.slice(0,4)) === year) {
        const first = Date.parse(`${date.slice(0,4)}-01-01T00:00:00Z`), last = Date.parse(`${year+1}-01-01T00:00:00Z`);
        const marker = document.createElement('span'); marker.className = 'schedule-date-marker'; marker.style.left = `${100*(Date.parse(date+'T00:00:00Z')-first)/(last-first)}%`;marker.title = `Preview ${date}`;timeline.append(marker);
      }
      tr.append(label, dates, timeline); table.tBodies[0].append(tr);
    }
    const top = scroll.scrollTop, left = scroll.scrollLeft;
    if (rows.length) scroll.replaceChildren(table);
    else { const empty = document.createElement('p'); empty.textContent = 'Add plants, then enter planned planting and last-day dates in the plant inspector.'; scroll.replaceChildren(empty); }
    scroll.scrollTop = top; scroll.scrollLeft = left;
  }
  root.addEventListener('toggle', render);
  return {root, sync(year, date) {pending = {year, date}; render();}};
}
