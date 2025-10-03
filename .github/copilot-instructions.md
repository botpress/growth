# Code Review Guidelines and Patterns

This document contains code review patterns and best practices learned from actual PR comments by the team (ermek-botpress, AudricPnd, ptrckbp). Use these patterns to
identify issues and suggest improvements in pull requests.

---

## Review Patterns by Severity

### 🔴 Critical Issues (Must Fix)

#### Using console.log for debugging or logging

- **Check for:** Any `console.log`, `console.error`, `console.warn` statements in Botpress integrations
- **Fix:** Use `logger.forBot()` for bot-level logs (visible to bot builders) or `logger` for integration-level logs (visible to integration builders)
- **Example:**
  - Bot-level: `logger.forBot().info('User action completed')`
  - Integration-level: `logger.info('API connection established')`
- **Note:** Choose based on who needs to see the logs
- **Most likely reviewer:** AudricPnd

#### Passing user input directly to API without validation

- **Check for:** Direct API calls with unvalidated input
- **Fix:** Always validate with Zod schema first
- **Example:** Use `const validated = Schema.parse(input)` before API calls
- **Most likely reviewer:** AudricPnd

#### Not handling Zod parse errors

- **Check for:** `.parse()` calls without try-catch
- **Fix:** Wrap all .parse() calls in try-catch blocks
- **Example:** `try { schema.parse(data) } catch (error) { /* handle */ }`
- **Most likely reviewer:** AudricPnd

#### Throwing generic errors

- **Check for:** `throw new Error()` statements
- **Fix:** Use `sdk.RuntimeError` for proper error handling
- **Example:** Replace with `throw new sdk.RuntimeError("Descriptive message")`
- **Most likely reviewer:** ermek-botpress

#### Logging sensitive information

- **Check for:** Tokens, passwords, API keys in logs
- **Fix:** Remove all sensitive data from logs
- **Example:** Never log authentication tokens or credentials
- **Most likely reviewer:** ptrckbp

---

### 🟡 Important Issues (Should Fix)

#### SDK already validates input automatically

- **Check for:** Manual input parsing in actions
- **Fix:** Don't manually parse input - SDK handles it
- **Note:** Input is already validated by SDK when it reaches your action
- **Most likely reviewer:** ermek-botpress

#### Optional fields without clear purpose

- **Check for:** Optional fields (`?`) when the field is actually always used in the code
- **Fix:** If always needed, make required with a default: `field: z.boolean().default(false)`
- **Example:** `historicalImport?: z.boolean()` → `historicalImport: z.boolean().default(false)`
- **Question to answer:** "Why is this field optional if it's always used?"
- **Most likely reviewer:** ermek-botpress

#### Validation logic in action code

- **Check for:** Validation after Zod schemas
- **Fix:** Move all validation to Zod schemas
- **Example:** Don't check email format in action if Zod already validates it
- **Most likely reviewer:** ermek-botpress

#### Using .passthrough() on output schemas

- **Check for:** `.passthrough()` in output definitions
- **Fix:** Define explicit schema matching API response types (unless you specifically need to preserve unknown fields from the API)
- **Example:** Instead of `z.object({}).passthrough()`, define the actual fields
- **Note:** Sometimes passthrough is valid if you're proxying API responses unchanged
- **Most likely reviewer:** ermek-botpress

#### Unused imports or variables

- **Check for:** Grayed out imports, unused variables
- **Fix:** Remove all unused code
- **Example:** Delete unused imports and variables
- **Most likely reviewer:** AudricPnd

#### Poor variable naming

- **Check for:** Single letters, unclear names
- **Fix:** Use descriptive names
- **Example:** `const profile = profiles[0]` not `const p = profiles[0]`
- **Most likely reviewers:** ermek-botpress, ptrckbp

#### Duplicated schema definitions

- **Check for:** Same schema defined multiple times
- **Fix:** Factorize common schemas
- **Example:** Define once and reuse: `const SuccessSchema = z.object({success: z.boolean()})`
- **Most likely reviewer:** AudricPnd

#### Unnecessary function abstractions

- **Check for:** Wrapper functions that add no value
- **Fix:** Use directly without wrapper
- **Example:** Don't wrap `new ApiClient()` if it's just passing through
- **Most likely reviewer:** ermek-botpress

#### Double try-catch blocks

- **Check for:** Nested try-catch statements
- **Fix:** Handle errors at one level only
- **Example:** Handle at action level, not in helper functions
- **Most likely reviewer:** ermek-botpress

#### Logging then throwing the same error

- **Check for:** `logger.error(msg); throw new Error(msg)`
- **Fix:** Either log OR throw, not both
- **Example:** Just `throw new sdk.RuntimeError(message)`
- **Most likely reviewer:** ermek-botpress

#### Catch and immediately rethrow

- **Check for:** `catch(e) { throw e }`
- **Fix:** Remove unnecessary catch blocks
- **Example:** Let errors bubble up naturally
- **Most likely reviewer:** ermek-botpress

---

### 📝 Documentation & PR Description

#### PR description lacks context

- **Check for:** Missing purpose, problem solved, testing approach
- **Fix:** Add comprehensive description
- **Most likely reviewer:** ermek-botpress

#### Vague PR titles

- **Check for:** Non-descriptive titles
- **Fix:** Make titles descriptive
- **Example:** "Add global prettier configuration" not "Sr/global linter"
- **Most likely reviewer:** ermek-botpress

#### Redundant comments in documentation

- **Check for:** Obvious statements
- **Fix:** Remove redundant text
- **Example:** Don't state "You need an account to get an API key"
- **Most likely reviewer:** AudricPnd

#### Hub.md contains setup instructions

- **Check for:** Technical setup steps, configuration details, or installation instructions in hub.md
- **Fix:** Hub.md should only contain: integration overview, key features, use cases
- **Move to README:** Setup instructions, configuration steps, technical details
- **Most likely reviewer:** ermek-botpress

#### Non-standard fields without examples

- **Check for:** Custom fields with no explanation
- **Fix:** Add examples for clarity
- **Example:** `customField: string // Example: "user_123"`
- **Most likely reviewer:** AudricPnd

---

### 🏗️ Code Organization

#### Long files with multiple domains

- **Check for:** Files over 300 lines mixing concerns
- **Fix:** Split by domain
- **Example:** Split into `common-schema.ts`, `contact-schema.ts`
- **Most likely reviewer:** AudricPnd

#### Extra files in actions folder

- **Check for:** Non-action files in actions/
- **Fix:** Keep only index.ts and domain files
- **Example:** Move utilities elsewhere
- **Most likely reviewer:** ermek-botpress

#### Unused schemas defined

- **Check for:** Exported but never imported schemas
- **Fix:** Remove unused code
- **Most likely reviewer:** AudricPnd

#### Long methods with comment sections

- **Check for:** Methods with `// Step 1`, `// Step 2` comments
- **Fix:** Extract into separate methods
- **Example:** Each step becomes its own method
- **Most likely reviewer:** ptrckbp

---

### 🎨 Code Style & Formatting

#### Missing code formatters

- **Check for:** Inconsistent formatting
- **Fix:** Run Prettier and ESLint
- **Most likely reviewers:** AudricPnd, ptrckbp

#### Mixing formatting with logic changes

- **Check for:** Format changes in feature PRs
- **Fix:** Separate PRs for formatting
- **Most likely reviewer:** ptrckbp

---

### 🔧 Type Safety

#### Missing type annotations

- **Check for:** Inferred types on variables
- **Fix:** Add explicit types
- **Example:** `const cfg: ConfigType = await ctx.configReader.get()`
- **Most likely reviewer:** ermek-botpress

#### Missing return types on functions

- **Check for:** Functions without return types
- **Fix:** Always specify return types
- **Example:** `async function validate(): Promise<boolean>`
- **Most likely reviewer:** ermek-botpress

#### Using classes as types

- **Check for:** Runtime imports for types only
- **Fix:** Use `import type`
- **Example:** `import type { ProfileCreateQuery } from 'klaviyo'`
- **Most likely reviewer:** ermek-botpress

#### Using enums

- **Check for:** Enum definitions
- **Fix:** Use string literals instead
- **Example:** `type Status = 'active' | 'inactive'` not enum
- **Most likely reviewer:** ermek-botpress

---

### 🔄 API Integration Patterns

#### Overly defensive error handling

- **Check for:** Complex error utilities
- **Fix:** Trust SDK error types
- **Example:** Use simple error messages
- **Most likely reviewers:** ptrckbp, ermek-botpress

#### Checking response.ok with Axios

- **Check for:** `if (response.status !== 200)`
- **Fix:** Axios throws on non-2xx automatically
- **Most likely reviewer:** ermek-botpress

#### Single parameter functions with objects

- **Check for:** `function fn({id}: {id: string})`
- **Fix:** Use direct parameter
- **Example:** `function fn(id: string)`
- **Most likely reviewer:** ermek-botpress

---

### 🏷️ Naming Conventions

#### Unclear variable names

- **Check for:** Ambiguous naming
- **Fix:** Be explicit
- **Example:** `customProperties` not just `properties`
- **Most likely reviewer:** ermek-botpress

#### Variable names not specific enough

- **Check for:** Generic names that don't describe the content or state
- **Fix:** Use specific, descriptive names
- **Example:** `kbIds` → `clearedKbIds` or `remainingKbsToClear` (specify the state/purpose)
- **Most likely reviewer:** ptrckbp

---

### 📦 Package Configuration

#### Starting version numbers

- **Check for:** Version 0.0.1
- **Fix:** Start at 1.0.0
- **Most likely reviewer:** ermek-botpress

#### Workspace naming

- **Check for:** Non-botpress workspace
- **Fix:** Use @botpress/ namespace
- **Most likely reviewers:** ermek-botpress, ptrckbp

#### Missing private field

- **Check for:** No private field in package.json
- **Fix:** Add `"private": true`
- **Most likely reviewer:** ermek-botpress

---

### ⚠️ Breaking Changes

#### Changing input/output formats

- **Check for:** Schema changes
- **Fix:** Bump major version
- **Most likely reviewer:** ptrckbp

---

## Quick Reference Checklist

### Code Quality

- ✅ No console.log statements - use logger
- ✅ No sensitive data in logs
- ✅ No unused imports or variables
- ✅ Descriptive variable names
- ✅ No duplicate error messages

### Validation & Types

- ✅ Let SDK validate inputs
- ✅ Required fields have defaults
- ✅ Validation in Zod schemas only
- ✅ Return types on all functions
- ✅ Import types with `import type`
- ✅ No .passthrough() on outputs

### Error Handling

- ✅ Using sdk.RuntimeError
- ✅ Try-catch around .parse()
- ✅ No double try-catch
- ✅ No catch-and-rethrow

### Code Organization

- ✅ Actions folder structure correct
- ✅ Methods extracted from long functions
- ✅ No unnecessary abstractions
- ✅ Shared schemas factorized
- ✅ No dead code

### Documentation

- ✅ PR description complete
- ✅ Hub.md minimal
- ✅ Complex patterns explained
- ✅ Non-standard fields have examples

### Package & Config

- ✅ Version 1.0.0+
- ✅ Workspace @botpress/
- ✅ private: true
- ✅ Major bump for breaking changes

---

## Comment Format Guidelines

When providing review feedback, use these prefixes:

- `issue:` for must-fix problems (critical)
- `suggestion:` for improvements (important)
- `question:` for clarifications needed
- `praise:` for good practices
- `nit:` for minor issues

Always attribute comments to the most likely reviewer based on the patterns above.
