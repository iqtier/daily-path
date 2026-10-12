# Daily Path frontend

Next.js (App Router) + TypeScript + Tailwind CSS. Talks to an ASP.NET Core API through the /api proxy in next.config.

## Do not change
- `lib/api.ts` and `lib/types.ts`. All data access goes through these. UI work must not change function names, signatures, or types.
- `next.config` (the /api proxy).
- Auth: login uses an HttpOnly cookie. Never store tokens or user data in localStorage.

## Behavior that must stay the same
- Only the current task shows its content. Locked tasks render as blurred placeholders with no title or text.
- A task's suggested time (estimatedMinutes) is shown only after it is completed, next to the user's actual time.
- Timer: Start, Pause, Resume. Timer state is saved in localStorage per task so refresh does not reset it.
- No clock times or schedules anywhere. The user decides when to do each task.
- Setup screen when `hasPlan` is false. Bonus card when all tasks are done and time remains.
- Group goal history by the `date` field, never by `completedAt`.

## Working rules
- Ask before adding any npm package.
- Run `npx tsc --noEmit` after changes and fix all errors.
- Code comments: short and professional, explain why, not what.
- Keep it accessible: readable contrast, keyboard focus states, respect `prefers-reduced-motion`.
- Mobile first. Every page must work at 375px wide.