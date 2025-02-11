import { SkillOption, StoreItem } from "./store-types";

export const skillOptions: SkillOption[] = [
  { value: "strength", label: "Strength" },
  { value: "stamina", label: "Stamina" },
  { value: "passing", label: "Passing" },
  { value: "shooting", label: "Shooting" },
  { value: "defending", label: "Defending" },
  { value: "speed", label: "Speed" },
  { value: "positioning", label: "Positioning" },
];

export const storeItems: StoreItem[] = [
  {
    id: "private_trainer",
    name: "Private Trainer",
    description: "Train skill for 5 sessions",
    price: 100,
    section: "Bonuses",
  },
  {
    id: "management_certificate",
    name: "Management Cert.",
    description: "Team management license",
    price: 10000,
    section: "Certifications",
  },
  {
    id: "training_certificate",
    name: "Training Cert.",
    description: "Team training license",
    price: 10000,
    section: "Certifications",
  },
  {
    id: "finance_certificate",
    name: "Finance Cert.",
    description: "Team finance license",
    price: 10000,
    section: "Certifications",
  },
];