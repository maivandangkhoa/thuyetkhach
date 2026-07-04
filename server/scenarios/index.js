/**
 * Gộp toàn bộ scenario theo chương + metadata chương.
 * Đây là NGUỒN nội dung duy nhất; `server/game.js` chỉ chứa logic.
 */
import { CHAPTERS } from './chapters.js'
import { CHAPTER_01 } from './chapter01.js'
import { CHAPTER_02 } from './chapter02.js'
import { CHAPTER_03 } from './chapter03.js'
import { CHAPTER_04 } from './chapter04.js'
import { CHAPTER_05 } from './chapter05.js'
import { CHAPTER_06 } from './chapter06.js'
import { CHAPTER_07 } from './chapter07.js'
import { CHAPTER_08 } from './chapter08.js'
import { CHAPTER_09 } from './chapter09.js'
import { CHAPTER_10 } from './chapter10.js'
import { CHAPTER_11 } from './chapter11.js'
import { CHAPTER_12 } from './chapter12.js'
import { CHAPTER_13 } from './chapter13.js'
import { CHAPTER_14 } from './chapter14.js'
import { CHAPTER_15 } from './chapter15.js'

export { CHAPTERS }

/** Phẳng hoá, sắp theo (chapter, order) để hiển thị nhất quán. */
export const SCENARIOS = [
  ...CHAPTER_01,
  ...CHAPTER_02,
  ...CHAPTER_03,
  ...CHAPTER_04,
  ...CHAPTER_05,
  ...CHAPTER_06,
  ...CHAPTER_07,
  ...CHAPTER_08,
  ...CHAPTER_09,
  ...CHAPTER_10,
  ...CHAPTER_11,
  ...CHAPTER_12,
  ...CHAPTER_13,
  ...CHAPTER_14,
  ...CHAPTER_15,
].sort((a, b) => a.chapter - b.chapter || a.order - b.order)

/** Số màn hiện có theo từng chương — để UI biết chương nào "Sắp ra mắt". */
export const chapterCounts = () => {
  const counts = {}
  for (const s of SCENARIOS) counts[s.chapter] = (counts[s.chapter] || 0) + 1
  return counts
}
