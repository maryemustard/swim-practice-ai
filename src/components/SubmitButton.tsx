"use client";

import { useFormStatus } from "react-dom";

// Plain <button type="submit"> gives no feedback while a server action is
// running, so a slow one (Claude generation can take 10-20s) invites
// clicking again and again — each click fires its own request, producing
// duplicate practices. This disables itself and says so while pending.
export function SubmitButton({
  children,
  pendingText,
  className,
}: {
  children: React.ReactNode;
  pendingText: string;
  className: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${className} disabled:opacity-60 disabled:cursor-wait`}>
      {pending ? pendingText : children}
    </button>
  );
}
