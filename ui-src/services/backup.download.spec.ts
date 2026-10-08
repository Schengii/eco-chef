/** @jest-environment jsdom */
import { BackupService } from './backup.service';
import { StorageService } from './storage.service';

describe('BackupService (browser parts)', () => {
    beforeEach(() => localStorage.clear());

    test('createBackup collects data from storage', () => {
        StorageService.setCalorieGoal(1700);
        StorageService.setIngredientChips(['Apfel']);
        const backup = BackupService.createBackup();
        expect(backup.version).toBe('1.0.0');
        expect(backup.calorieGoal).toBe(1700);
        expect(backup.ingredientChips).toEqual(['Apfel']);
        expect(backup.savedRecipes).toEqual([]);
        expect(Date.parse(backup.exportedAt)).not.toBeNaN();
    });

    test('createBackup output passes parseBackup', () => {
        expect(BackupService.parseBackup(BackupService.createBackup())).not.toBeNull();
    });

    test('backupFilename contains a local date', () => {
        expect(BackupService.backupFilename()).toMatch(/^ecoChef_full_backup_\d{4}-\d{2}-\d{2}\.json$/);
    });

    test('downloadJson triggers a download and cleans up the anchor', () => {
        const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
        BackupService.downloadJson('x.json', { a: 1 }, true);
        expect(click).toHaveBeenCalledTimes(1);
        expect(document.querySelector('a[download]')).toBeNull();
        click.mockRestore();
    });
});
