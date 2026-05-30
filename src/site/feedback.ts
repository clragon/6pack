// The new-feedback form (/user_feedbacks/new). The user_name field renders only
// for a new record, so requiring it distinguishes the new form from edit and
// keeps the convert command off pages where it makes no sense.
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
