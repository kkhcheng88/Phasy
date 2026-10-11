# The LLM reasons; the Library holds every position

The app uses an LLM for the physiotherapist's reasoning — asking questions, choosing the next Check, reading the Receiver's answers, suggesting treatment — but the LLM may only refer to Library items by id and never produces a body position itself. LLMs describe locations well in words but are unreliable at exact points on a 3D model, and a wrong point shown confidently on the 3D body makes the Helper press the wrong place. Every trigger point, referral zone and cupping placement therefore comes from the checked Library.

## Considered Options

- LLM decides everything, including positions — rejected for the reason above.
- No LLM, a fixed question tree — rejected: the tree would be huge to hand-write and would lose the "a physiotherapist is reasoning with you" feel.
