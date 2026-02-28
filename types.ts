
export interface CharacterData {
  char: string;
  pinyin: string;
  meaning: string;
}

export interface Animal {
  emoji: string;
  name: string;
  message: string;
}

export interface CharacterStats {
  tested: number;
  correct: number;
  wrong: number;
}

export type GameState = 'welcome' | 'playing' | 'setup_custom' | 'stats';
export type GameMode = 'endless' | 'focus' | 'numbers' | 'custom';
