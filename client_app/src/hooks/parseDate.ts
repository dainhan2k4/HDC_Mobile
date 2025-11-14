const parseDate = (dateStr: string): Date => {
  if (!dateStr) {
    throw new Error('Empty date string');
  }

  const normalized = dateStr.trim();

  // Format: "dd/mm/yyyy, HH:MM"
  if (normalized.includes('/')) {
    const [datePart, timePart] = normalized.split(',');
    const [dayStr, monthStr, yearStr] = datePart.trim().split(/[\/\-]/);

    const day = Number(dayStr);
    const month = Number(monthStr);
    const year = Number(yearStr);

    if (Number.isFinite(day) && Number.isFinite(month) && Number.isFinite(year)) {
      let hours = 0;
      let minutes = 0;

      if (timePart) {
        const [hourStr, minuteStr] = timePart.trim().split(':');
        hours = Number(hourStr);
        minutes = Number(minuteStr);
        hours = Number.isFinite(hours) ? hours : 0;
        minutes = Number.isFinite(minutes) ? minutes : 0;
      }

      return new Date(year, month - 1, day, hours, minutes);
    }
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Cannot parse date: ${dateStr}`);
  }
  return parsed;
};

export default parseDate;
  