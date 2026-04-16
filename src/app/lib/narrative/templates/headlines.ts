import { HeadlineTemplate } from "../types";

/**
 * Post-match headline templates. Rendered into the HeadlineCard.
 *
 * The selector narrows by scoreState + closeGame/blowout flags.
 * Headlines are uppercased by the render layer; write them title-case.
 */

export const headlineTemplates: HeadlineTemplate[] = [
  {
    id: "headline_home_blowout",
    tags: { scoreState: ["leading", "leading_big"], blowout: true },
    headlines: [
      "{attacker} Runs Riot As {homeTeam} Sweep Aside {awayTeam}",
      "{homeTeam} Put On A Clinic In Statement Win",
      "Not Even Close: {homeTeam} Dismantle {awayTeam}",
    ],
    bodies: [
      "From the opening whistle the result was rarely in doubt. {homeTeam} pressed high, passed cleanly, and punished the visitors at every opportunity. A reminder of what this side can do on its best day.",
      "Total control. {homeTeam} turned possession into pressure, pressure into chances, and chances into goals. {awayTeam} never got a foothold.",
    ],
    weight: 2,
  },
  {
    id: "headline_home_close_win",
    tags: { scoreState: "leading", closeGame: true },
    headlines: [
      "{homeTeam} Edge It In A Nervy Finish",
      "Nail-Biter Ends In Three Points For {homeTeam}",
      "{attacker}'s Finish The Difference As {homeTeam} Hold On",
    ],
    bodies: [
      "It was tight, it was tense, and it was almost squandered — but {homeTeam} dug in and took the points. The sort of win that defines seasons more than the thrashings do.",
      "A game that could have gone either way. {attacker}'s moment of quality proved decisive; the defence did the rest.",
    ],
  },
  {
    id: "headline_draw",
    tags: { scoreState: "level" },
    headlines: [
      "Honours Even In Entertaining Draw",
      "{homeTeam} And {awayTeam} Trade Blows, Share Points",
      "Points Shared After Open, End-To-End Contest",
    ],
    bodies: [
      "Both sides will feel they could have taken more from this one. Chances came at both ends; neither defence could quite hold. A fair result in the end, even if nobody in either dressing room will say so.",
      "A point apiece feels right. Neither side gave more than the other; neither blinked first.",
    ],
  },
  {
    id: "headline_home_close_loss",
    tags: { scoreState: "trailing", closeGame: true },
    headlines: [
      "Narrow Defeat Stings For {homeTeam}",
      "{awayTeam} Edge Tense Contest",
      "Margins Punish {homeTeam} As {awayTeam} Take The Points",
    ],
    bodies: [
      "Small moments, big consequences. {homeTeam} played their part in a tight contest but were undone by a flash of quality from the visitors. Plenty to take forward, and plenty to rue.",
      "A single goal separated them in the end. {homeTeam} asked the questions; {awayTeam} had the better answer.",
    ],
  },
  {
    id: "headline_home_blowout_loss",
    tags: { scoreState: ["trailing", "trailing_big"], blowout: true },
    headlines: [
      "Chastening Afternoon As {awayTeam} Run Riot",
      "{homeTeam} Left Searching For Answers After Thumping Defeat",
      "One To Forget: {homeTeam} Outclassed By {awayTeam}",
    ],
    bodies: [
      "It unravelled quickly and never recovered. {awayTeam} were sharper in every phase, and by the hour mark the game was already gone. Tough viewing for everyone connected with {homeTeam}.",
      "A difficult afternoon. {awayTeam} were deserving winners; {homeTeam} will need to reset.",
    ],
  },
  {
    id: "headline_fallback",
    tags: {},
    headlines: [
      "{homeTeam} {homeScore} - {awayScore} {awayTeam}: The Verdict",
      "Matchday Report: {homeTeam} vs {awayTeam}",
    ],
    bodies: [
      "A match with moments on both sides. The full recap is in the details — but the scoreline tells the essential story.",
    ],
  },
];
