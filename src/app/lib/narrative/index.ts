export * from "./types";
export * from "./context";
export * from "./select";

import { goalTemplates } from "./templates/goals";
import { chanceTemplates } from "./templates/chances";
import { structuralTemplates } from "./templates/structural";
import { headlineTemplates } from "./templates/headlines";
import { NarrativeTemplate, HeadlineTemplate } from "./types";

/** Aggregated pool of all match-event templates. */
export const ALL_TEMPLATES: NarrativeTemplate[] = [
  ...goalTemplates,
  ...chanceTemplates,
  ...structuralTemplates,
];

export const ALL_HEADLINE_TEMPLATES: HeadlineTemplate[] = headlineTemplates;

export { goalTemplates, chanceTemplates, structuralTemplates, headlineTemplates };
