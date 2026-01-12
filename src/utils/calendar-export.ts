import { format, addDays } from "date-fns";

export interface CycleEvent {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  type: 'period' | 'fertile' | 'ovulation' | 'prediction';
}

// Generate a unique ID for calendar events
const generateUID = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@periodtracker.app`;
};

// Format date for iCalendar (YYYYMMDD format)
const formatICSDate = (date: Date): string => {
  return format(date, "yyyyMMdd");
};

// Generate iCalendar file content
export const generateICSContent = (events: CycleEvent[]): string => {
  const icsEvents = events.map((event) => {
    const startDate = formatICSDate(event.startDate);
    const endDate = formatICSDate(addDays(event.endDate, 1)); // iCal uses exclusive end date

    return `BEGIN:VEVENT
UID:${generateUID()}
DTSTAMP:${formatICSDate(new Date())}T000000Z
DTSTART;VALUE=DATE:${startDate}
DTEND;VALUE=DATE:${endDate}
SUMMARY:${event.title}
DESCRIPTION:${event.description}
CATEGORIES:${event.type.toUpperCase()}
STATUS:CONFIRMED
TRANSP:TRANSPARENT
END:VEVENT`;
  }).join('\n');

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Period Tracker//Cycle Events//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Period Tracker
X-WR-TIMEZONE:UTC
${icsEvents}
END:VCALENDAR`;
};

// Download ICS file
export const downloadICSFile = (events: CycleEvent[], filename: string = 'cycle-events.ics') => {
  const content = generateICSContent(events);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Generate Google Calendar URL for a single event
export const generateGoogleCalendarURL = (event: CycleEvent): string => {
  const baseURL = 'https://calendar.google.com/calendar/render';
  const startDate = formatICSDate(event.startDate);
  const endDate = formatICSDate(addDays(event.endDate, 1));
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${startDate}/${endDate}`,
    details: event.description,
    trp: 'false',
  });

  return `${baseURL}?${params.toString()}`;
};

// Generate events from cycle data
export const generateCycleEvents = (
  lastPeriodDate: string | null,
  averageCycleLength: number,
  averagePeriodLength: number,
  monthsAhead: number = 3
): CycleEvent[] => {
  if (!lastPeriodDate) return [];

  const events: CycleEvent[] = [];
  let currentPeriodStart = new Date(lastPeriodDate);

  for (let i = 0; i < monthsAhead; i++) {
    // Period event
    const periodEnd = addDays(currentPeriodStart, averagePeriodLength - 1);
    events.push({
      title: '🩸 Period',
      description: `Predicted period (Day 1-${averagePeriodLength} of cycle)`,
      startDate: currentPeriodStart,
      endDate: periodEnd,
      type: 'period',
    });

    // Ovulation (typically day 14 of cycle, or cycleLength - 14)
    const ovulationDay = addDays(currentPeriodStart, averageCycleLength - 14);
    events.push({
      title: '🥚 Ovulation Day',
      description: 'Predicted ovulation - highest fertility',
      startDate: ovulationDay,
      endDate: ovulationDay,
      type: 'ovulation',
    });

    // Fertile window (5 days before ovulation to 1 day after)
    const fertileStart = addDays(ovulationDay, -5);
    const fertileEnd = addDays(ovulationDay, 1);
    events.push({
      title: '🌸 Fertile Window',
      description: 'Fertile window - higher chance of conception',
      startDate: fertileStart,
      endDate: fertileEnd,
      type: 'fertile',
    });

    // Move to next cycle
    currentPeriodStart = addDays(currentPeriodStart, averageCycleLength);
  }

  return events;
};
