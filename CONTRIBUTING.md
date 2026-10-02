# Contributing

Thanks for helping improve Table & Tomato. Issues and focused pull requests are welcome.

## Development workflow

1. Open an issue for substantial changes and agree on the intended behavior.
2. Create a branch from `main` using a descriptive name, such as `feat/restaurant-search` or `fix/checkout-validation`.
3. Install dependencies at the repo root and in both packages:

   ```bash
   npm install
   npm --prefix server install
   npm --prefix client install
   ```

4. Make the smallest cohesive change and add or update meaningful tests.
5. Run the checks relevant to your change before opening a pull request:

   ```bash
   npm run typecheck
   npm test
   npm run build
   ```

6. Describe the motivation, user-visible behavior, verification, and any known limitations in the pull request.

## Project conventions

- Keep React pages and reusable components organized by feature.
- Keep business rules in API services; never trust frontend prices, role claims, or coupon discounts.
- Validate API input and return actionable error responses.
- Do not commit `.env` files, credentials, personal data, build output, or database volumes.
- Prefer accessible labels, keyboard-operable controls, and mobile-friendly layouts.
