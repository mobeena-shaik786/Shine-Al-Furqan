import { useEffect, useState } from 'react';
import {
  addQuizQuestion,
  createQuizForLesson,
  getQuizForLesson,
  listMyQuizAttempts,
  submitQuizAttempt,
  type QuizAttemptDto,
  type QuizDto,
} from '../../services/quizApi';

interface QuizPanelProps {
  lessonId: string;
  isStudent: boolean;
  canManage: boolean;
  onError: (msg: string) => void;
}

export function QuizPanel({ lessonId, isStudent, canManage, onError }: QuizPanelProps) {
  const [quiz, setQuiz] = useState<QuizDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizAttemptDto | null>(null);
  const [attempts, setAttempts] = useState<QuizAttemptDto[]>([]);
  const [prompt, setPrompt] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [correct, setCorrect] = useState<'a' | 'b'>('a');

  const reload = async () => {
    setLoading(true);
    try {
      const q = await getQuizForLesson(lessonId);
      setQuiz(q);
      if (isStudent) setAttempts(await listMyQuizAttempts(q._id));
    } catch {
      setQuiz(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    setResult(null);
    setAnswers({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, isStudent]);

  if (loading) return <p className="text-sm text-[#758188]">Loading quiz…</p>;

  if (!quiz) {
    if (!canManage) {
      return <p className="text-sm text-[#758188]">No quiz is available for this lesson yet.</p>;
    }
    return (
      <div className="space-y-3 rounded-xl border border-[#E4DFE5] p-4">
        <p className="text-sm text-[#758188]">No quiz yet for this lesson.</p>
        <button
          type="button"
          className="rounded-xl bg-[#B01828] px-4 py-2 text-sm font-semibold text-[#F8F8F8]"
          onClick={() =>
            void createQuizForLesson(lessonId, { passThresholdPercent: 70 })
              .then(reload)
              .catch((e) => onError(e instanceof Error ? e.message : 'Create quiz failed'))
          }
        >
          Create quiz
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-[#E4DFE5] p-4">
      <div>
        <h3 className="text-sm font-bold text-[#1E2531]">{quiz.title}</h3>
        <p className="text-xs text-[#758188]">
          Pass ≥ {quiz.passThresholdPercent}%
          {quiz.maxAttempts > 0 ? ` · max ${quiz.maxAttempts} attempts` : ' · unlimited attempts'}
        </p>
      </div>

      {canManage ? (
        <div className="space-y-2 border-t border-[#E9EEF0] pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#758188]">Add question</p>
          <input
            className={inputClass}
            placeholder="Prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="Option A"
            value={optionA}
            onChange={(e) => setOptionA(e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="Option B"
            value={optionB}
            onChange={(e) => setOptionB(e.target.value)}
          />
          <select
            className={inputClass}
            value={correct}
            onChange={(e) => setCorrect(e.target.value as 'a' | 'b')}
            aria-label="Correct option"
          >
            <option value="a">Correct: A</option>
            <option value="b">Correct: B</option>
          </select>
          <button
            type="button"
            className="rounded-xl border border-[#E4DFE5] px-3 py-2 text-xs font-semibold"
            onClick={() =>
              void addQuizQuestion(quiz._id, {
                prompt: prompt.trim(),
                options: [
                  { optionId: 'a', text: optionA.trim() },
                  { optionId: 'b', text: optionB.trim() },
                ],
                correctOptionId: correct,
                order: quiz.questions.length + 1,
              })
                .then(() => {
                  setPrompt('');
                  setOptionA('');
                  setOptionB('');
                  return reload();
                })
                .catch((e) => onError(e instanceof Error ? e.message : 'Add question failed'))
            }
          >
            Add MCQ
          </button>
          <ul className="space-y-2 pt-2">
            {quiz.questions.map((q) => (
              <li key={q._id} className="rounded-lg bg-[#E9EEF0] px-3 py-2 text-sm">
                <p className="font-medium text-[#1E2531]">
                  {q.order}. {q.prompt}
                </p>
                <p className="text-xs text-[#758188]">
                  Correct: {q.correctOptionId} ·{' '}
                  {q.options.map((o) => `${o.optionId}:${o.text}`).join(' | ')}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {isStudent ? (
        <div className="space-y-4 border-t border-[#E9EEF0] pt-3">
          {quiz.questions.length === 0 ? (
            <p className="text-sm text-[#758188]">This quiz has no questions yet.</p>
          ) : (
            quiz.questions.map((q) => (
              <fieldset key={q._id} className="space-y-2">
                <legend className="text-sm font-semibold text-[#1E2531]">
                  {q.order}. {q.prompt}
                </legend>
                {q.options.map((o) => (
                  <label key={o.optionId} className="flex items-center gap-2 text-sm text-[#1E2531]">
                    <input
                      type="radio"
                      name={q._id}
                      checked={answers[q._id] === o.optionId}
                      onChange={() => setAnswers((prev) => ({ ...prev, [q._id]: o.optionId }))}
                    />
                    {o.text}
                  </label>
                ))}
              </fieldset>
            ))
          )}
          <button
            type="button"
            disabled={quiz.questions.length === 0}
            className="rounded-xl bg-[#B01828] px-4 py-2 text-sm font-semibold text-[#F8F8F8] disabled:opacity-50"
            onClick={() => {
              const payload = quiz.questions.map((q) => ({
                questionId: q._id,
                optionId: answers[q._id],
              }));
              if (payload.some((a) => !a.optionId)) {
                onError('Answer every question before submitting.');
                return;
              }
              void submitQuizAttempt(quiz._id, payload)
                .then((res) => {
                  setResult(res);
                  return listMyQuizAttempts(quiz._id).then(setAttempts);
                })
                .catch((e) => onError(e instanceof Error ? e.message : 'Submit failed'));
            }}
          >
            Submit answers
          </button>
          {result ? (
            <p
              className={`text-sm font-semibold ${result.passed ? 'text-[#61E092]' : 'text-[#E03040]'}`}
            >
              Score {result.score}/{result.totalQuestions} ({result.percent}%) —{' '}
              {result.passed ? 'Passed' : 'Not passed'}
            </p>
          ) : null}
          {attempts.length > 0 ? (
            <div>
              <p className="text-xs font-semibold uppercase text-[#758188]">Attempt history</p>
              <ul className="mt-1 space-y-1 text-xs text-[#758188]">
                {attempts.map((a) => (
                  <li key={a._id}>
                    {new Date(a.submittedAt).toLocaleString()} — {a.percent}%{' '}
                    {a.passed ? 'pass' : 'fail'}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-[#E4DFE5] bg-[#F8F8F8] px-3 py-2 text-sm outline-none focus:border-[#E03040]';

export default QuizPanel;
