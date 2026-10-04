import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { Achievement } from '../models/eco-chef.models';
import { StorageService } from '../services/storage.service';
import { applyCookedRecipe, incrementAchievement, mergeWithDefaults, type CookedContext } from '../services/achievements';

/** Achievement state and persistence; the rules live in services/achievements.ts. */
export class AchievementsController implements ReactiveController {
    list: Achievement[] = [];

    constructor(private readonly host: ReactiveControllerHost) {
        host.addController(this);
    }

    hostConnected(): void {}

    load(): void {
        this.set(mergeWithDefaults(StorageService.getAchievements()));
    }

    set(list: Achievement[]): void {
        this.list = list;
        StorageService.setAchievements(list);
        this.host.requestUpdate();
    }

    increment(id: string): void {
        this.set(incrementAchievement(this.list, id));
    }

    /** Unlocks a one-shot achievement; true only the first time. */
    unlock(id: string): boolean {
        const current = this.list.find(a => a.id === id);
        if (!current || current.unlocked) return false;
        this.set(this.list.map(a => a.id === id ? { ...a, progress: a.target, unlocked: true } : a));
        return true;
    }

    onRecipeCooked(ctx: CookedContext): void {
        this.set(applyCookedRecipe(this.list, ctx));
    }
}
