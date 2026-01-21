## LLM Rules

- Do not change database schema unless explicitly requested
- Prefer small, explicit functions over abstractions
- No new dependencies without approval
- No global state
- Follow existing formatting and naming conventions
- Do not refactor unrelated code
- If unsure, ask before acting

## Svelte 5 Runes Mode

**IMPORTANT: This project uses Svelte 5 with runes mode enabled by default.**

- **NEVER use `$:` reactive statements** - they are not allowed in runes mode
- **ALWAYS use `$derived()` for computed values** instead of `$:`
- **Use `$props()` instead of `export let`** for component props
- **Use `$state()` instead of `let`** for reactive state variables
- **Use `$derived()` for reactive computations** that depend on other reactive values

**Common patterns:**
- ❌ `$: t = translations[$language]` → ✅ `const t = $derived(translations[$language])`
- ❌ `export let formData` → ✅ `let { formData } = $props<{ formData: ... }>()`
- ❌ `let count = 0` (for reactive state) → ✅ `let count = $state(0)`

**Store subscriptions:** You can still use `$language` (with `$` prefix) to subscribe to stores, but wrap it in `$derived()` when using it in computations:
- ✅ `const t = $derived(translations[$language])` (correct)
- ❌ `$: t = translations[$language]` (will cause error)
