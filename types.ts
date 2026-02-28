
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

export type GameState = 'welcome' | 'playing' | 'setup_custom';
export type GameMode = 'endless' | 'focus' | 'numbers' | 'custom';
