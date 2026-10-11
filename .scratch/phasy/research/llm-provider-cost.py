"""Cost per Phasy Session and per month, per LLM provider.

Assumptions (from the research brief, see llm-provider-and-key.md):
- 1 Session = 15 calls; each call ~6,000 input tokens (5,000 stable, cacheable
  prefix + 1,000 new tokens) and ~400 output tokens.
- With caching: call 1 writes the prefix, calls 2-15 read it (all inside one
  Session, so a 5-minute cache stays warm). Prefix changes between Sessions
  (Member history changes), so each Session pays one write.
- 6 Sessions a week -> 6 * 52 / 12 = 26 Sessions a month. HKD at 7.8 per USD.
Prices are USD per million tokens, read 2026-09-24 (sources in the .md file).
"""

CALLS, PREFIX, NEW, OUT = 15, 5_000, 1_000, 400
SESSIONS_PER_MONTH = 6 * 52 / 12
HKD = 7.8

# name: (input, cache_write, cache_read, output)
PRICES = {
    "Claude Sonnet 5": (2.00, 2.50, 0.20, 10.00),
    "Claude Haiku 4.5": (1.00, 1.25, 0.10, 5.00),
    "OpenAI GPT-6 Sol": (2.00, 2.50, 0.20, 10.00),  # write = 1.25x per caching guide
    "Gemini 3.8 Flash (2027 price)": (1.50, 1.50, 0.15, 7.50),
    "Gemini 3.8 Flash (to 2026-12-31)": (0.75, 0.75, 0.075, 3.75),
    "DeepSeek Flash (peak)": (0.30, 0.30, 0.006, 1.20),
    "DeepSeek Flash (off-peak)": (0.15, 0.15, 0.003, 0.60),
}


def session_cost(inp, write, read, out, cached):
    per_m = 1_000_000
    output = CALLS * OUT * out / per_m
    if not cached:
        return CALLS * (PREFIX + NEW) * inp / per_m + output
    prefix = (PREFIX * write + (CALLS - 1) * PREFIX * read) / per_m
    return prefix + CALLS * NEW * inp / per_m + output


def demo():
    # Hand-checked: Sonnet 5 no cache = 90,000*2/1e6 + 6,000*10/1e6 = 0.18 + 0.06
    assert abs(session_cost(*PRICES["Claude Sonnet 5"], cached=False) - 0.24) < 1e-9
    # Sonnet 5 cached = 5,000*2.5 + 70,000*0.2 + 15,000*2 + 6,000*10, all /1e6
    assert abs(session_cost(*PRICES["Claude Sonnet 5"], cached=True) - 0.1165) < 1e-9
    assert abs(SESSIONS_PER_MONTH - 26) < 1e-9


if __name__ == "__main__":
    demo()
    print(f"{'provider':34} {'no-cache/Session':>17} {'cached/Session':>15} "
          f"{'no-cache/month':>15} {'cached/month':>13} {'cached HKD/mo':>14}")
    for name, p in PRICES.items():
        a, b = session_cost(*p, cached=False), session_cost(*p, cached=True)
        print(f"{name:34} {a:17.4f} {b:15.4f} {a * SESSIONS_PER_MONTH:15.2f} "
              f"{b * SESSIONS_PER_MONTH:13.2f} {b * SESSIONS_PER_MONTH * HKD:14.1f}")
    print("\n+1,000 hidden reasoning tokens per call adds, per Session (USD):")
    for name, p in PRICES.items():
        print(f"  {name:34} {CALLS * 1_000 * p[3] / 1_000_000:.4f}")
