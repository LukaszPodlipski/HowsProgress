/** Self-contained HTML shown in the browser after Google OAuth redirect. */
export const OAUTH_CALLBACK_HTML = `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>How's Progress — zalogowano</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 1.5rem;
      font-family: Roboto, system-ui, sans-serif;
      background: oklch(0.18 0 0);
      color: oklch(0.985 0 0);
    }
    .card {
      width: min(100%, 22rem);
      padding: 2rem 1.75rem;
      text-align: center;
      border-radius: 1rem;
      border: 1px solid oklch(1 0 0 / 10%);
      background: oklch(0.21 0.006 285.885);
      box-shadow: 0 24px 48px oklch(0.488 0.243 264.376 / 0.12);
      animation: rise 520ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    .mark {
      position: relative;
      width: 4.5rem;
      height: 4.5rem;
      margin: 0 auto 1.25rem;
    }
    .ring {
      position: absolute;
      inset: 0;
      border-radius: 9999px;
      background: conic-gradient(
        from 0deg,
        oklch(0.488 0.243 264.376),
        oklch(0.623 0.214 259.815),
        oklch(0.488 0.243 264.376 / 0.2),
        oklch(0.488 0.243 264.376)
      );
      mask: radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px));
      opacity: 0.55;
    }
    .check {
      position: absolute;
      inset: 0.65rem;
      display: grid;
      place-items: center;
      border-radius: 9999px;
      background: linear-gradient(145deg, oklch(0.488 0.243 264.376), oklch(0.623 0.214 259.815));
      box-shadow: 0 10px 28px oklch(0.488 0.243 264.376 / 0.35);
      animation: pop 640ms cubic-bezier(0.22, 1, 0.36, 1) 120ms both;
    }
    .check svg {
      width: 1.75rem;
      height: 1.75rem;
      stroke: white;
      stroke-width: 2.5;
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .check path {
      stroke-dasharray: 28;
      stroke-dashoffset: 28;
      animation: draw 520ms ease 420ms forwards;
    }
    h1 {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 0.5rem;
    }
    p {
      font-size: 0.9375rem;
      line-height: 1.5;
      color: oklch(0.705 0.015 286.067);
    }
    .hint {
      margin-top: 1rem;
      font-size: 0.8125rem;
      color: oklch(0.705 0.015 286.067 / 0.85);
    }
    @keyframes rise {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pop {
      from { opacity: 0; transform: scale(0.82); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes draw {
      to { stroke-dashoffset: 0; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="mark" aria-hidden="true">
      <div class="ring"></div>
      <div class="check">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 12.5 10 16.5 18 8.5"></path>
        </svg>
      </div>
    </div>
    <h1>Zalogowano!</h1>
    <p>Wracamy do How's Progress.</p>
    <p class="hint">Możesz zamknąć tę kartę przeglądarki.</p>
  </div>
  <script>
    window.setTimeout(function () {
      window.close();
    }, 2200);
  </script>
</body>
</html>`
