# Contributing to Gratia

Thanks for helping small nonprofits keep their donors close.

## Getting set up

Follow **Run it locally** in the [README](README.md): a PayPal sandbox app, an OpenAI key, `npm install`, `npm run seed`, `npm run dev`.

## Before you open a pull request

```bash
npm run lint
npm run typecheck
npm test
```

CI runs the same three checks on every push.

## Ground rules

- **Sandbox only.** Never commit a key, a secret or a real person's data. Configuration lives in `.env.local`, which git ignores.
- **Money moves only with a human click.** Any new agent tool that sends, charges or refunds must go through the approval dialog (`app/dashboard/components/approval-dialog.tsx`) and be re-checked on the server.
- **Small, focused changes** with a clear commit message are easiest to review.

Please follow our [Code of Conduct](CODE_OF_CONDUCT.md).
