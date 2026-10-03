import { CalendarService } from './calendar.service';
import { MealPlan } from '../models/eco-chef.models';

describe('CalendarService', () => {
    const mockPlan: MealPlan = {
        Montag: {
            title: 'Kürbissuppe mit Ingwer',
            prepTime: '25 Min',
            co2SavedKg: 1.4,
            notes: 'Aus frischem Hokkaido zubereiten'
        },
        Mittwoch: {
            title: 'Linsen-Bolognese mit Vollkornspaghetti',
            prepTime: '30 Min',
            co2SavedKg: 2.1
        },
        Freitag: {
            title: 'Gemüse-Curry mit Reis',
            prepTime: '20 Min'
        }
    };

    it('should calculate the Monday of the current week correctly', () => {
        // Wednesday, Oct 7, 2026
        const testDate = new Date(2026, 9, 7);
        const monday = CalendarService.getWeekMonday(testDate);
        expect(monday.getDay()).toBe(1); // Monday is 1
        expect(monday.getDate()).toBe(5); // Oct 5, 2026
    });

    it('should format UTC datetime in RFC 5545 format', () => {
        const d = new Date(Date.UTC(2026, 9, 3, 15, 30, 0));
        const formatted = CalendarService.formatIcsDateTime(d);
        expect(formatted).toBe('20261003T153000Z');
    });

    it('should generate valid iCalendar text containing VCALENDAR and VEVENT blocks', () => {
        const ics = CalendarService.generateIcs(mockPlan, new Date(2026, 9, 5));
        expect(ics).toContain('BEGIN:VCALENDAR');
        expect(ics).toContain('VERSION:2.0');
        expect(ics).toContain('X-WR-CALNAME:EcoChef Wochenplan');
        expect(ics).toContain('SUMMARY:EcoChef: Kürbissuppe mit Ingwer');
        expect(ics).toContain('SUMMARY:EcoChef: Linsen-Bolognese mit Vollkornspaghetti');
        expect(ics).toContain('SUMMARY:EcoChef: Gemüse-Curry mit Reis');
        expect(ics).toContain('END:VCALENDAR');

        // Check occurrence count of BEGIN:VEVENT (3 planned days)
        const eventCount = (ics.match(/BEGIN:VEVENT/g) || []).length;
        expect(eventCount).toBe(3);
    });

    it('should handle empty meal plan gracefully', () => {
        const emptyIcs = CalendarService.generateIcs({});
        expect(emptyIcs).toContain('BEGIN:VCALENDAR');
        expect(emptyIcs).toContain('END:VCALENDAR');
        expect(emptyIcs).not.toContain('BEGIN:VEVENT');
    });
});
