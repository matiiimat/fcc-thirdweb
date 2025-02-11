export interface PlayerData {
  playerId: string;
  money: number;
  xp: number;
  privateTrainer?: {
    selectedSkill: string | null;
    remainingSessions: number;
  };
}

export interface SkillOption {
  value: string;
  label: string;
}

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  section: string;
}