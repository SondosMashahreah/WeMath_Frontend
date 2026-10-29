# Orange accents and student navigation

Base commit: `34da5302007203967b90a5ce3caff2958c8edf65`.

- Yellow UI accents, hover/focus states, selected controls and scrollbars now use orange shades.
- The single-book redirect only runs at the curriculum root; `/student/account` remains open.
- Back from a sole book exits to home (or to the child in parent preview), avoiding a redirect loop.
- Logout navigates out of the protected route before clearing account context, avoiding a competing login redirect.
- No dependency or database migration is required.

Validation: `npm run build`, `npm run test:student` (25 tests), and `npm run test:navigation`.
The navigation test covers grades 11 and 12, account close/logout, direct URLs, nested Back,
multiple books, browser Back/Forward, and parent preview. It uses real React routing with
mocked HTTP/GPU; it is not a live-account or native-browser visual test.
The regression test reproduces the account redirect on the original hook.
