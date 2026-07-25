function isUnanswered(selected) {
  return selected === null || selected === undefined;
}

export function buildFlagPayload(question, { selected, feedback, appVersion }) {
  return {
    questionId: question.id,
    question: question.question,
    category: question.category,
    options: question.options,
    selected,
    selectedLabel: isUnanswered(selected) ? null : question.options[selected],
    correct: question.correct,
    correctLabel: question.options[question.correct],
    feedback: feedback || '',
    source: question.source || '',
    appVersion,
    at: Date.now()
  };
}

export function buildIssueUrl(repo, question, { selected, feedback, appVersion }) {
  const yourAnswer = isUnanswered(selected) ? '(not answered)' : question.options[selected];
  const correctAnswer = question.options[question.correct];

  const body = [
    `**Question ID:** ${question.id}`,
    `**Category:** ${question.category}`,
    '',
    `**Question:** ${question.question}`,
    '',
    `**Options:**`,
    ...question.options.map((o, i) => `- ${String.fromCharCode(65 + i)}. ${o}`),
    '',
    `**Selected answer:** ${yourAnswer}`,
    `**Expected correct answer:** ${correctAnswer}`,
    '',
    `**What's wrong:**`,
    feedback || '(none)',
    '',
    `**App version:** ${appVersion}`,
    '',
    '_Submitted via the in-app flag button._'
  ].join('\n');

  const title = `Flagged question: ${question.id}`;
  const params = new URLSearchParams({ title, body, labels: 'needs-triage' });
  return `https://github.com/${repo}/issues/new?${params.toString()}`;
}
