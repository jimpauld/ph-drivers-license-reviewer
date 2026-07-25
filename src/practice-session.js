import { pickCategory } from './quiz-engine.js';

export function createPracticeSession(bank, category, count, seed) {
  const questions = pickCategory(bank, category, count, seed);
  return {
    category,
    seed,
    config: null,
    questions,
    answers: new Array(questions.length).fill(null),
    currentIndex: 0
  };
}

export function answer(session, optionIndex) {
  const answers = [...session.answers];
  answers[session.currentIndex] = optionIndex;
  return { ...session, answers };
}

export function next(session) {
  return { ...session, currentIndex: Math.min(session.currentIndex + 1, session.questions.length - 1) };
}

export function isComplete(session) {
  return session.answers.every((a) => a !== null);
}

export function wrongAnswers(session) {
  const wrong = [];
  for (let i = 0; i < session.questions.length; i++) {
    const selected = session.answers[i];
    if (selected !== null && selected !== session.questions[i].correct) {
      wrong.push({
        question: session.questions[i],
        selected,
        correct: session.questions[i].correct
      });
    }
  }
  return wrong;
}
