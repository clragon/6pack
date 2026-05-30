export interface FeedbackFormFields {
  userName: string;
  body: string;
}

export function readFeedbackForm(): FeedbackFormFields | null {
  const userName = document.querySelector<HTMLInputElement>(
    'input[name="user_feedback[user_name]"]',
  );
  const body = document.querySelector<HTMLTextAreaElement>(
    'textarea[name="user_feedback[body]"]',
  );
  if (!userName || !body) return null;
  return { userName: userName.value, body: body.value };
}
