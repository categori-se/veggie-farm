function monthDay(value) {
  const match = String(value).match(/^(?:\d{4}-)?(\d{2})-(\d{2})$/);
  if (!match) throw new TypeError(`Invalid seasonal date: ${value}`);
  return Number(`${match[1]}${match[2]}`);
}

function inWindow(day, start, end) {
  return start <= end ? day >= start && day <= end : day >= start || day <= end;
}

export function getSeasonalTasks(tasks, date, {limit = 4} = {}) {
  const day = monthDay(date);
  return tasks
    .filter((task) => inWindow(day, monthDay(task.start), monthDay(task.end)))
    .sort((a, b) => b.priority - a.priority || a.action.localeCompare(b.action))
    .slice(0, limit)
    .map((task) => ({
      ...task,
      reasonCodes: ["SEASONAL_NOTEBOOK_WINDOW"],
      source: "veggie.farm seasonal field notes"
    }));
}
