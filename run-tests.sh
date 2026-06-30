#!/usr/bin/env bash
set -euo pipefail

FAILED=0

echo "=== Tests unitaires (Karma) ==="
if npx ng test --watch=false --browsers=ChromeHeadless; then
  echo "✓ Tests unitaires OK"
else
  echo "✗ Tests unitaires ÉCHOUÉS"
  FAILED=1
fi

echo ""
echo "=== Tests e2e (Playwright) ==="
if npm run e2e; then
  echo "✓ Tests e2e OK"
else
  echo "✗ Tests e2e ÉCHOUÉS"
  FAILED=1
fi

echo ""
if [ "$FAILED" -eq 0 ]; then
  echo "=== Tous les tests ont réussi ==="
  exit 0
else
  echo "=== Des tests ont échoué ==="
  exit 1
fi
