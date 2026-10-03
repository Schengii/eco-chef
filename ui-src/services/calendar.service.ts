import { MealPlan } from '../models/eco-chef.models';

export class CalendarService {
    private static readonly DAY_OFFSETS: Record<string, number> = {
        'montag': 0,
        'dienstag': 1,
        'mittwoch': 2,
        'donnerstag': 3,
        'freitag': 4,
        'samstag': 5,
        'sonntag': 6
    };

    /**
     * Finds the Monday date for the relevant week (current or upcoming).
     */
    static getWeekMonday(from: Date = new Date()): Date {
        const d = new Date(from);
        const day = d.getDay(); // 0 is Sunday, 1 is Monday...
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        d.setHours(18, 0, 0, 0); // Default to 18:00 (Dinner)
        return d;
    }

    /**
     * Formats a Date object into iCalendar UTC timestamp format (YYYYMMDDTHHMMSSZ).
     */
    static formatIcsDateTime(date: Date): string {
        const pad = (n: number) => String(n).padStart(2, '0');
        const year = date.getUTCFullYear();
        const month = pad(date.getUTCMonth() + 1);
        const day = pad(date.getUTCDate());
        const hours = pad(date.getUTCHours());
        const minutes = pad(date.getUTCMinutes());
        const seconds = pad(date.getUTCSeconds());
        return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
    }

    /**
     * Generates a standard RFC 5545 iCalendar string from a MealPlan.
     */
    static generateIcs(mealPlan: MealPlan, baseDate: Date = new Date()): string {
        const nowStamp = this.formatIcsDateTime(new Date());
        const monday = this.getWeekMonday(baseDate);

        const lines: string[] = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//EcoChef//MealPlanner//DE',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'X-WR-CALNAME:EcoChef Wochenplan'
        ];

        for (const [dayKey, dayInfo] of Object.entries(mealPlan)) {
            if (!dayInfo || !dayInfo.title) continue;

            const normalizedKey = dayKey.toLowerCase().trim();
            const offset = this.DAY_OFFSETS[normalizedKey] ?? 0;

            const eventStart = new Date(monday);
            eventStart.setDate(monday.getDate() + offset);

            const eventEnd = new Date(eventStart);
            eventEnd.setMinutes(eventEnd.getMinutes() + 45); // 45 min duration

            const uid = `ecochef-${eventStart.toISOString().slice(0, 10)}-${normalizedKey}@ecochef.app`;
            const summary = `EcoChef: ${dayInfo.title.replace(/[,;\\]/g, ' ')}`;
            
            const descParts: string[] = [
                `Geplantes Gericht für ${dayKey}`,
                dayInfo.prepTime ? `Zubereitung: ${dayInfo.prepTime}` : '',
                dayInfo.co2SavedKg ? `CO2-Ersparnis: ${dayInfo.co2SavedKg} kg` : '',
                dayInfo.notes ? `Notizen: ${dayInfo.notes}` : ''
            ].filter(Boolean);

            const description = descParts.join('\\n');

            lines.push(
                'BEGIN:VEVENT',
                `UID:${uid}`,
                `DTSTAMP:${nowStamp}`,
                `DTSTART:${this.formatIcsDateTime(eventStart)}`,
                `DTEND:${this.formatIcsDateTime(eventEnd)}`,
                `SUMMARY:${summary}`,
                `DESCRIPTION:${description}`,
                'STATUS:CONFIRMED',
                'END:VEVENT'
            );
        }

        lines.push('END:VCALENDAR');
        return lines.join('\r\n');
    }

    /**
     * Triggers a browser file download of the generated .ics file.
     */
    static downloadIcsFile(mealPlan: MealPlan, filename = 'ecochef-wochenplan.ics'): boolean {
        const content = this.generateIcs(mealPlan);
        try {
            const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            return true;
        } catch (e) {
            console.error('Download ICS failed:', e);
            return false;
        }
    }
}
