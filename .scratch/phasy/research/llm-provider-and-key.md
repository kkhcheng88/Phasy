# LLM provider and API key location

Research for ticket 12 (`issues/12-llm-provider-and-key.md`). Read on 2026-09-24. Source ids like [S5] point to the Sources list at the end. The cost numbers come from `llm-provider-cost.py` in this folder.

## Main finding: Hong Kong is not a supported region for three of the four providers

- Hong Kong is **not** on Anthropic's supported list for the API or Claude.ai [S5]. OpenAI's API list also leaves it out [S6], and so does the Gemini Developer API list [S7]. Taiwan, Japan and Singapore are on all three lists, so the lists were read in full [S5][S6][S7].
- OpenAI says: "Accessing or offering access to our services outside of the countries and territories listed below may result in your account being blocked or suspended." [S6]
- Google tells people outside its regions to use Gemini through Google Cloud ("Gemini Enterprise Agent Platform", formerly Vertex AI) [S7]. A secondary 2026 article says this route works in Hong Kong. It needs a Google Cloud project with billing, and it may cost more (unverified) [S30].
- Microsoft says Hong Kong customers can use Azure OpenAI through models deployed in regions outside Hong Kong (Microsoft Q&A answer, 2026-03-09 [S28]; Microsoft statement reported by SCMP in 2024 [S29]). Azure prices and browser access for Azure were **not verified**.
- Claude through AWS Bedrock: secondary sources say Anthropic's region block also applies there and that the AWS account's billing address must be in a supported country. **Unverified**, because the primary AWS page returned 403 [S33].
- DeepSeek: I found no region restriction in its Open Platform terms [S21]. I also found no explicit statement that Hong Kong is supported.
- A proxy does **not** legitimately fix this. A Cloudflare Worker runs in the data centre nearest the user, which here is Hong Kong [S26]. Moving it elsewhere so that the provider does not see Hong Kong would evade the provider's region rule. The account holder is still in Hong Kong, so the terms problem stays.

The result: price is not what decides this. Every option costs less than about US$3 a month with caching. What decides it is which provider the couple can legitimately use from Hong Kong, and where the body data goes.

## Assumptions

- One Session = 15 LLM calls. Each call sends about 6,000 input tokens: about 5,000 stable tokens that can be cached (instructions, Library candidate subset, Member history) and about 1,000 new tokens. Each call returns about 400 output tokens.
- With caching, call 1 writes the stable part to the cache and calls 2–15 read it. All calls fall inside one Session, so the 5-minute cache stays warm (each read restarts the timer [S1]). The stable part changes between Sessions because Member history changes, so each Session pays one cache write.
- 6 Sessions a week = 6 × 52 / 12 = **26 Sessions a month**. HKD = USD × 7.8.
- The 400 output tokens assume little or no hidden reasoning. See the sensitivity check below.

## 1. Provider comparison

Prices are USD per million tokens (MTok), standard tier.

| Provider / model | Input / output price | Caching price | Cost per Session: no cache → cached | Cost per month (26 Sessions): no cache → cached | Usable direct from HK? | Browser call (CORS) with user-held key | API data policy | Evidence on Traditional Chinese / HK written Chinese |
|---|---|---|---|---|---|---|---|---|
| Anthropic **Claude Sonnet 5** (`claude-sonnet-5`) [S1] | $2 / $10 [S2] | 5-min write $2.50, cache hit $0.20 [S2]; minimum cacheable prefix 1,024 tokens [S1] | $0.240 → $0.117 | $6.24 → $3.03 (≈ HK$24) | **No**, HK not listed [S5] | Yes. Preflight allows it [S24], but the request must carry the opt-in header `anthropic-dangerous-direct-browser-access: true` [S4b]. The SDK disables browser use unless `dangerouslyAllowBrowser: true` is set [S4] | Not used for training by default [S23]. Inputs and outputs deleted within 30 days [S22]. Zero retention only by agreement [S22]. Processed "global" by default; US-only costs 1.1× [S2] | No good evidence for this model |
| Anthropic **Claude Haiku 4.5** (`claude-haiku-4-5`) [S1] | $1 / $5 [S2] | write $1.25, hit $0.10 [S2]; minimum cacheable prefix **4,096** tokens [S1] | $0.120 → $0.058 | $3.12 → $1.51 (≈ HK$12) | **No** [S5] | Same as Sonnet 5 | Same as Sonnet 5 | No good evidence for this model |
| OpenAI **GPT-6 Sol** (`gpt-6-sol`, OpenAI's middle tier of three [S9]) | $2 / $10 [S8] | cached input $0.20 [S8]; cache write 1.25× input (= $2.50) for GPT-5.6 and later [S10]; minimum 1,024 tokens [S10] | $0.240 → $0.117 | $6.24 → $3.03 (≈ HK$24) | **No**, and the account can be blocked [S6] | Yes. Preflight allows the `Authorization` header from any origin [S24] | Not used for training by default since 2023-03-01 [S11]. Abuse-monitoring logs kept up to 30 days [S11]. Zero retention needs OpenAI approval through sales [S11]. Set `store=false`: with `store=true`, responses are kept at least 30 days [S11] | No good evidence for this model |
| Google **Gemini 3.8 Flash** (`gemini-3.8-flash`, middle tier between Flash-Lite and Pro [S13]) | $0.75 / $3.75 until 2026-12-31, then **$1.50 / $7.50** [S13] | cached $0.075, then $0.15 [S13]; automatic caching, minimum 4,096 tokens [S14]; no write premium stated | 2027 price: $0.180 → $0.086 (2026 price: $0.090 → $0.043) | 2027 price: $4.68 → $2.22 (≈ HK$17); 2026 price: $2.34 → $1.11 | **No** for the Developer API [S7]. Google points to its Cloud route [S7] (unverified for individuals) | Yes. Preflight allows `x-goog-api-key` [S24] | Paid tier: prompts not used to improve products, logged "for a limited period" for abuse detection, number of days not stated [S15]. Free tier: used for training and read by human reviewers [S15]. Users must be 18 or older [S15] | No good evidence for this model |
| **DeepSeek Flash** (`deepseek-flash` = DeepSeek-V4.1-Flash) [S17][S19] | peak $0.30 / $1.20; off-peak half [S17] | cache hit $0.006 peak [S17]; automatic, no write fee mentioned, "best-effort" [S18] | peak $0.034 → $0.014; off-peak $0.017 → $0.007 | peak $0.89 → $0.35 (≈ HK$3); off-peak $0.44 → $0.18 | **Yes**, no region restriction found [S21] | Yes. Preflight allows `Authorization` [S24] | Data stored and processed in the People's Republic of China [S20]. The privacy policy says inputs may be used to train models and gives a right to opt out, but no way to do it [S20]. Retention "as long as necessary" [S20]. Open Platform terms: PRC mainland law, Hangzhou courts; they say nothing on training use of API data or retention [S21] | No good evidence for this model |

DeepSeek peak hours are 01:00–04:00 and 06:00–10:00 UTC, Monday to Friday [S17], which is **09:00–12:00 and 14:00–18:00 Hong Kong time on weekdays**. Evenings and weekends are off-peak.

### Chinese quality: what evidence exists

- There is **no good evidence** for any of the five current models above on Hong Kong written Chinese or on Traditional Chinese.
- The published Cantonese benchmarks test older models. Yue-Benchmark (2024) tested GPT-4, GPT-4o, Claude 3.5 Sonnet, Qwen and others, but not Gemini or DeepSeek. The GPT-4 family and Claude 3.5 led on Cantonese reasoning, and Qwen-2.5-72B led on Cantonese general knowledge [S31]. HKCanto-Eval (2025) found that "proprietary models generally outperform open-weight models" and that "significant limitations remain" [S32].
- These benchmarks test spoken Cantonese. Phasy needs formal HK written Chinese (書面語), which is close to standard Traditional Chinese. My judgement (not sourced): the likely failures are Taiwan or mainland word choices and stray simplified characters, not an inability to write.
- The cheapest reliable evidence is a small in-house test before committing: run the same 10 Session transcripts through two or three candidates and have the owner rate the Chinese. This costs well under US$1 in total at the prices above.

## 2. Cost arithmetic

Formulas per Session (prices per MTok, divided by 1,000,000):

- No cache: `15 × 6,000 × input + 15 × 400 × output` = `90,000 × input + 6,000 × output`.
- Cached: `5,000 × write + 14 × 5,000 × hit + 15 × 1,000 × input + 6,000 × output`.
- Per month = per Session × 26.

Worked example, Claude Sonnet 5:

- No cache: 90,000 × $2 = $0.180; plus 6,000 × $10 = $0.060. Total **$0.240** per Session; × 26 = **$6.24** per month.
- Cached: 5,000 × $2.50 = $0.0125; 70,000 × $0.20 = $0.0140; 15,000 × $2 = $0.0300; 6,000 × $10 = $0.0600. Total **$0.1165** per Session; × 26 = **$3.03** per month.

Script output (`python llm-provider-cost.py`, USD):

| Provider | No cache / Session | Cached / Session | No cache / month | Cached / month | Cached HKD / month |
|---|---:|---:|---:|---:|---:|
| Claude Sonnet 5 | 0.2400 | 0.1165 | 6.24 | 3.03 | 23.6 |
| Claude Haiku 4.5 | 0.1200 | 0.0582 | 3.12 | 1.51 | 11.8 |
| OpenAI GPT-6 Sol | 0.2400 | 0.1165 | 6.24 | 3.03 | 23.6 |
| Gemini 3.8 Flash (2027 price) | 0.1800 | 0.0855 | 4.68 | 2.22 | 17.3 |
| Gemini 3.8 Flash (to 2026-12-31) | 0.0900 | 0.0427 | 2.34 | 1.11 | 8.7 |
| DeepSeek Flash (peak) | 0.0342 | 0.0136 | 0.89 | 0.35 | 2.8 |
| DeepSeek Flash (off-peak) | 0.0171 | 0.0068 | 0.44 | 0.18 | 1.4 |

Caveats:

- **Hidden reasoning is the biggest swing.** Sonnet 5 runs adaptive thinking unless it is turned off, and thinking tokens are billed as output [S1]. Each extra 1,000 reasoning tokens per call adds, per Session: Sonnet 5 $0.15, Haiku 4.5 $0.075, GPT-6 Sol $0.15, Gemini 3.8 Flash $0.11 (2027 price), DeepSeek Flash $0.018 (peak). For Sonnet 5 that more than doubles the cached cost. Turn thinking off or keep effort low for routine turns.
- **Token counts differ by provider** for the same Chinese text. Anthropic says its models from Claude 4.7 on produce about 30% more tokens for the same text [S2]. I assume Sonnet 5 is included; that is unverified. Read the 6,000-token figure as ±30%.
- Caching is automatic and best-effort on OpenAI, Gemini and DeepSeek [S10][S14][S18]. On Anthropic it must be requested with `cache_control` [S1]. Haiku 4.5 and Gemini 3.8 Flash do not cache prefixes under 4,096 tokens [S1][S14]. The 5,000-token prefix clears that limit, but not by much.

## 3. Where the key can live

| Option | Setup effort | Real risk for a two-person private app | Cap on damage |
|---|---|---|---|
| **(a) Key typed into the app, kept on the phone** (IndexedDB), one key per phone | Lowest: a settings field and a direct `fetch` to the provider (all four allow browser calls [S24]) | Anyone or anything that can run script on the app's origin can read the key: a bad dependency, an injected script, or someone with the unlocked phone. The key must be left out of the "Export backup" JSON. A leaked key lets a stranger spend on the account until the cap. For a private static app with no third-party scripts, the chance of a leak is low. | Anthropic: set your own monthly spend limit below the tier cap; requests then fail with 400 [S3]. Put Phasy in its own workspace with its own spend limit (limits cannot be set on the default workspace) [S3]. OpenAI: project hard limit; requests fail with 429 `project_spend_limit_exceeded`; small overrun possible (read via search snippet of [S12]). Gemini: prepaid credit (minimum $5) stops all keys at $0; project spend caps react with about 10 minutes of lag [S16]. DeepSeek: prepaid balance only, so it can never spend more than the balance; unspent balance refundable in one lump sum [S17][S21]. |
| **(b) Tiny proxy holding the key**: a Cloudflare Worker with the key stored as a secret; the phone sends a per-phone shared token | Medium: a Cloudflare account, about 30 lines of Worker code, a deploy tool, one secret. Free plan: 100,000 requests a day and 10 ms CPU per request. Time spent waiting on the provider does not count as CPU [S25]. Phasy's volume is about 90 calls a week. | The provider key never reaches the phone. But the phone token can leak the same way as (a), and whoever holds it can use the proxy. The proxy can limit the damage: allow only one model, cap `max_tokens`, cap calls per day. One more service to keep running. **It does not legitimately solve the Hong Kong region problem** (see the main finding) [S26]. | The provider cap as in (a), plus caps enforced in the proxy. Revoke a phone by changing its token, with no change to the provider key. |
| **(b2) Proxy behind Cloudflare Access**: the PWA and the Worker on one domain, login by an emailed one-time PIN | Medium-high: (b) plus a Zero Trust set-up with an allow-list of two email addresses. Free for up to 50 users (search snippet of Cloudflare's plan announcement; the current plan page did not show details, partly unverified) [S27] | No secret is stored in the app at all. The risk moves to the two email inboxes. Logins expire and need a new PIN from time to time. | Same as (b). |
| **(c) Cloud-platform route**: Google Cloud (Gemini) or Azure OpenAI, called through a proxy like (b) | High: a cloud account with billing, a project or resource in a non-HK region, cloud credentials held server-side. Individual eligibility, prices and browser access are **unverified** [S28][S30] | This is the legitimate way to reach Gemini or OpenAI from Hong Kong, going by Google's and Microsoft's own statements [S7][S28][S29]. More moving parts, and cloud billing is harder to cap hard. | Unverified for these platforms. Cloud budget alerts are not necessarily hard stops. |

## 4. Body data that would leave the phone

Per Session under the design in tickets 06 and 07 (about 90,000 input tokens across 15 calls):

- **Sent**:
  - fixed instructions and the Library candidate subset (not personal);
  - saved Member information;
  - the Complaint history: zone ids, kind, Provoking situation ids, Test-movement scores, dates;
  - past Tenderness scores and Familiar-pain marks per muscle and side, and past treatments;
  - the Receiver's free-text answers in Chinese, which can contain anything they type, such as an injury story, work or names;
  - whether a Helper is present;
  - the model's own replies: questions, ranking, Treatment plan and summary.
- **Does not need to be sent**:
  - names: send "Member A" / "Member B";
  - photos;
  - 3D positions (under ADR 0001 these stay in the Library);
  - device or contact details.
  Stripping names makes the data pseudonymous. It is still health data about identifiable people to anyone who can link the account to the owner.

Settings that apply to an individual paying account:

| Provider | Training on API data | Retention | Where processed | Settings the owner can change |
|---|---|---|---|---|
| Anthropic | Not used by default. Used only if feedback or bug reports are sent [S23] | Deleted within 30 days [S22] | "global" by default; `inference_geo: "us"` pins to the US for 1.1× price [S2] | Zero retention needs an agreement with Anthropic [S22]. Self-serve for individuals: unverified |
| OpenAI | Not used by default [S11] | Abuse logs up to 30 days; `store=true` keeps responses ≥ 30 days [S11] | Data residency needs approval for non-US regions [S11] | Send `store=false`. Zero retention needs sales approval [S11] |
| Gemini (paid) | Not used to improve products [S15] | Logged "for a limited period" for abuse detection; days not stated [S15] | Not stated [S15] | Use the paid tier only. The free tier trains on the data and lets human reviewers read it [S15] |
| DeepSeek | Privacy policy: may be used for training; opt-out right with no stated way to use it [S20]. API terms say nothing [S21] | "As long as necessary" [S20] | People's Republic of China [S20]; PRC law and Hangzhou courts [S21] | None found |

## Recommendation

1. The comparison is decided by region access and privacy, not price. Every option costs under about HK$25 a month with caching, and DeepSeek costs about HK$3.
2. Of the four providers, only DeepSeek can be used directly and legitimately from Hong Kong. For v1 I would use **DeepSeek Flash with the key kept on each phone** and a small prepaid balance (about US$5) as a hard cap on damage. Send pseudonymous body data only, with no names or photos.
3. **Main risk**: the couple's body data and free-text answers are stored in mainland China under PRC law and may be used to train DeepSeek's models, with no working opt-out.
4. If the owner will not accept that, the fallback is Gemini through Google Cloud or GPT through Azure, behind a Cloudflare Worker with an email-PIN login. First confirm that an individual in Hong Kong can open those accounts, and at what price.
5. Either way, run a 10-transcript Chinese-quality test before committing, because no published evidence covers these models.

## Unverified or open

- Whether an **individual** in Hong Kong can open Google Cloud (Gemini) or Azure OpenAI accounts, at what price, and whether their keys work from a browser [S28][S30].
- Claude through AWS Bedrock or Google Cloud from Hong Kong. Secondary sources say it is blocked; the primary page could not be read [S33].
- Whether DeepSeek uses **API** traffic (as opposed to its app) for training, and how long it keeps it [S20][S21].
- How many days Gemini's paid-tier abuse logs are kept, and whether its automatic caching charges for storage [S14][S15].
- Zero data retention for individual Anthropic accounts [S22].
- The CORS probe [S24] only proves that browsers are allowed to send the request (the preflight). No real model call was made, because that would need a key and would cost money.
- OpenAI spend-limit details and the Cloudflare Access 50-user free limit come from search snippets of official pages, not a full page read [S12][S27].
- Chinese quality for all five models: no good evidence [S31][S32].

## Sources (all read 2026-09-24)

- [S1] `claude-api` skill bundled with Claude Code (model table cached 2026-06-24). Used for model ids, minimum cacheable prefix per model (`shared/prompt-caching.md`), 5-minute cache timer, and thinking behaviour on Sonnet 5.
- [S2] Anthropic pricing: https://platform.claude.com/docs/en/about-claude/pricing.md
- [S3] Anthropic rate and spend limits: https://platform.claude.com/docs/en/api/rate-limits.md
- [S4] Anthropic TypeScript SDK README (`dangerouslyAllowBrowser`): https://github.com/anthropics/anthropic-sdk-typescript
- [S4b] Secondary source for the header name `anthropic-dangerous-direct-browser-access`: https://simonwillison.net/2024/Aug/23/anthropic-dangerous-direct-browser-access/ (the probe [S24] confirms the server accepts this header)
- [S5] Anthropic supported regions: https://www.anthropic.com/supported-countries
- [S6] OpenAI supported countries: https://developers.openai.com/api/docs/supported-countries
- [S7] Gemini API available regions: https://ai.google.dev/gemini-api/docs/available-regions
- [S8] OpenAI pricing: https://developers.openai.com/api/docs/pricing
- [S9] OpenAI models: https://developers.openai.com/api/docs/models
- [S10] OpenAI prompt caching: https://developers.openai.com/api/docs/guides/prompt-caching
- [S11] OpenAI data controls: https://developers.openai.com/api/docs/guides/your-data
- [S12] OpenAI spend limits (search snippet only): https://developers.openai.com/api/docs/guides/spend-limits
- [S13] Gemini pricing (page updated 2026-09-23): https://ai.google.dev/gemini-api/docs/pricing
- [S14] Gemini caching: https://ai.google.dev/gemini-api/docs/caching
- [S15] Gemini API terms (updated 2026-04-28): https://ai.google.dev/gemini-api/terms
- [S16] Gemini billing (updated 2026-09-20): https://ai.google.dev/gemini-api/docs/billing
- [S17] DeepSeek pricing: https://api-docs.deepseek.com/quick_start/pricing
- [S18] DeepSeek context caching: https://api-docs.deepseek.com/guides/kv_cache
- [S19] DeepSeek API docs home (OpenAI/Anthropic-compatible format, model names): https://api-docs.deepseek.com/
- [S20] DeepSeek privacy policy (updated 2026-02-10): https://cdn.deepseek.com/policies/en-US/deepseek-privacy-policy.html
- [S21] DeepSeek Open Platform terms (effective 2026-04-29): https://cdn.deepseek.com/policies/en-US/deepseek-open-platform-terms-of-service.html
- [S22] Anthropic data retention (updated 2026-07-01): https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data
- [S23] Anthropic model training (updated 2026-08-18): https://privacy.claude.com/en/articles/7996868-is-my-data-used-for-model-training
- [S24] CORS preflight probe run on 2026-09-24 from the owner's PC. It sent `OPTIONS` requests with `Origin: https://phasy.example.com`, no key and no model call. All of `api.anthropic.com/v1/messages`, `api.openai.com/v1/responses` and `/v1/chat/completions`, `generativelanguage.googleapis.com/.../gemini-3.8-flash:generateContent` and `api.deepseek.com/chat/completions` answered 200 with `access-control-allow-origin` and the requested headers allowed.
- [S25] Cloudflare Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- [S26] Cloudflare Workers placement (default: data centre nearest the request): https://developers.cloudflare.com/workers/configuration/placement/
- [S27] Cloudflare Zero Trust free plan and one-time PIN (search snippets): https://blog.cloudflare.com/teams-plans/ and https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/
- [S28] Microsoft Q&A answer on Azure OpenAI for Hong Kong (2026-03-09): https://learn.microsoft.com/en-us/answers/questions/5813396/providing-solution-in-hong-kong-using-openai-found
- [S29] SCMP, "Microsoft maintains AI services in Hong Kong…" (2024, secondary, search snippet): https://www.scmp.com/tech/big-tech/article/3268233/microsoft-maintains-ai-services-hong-kong-openai-curbs-api-access-china
- [S30] Hong Kong AI Podcast, "How to Get Gemini in Hong Kong" (2026-03-07, secondary): https://hongkongaipodcast.com/blog/gemini-hong-kong
- [S31] "How Well Do LLMs Handle Cantonese?" (Yue-Benchmark, 2024): https://arxiv.org/html/2408.16756v2
- [S32] HKCanto-Eval (2025): https://arxiv.org/abs/2503.12440
- [S33] Claude on Bedrock from Hong Kong (secondary; search snippets only; AWS pages returned 403 or were empty): https://www.eigent.ai/blog/how-to-use-claude-in-hong-kong , https://builder.aws.com/content/3IKafAdgh3M4UNo5CS2xXWGPuOz/i-tested-bedrock-from-hong-kong-across-4-regions-description , https://repost.aws/knowledge-center/bedrock-access-anthropic-model
