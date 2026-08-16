import { SrsState, SrsRating, SrsStage } from '../types/schema';

export interface Sm2Result {
  repetitions: number;
  interval_days: number;
  ease_factor: number;
  due_date: string;
  srs_stage: SrsStage;
  lapses: number;
}

export const calculateSm2 = (currentState: Partial<SrsState>, rating: SrsRating): Sm2Result => {
  let repetitions = currentState.repetitions || 0;
  let interval_days = currentState.interval_days || 1;
  let ease_factor = currentState.ease_factor || 2.5;
  let lapses = currentState.lapses || 0;

  if (rating === 0) {
    // Again
    repetitions = 0;
    interval_days = 1;
    lapses += 1;
  } else {
    // Hard (1), Good (2), Easy (3)
    if (repetitions === 0) {
      interval_days = 1;
    } else if (repetitions === 1) {
      interval_days = 6;
    } else {
      interval_days = Math.round(interval_days * ease_factor);
    }
    repetitions += 1;

    // Map rating 1/2/3 -> q=3/4/5
    const q = rating === 1 ? 3 : rating === 2 ? 4 : 5;
    const newEase = ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    ease_factor = Math.max(1.3, Number(newEase.toFixed(2)));
  }

  // Calculate new due_date
  const today = new Date();
  today.setDate(today.getDate() + interval_days);
  const due_date = today.toISOString().split('T')[0];

  // Calculate SRS stage
  let srs_stage: SrsStage = 'learning';
  if (repetitions === 0) {
    srs_stage = 'new';
  } else if (interval_days >= 90 && repetitions >= 3) {
    srs_stage = 'mastered';
  } else if (interval_days >= 21) {
    srs_stage = 'review';
  }

  return {
    repetitions,
    interval_days,
    ease_factor,
    due_date,
    srs_stage,
    lapses
  };
};
