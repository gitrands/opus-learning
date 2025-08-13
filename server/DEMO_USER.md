# Demo User Setup

1. Create a user in Clerk dashboard with email `demo@example.com` and password `DemoPass!123` (or your choice).
2. Copy the generated Clerk user ID (looks like `user_XXXXXXXX`).
3. Edit `.env` and set:
```
DEMO_USER_EMAIL=demo@example.com
DEMO_USER_ID=user_XXXXXXXX
```
4. Enroll the demo user into sample courses:
```
npm run enroll:demo
```
This enrolls the user into up to 2 published courses and initializes minimal progress (first chapter not completed yet).

5. Start the server:
```
npm run dev
```
6. Sign in on the client as the demo user to view enrolled courses and progress.

If you add more published courses later, re-run `npm run enroll:demo` to enroll the demo user into newly published ones (it won't duplicate existing enrollments).
