# Which LLM, and where its key lives

Type: grilling
Label: wayfinder:grilling
Status: resolved
Blocked by: 06

## Question

Which LLM provider does Phasy call, and where does the API key live for a web app on the phone (on the device, or behind a small server)? Weigh cost per Session, answer quality in Chinese, and privacy of body data.

## Answer

Resolved 2026-09-24 by grilling with the owner, on facts in [research/llm-provider-and-key.md](../research/llm-provider-and-key.md).

Facts that decided it: Hong Kong is not on the supported-region lists of Anthropic, OpenAI or the Gemini Developer API (a terms-of-service limit — accounts may be closed; Anthropic's list re-checked by the main agent). DeepSeek has no such limit, but stores data in mainland China and its terms allow training use with no opt-out. Every option costs under about US$3 a month for ~26 Sessions. No good evidence on Hong Kong written Chinese quality for any model.

1. **Provider: DeepSeek for v1.** Body data sent is low-sensitivity and pseudonymous: "Member A / B", no names, no photos. Revisit if the app goes commercial.
2. **The LLM is configurable (owner's addition).** A settings screen holds endpoint URL, model, reasoning effort and API key, so the owner can switch provider or model without a new build. v1 speaks the OpenAI-compatible chat format, which DeepSeek, OpenAI and Google all offer. Reasoning effort is passed through only where the endpoint supports it.
3. **Key on each phone.** Typed into the app once, kept only on that phone. Damage is capped by a small prepaid balance (about HK$40) that stops when used up. Agent's advice: use a DeepSeek account for the app separate from the owner's work account, because all keys on one account share its balance, so the cap is only as small as that account's balance.
4. **Quality check:** Hong Kong written Chinese quality is tested in the Session prototype (ticket 10); if DeepSeek falls short, switch through the settings screen.

Agent's condition, from ADR 0001 (not an owner decision): because any model can be plugged in, the app checks every Library id the LLM returns and refuses unknown ids, so a weaker model cannot slip in an invented position or treatment.
