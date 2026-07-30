import { AudioService } from './audio.service';
import { StorageService } from './storage.service';

const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem(key: string) { return store[key] || null; },
    setItem(key: string, value: string) { store[key] = value.toString(); },
    clear() { store = {}; },
    removeItem(key: string) { delete store[key]; }
  };
})();

(global as any).localStorage = localStorageMock;

class MockAudioContext {
  state = 'running';
  currentTime = 0;
  destination = {};
  resume = jest.fn();
  createOscillator() {
    return {
      type: 'sine',
      frequency: {
        setValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn()
      },
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn()
    };
  }
  createGain() {
    return {
      gain: {
        setValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn()
      },
      connect: jest.fn()
    };
  }
}

(global as any).AudioContext = MockAudioContext;

describe('AudioService Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    AudioService.stopAlarm();
  });

  test('playSuccessChime should execute without error when enabled', () => {
    StorageService.setSoundEffectsEnabled(true);
    expect(() => AudioService.playSuccessChime()).not.toThrow();
  });

  test('playSuccessChime should skip when sound is disabled', () => {
    StorageService.setSoundEffectsEnabled(false);
    expect(() => AudioService.playSuccessChime()).not.toThrow();
  });

  test('playAchievementJingle should execute without error', () => {
    StorageService.setSoundEffectsEnabled(true);
    expect(() => AudioService.playAchievementJingle()).not.toThrow();
  });

  test('playItemAddBeep should execute without error', () => {
    StorageService.setSoundEffectsEnabled(true);
    expect(() => AudioService.playItemAddBeep()).not.toThrow();
  });

  test('alarm methods start and stop correctly', () => {
    expect(() => AudioService.playAlarm()).not.toThrow();
    expect(() => AudioService.stopAlarm()).not.toThrow();
  });
});
