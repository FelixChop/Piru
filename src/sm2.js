// Implementation of the SM-2 spaced repetition algorithm
// Based on the algorithm used by Anki and SuperMemo

function sm2({ interval = 0, repetitions = 0, easiness = 2.5 }, quality) {
  if (quality < 0 || quality > 5) {
    throw new RangeError('Quality must be between 0 and 5');
  }

  if (quality >= 3) {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easiness);
    }
    repetitions += 1;
  } else {
    repetitions = 0;
    interval = 1;
  }

  easiness = easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easiness < 1.3) easiness = 1.3;

  return { interval, repetitions, easiness };
}

module.exports = { sm2 };
