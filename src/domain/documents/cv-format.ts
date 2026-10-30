import type { CvContent, Direction } from "./types";

const rtlCharacter = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
const ltrCharacter = /[A-Za-z]/;

export function directionForText(value: string, fallback: Direction): Direction {
  for (const character of value) {
    if (rtlCharacter.test(character)) return "rtl";
    if (ltrCharacter.test(character)) return "ltr";
  }
  return fallback;
}

export function directionForCv(content: CvContent, fallback: Direction): Direction {
  return directionForText([
    content.fullName,
    content.headline,
    content.specialization,
    content.summary,
    ...content.experiences.flatMap((experience) => [experience.role, experience.company, ...experience.bullets]),
  ].join("\n"), fallback);
}

export function cvAchievementLines(bullets: string[]) {
  return bullets
    .flatMap((bullet) => bullet.split(/\r?\n/))
    .map((line) => line.trim())
    .filter(Boolean);
}
