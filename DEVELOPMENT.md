# Development Guide

This guide is for developers working on the `@revenium/openai` package itself.

## Testing Pre-Release Versions

### 1. Build and Package

```bash
# Clone the repository
git clone https://github.com/revenium/revenium-middleware-openai-node.git
cd revenium-middleware-openai-node

# Install dependencies and build
npm install
npm run build
npm pack
```

### 2. Create Test Project

```bash
# Create test project in parent directory
cd ..
mkdir test-project && cd test-project
npm init -y

# Install dependencies
npm install openai dotenv tsx

# Install the local package (replace version as needed)
npm install ../revenium-middleware-openai-node/revenium-openai-*.tgz
```

### 3. Create Environment File

Create `.env` with your API keys:

```bash
REVENIUM_METERING_API_KEY=hak_your_api_key
OPENAI_API_KEY=sk_your_openai_key
REVENIUM_DEBUG=true
```

### 4. Test Basic Integration

Create `test.mjs`:

```javascript
import 'dotenv/config';
import { initializeReveniumFromEnv, patchOpenAIInstance } from '@revenium/openai';
import OpenAI from 'openai';

const openai = patchOpenAIInstance(new OpenAI());

const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: 'Test message' }],
  usageMetadata: {
    subscriber: { id: 'test-user' },
    organizationId: 'test-org'
  }
});

console.log('✅ Success:', response.usage);
```

Run with debug logging:

```bash
REVENIUM_DEBUG=true node test.mjs
```

**Expected output:**
```
[Revenium Debug] Revenium middleware initialized from environment variables
[Revenium Debug] OpenAI instance patched successfully
[Revenium Debug] OpenAI chat.completions.create intercepted
[Revenium Debug] Revenium tracking successful
✅ Success: { prompt_tokens: 10, completion_tokens: 15, total_tokens: 25 }
```

### 5. Test All Module Formats

**CommonJS** (`test.cjs`):
```javascript
require('dotenv/config');
const { initializeReveniumFromEnv, patchOpenAIInstance } = require('@revenium/openai');
// ... same code
```

**ES Modules** (`test.mjs`):
```javascript
import 'dotenv/config';
import { initializeReveniumFromEnv, patchOpenAIInstance } from '@revenium/openai';
// ... same code
```

**TypeScript** (`test.ts`):
```typescript
import 'dotenv/config';
import { initializeReveniumFromEnv, patchOpenAIInstance } from '@revenium/openai';
// ... same code, run with: npx tsx test.ts
```

### 6. Test Streaming

Add `stream: true` to the request:

```javascript
const stream = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: 'Count to 3' }],
  stream: true,
  usageMetadata: { subscriber: { id: 'test-user' } }
});

for await (const chunk of stream) {
  if (chunk.choices[0]?.delta?.content) {
    process.stdout.write(chunk.choices[0].delta.content);
  }
}
```

## Complete Examples

See the [examples/](./examples/) directory for complete working examples:

- `getting_started.ts` - Simple entry point
- `openai-basic.ts` - Chat and embeddings
- `openai-streaming.ts` - Streaming responses
- `azure-basic.ts` - Azure OpenAI

Run any example:
```bash
npx tsx node_modules/@revenium/openai/examples/getting_started.ts
```

## Development Workflow

### Make Changes

```bash
# 1. Edit source code in src/
# 2. Rebuild
npm run build

# 3. Create test package
npm pack

# 4. Test in your test project
cd ../test-project
npm install ../revenium-middleware-openai-node/revenium-openai-*.tgz
node test.mjs
```

### Build Commands

```bash
npm run build          # Build all formats (CJS, ESM, Types)
npm run build:cjs      # CommonJS only
npm run build:esm      # ES Modules only
npm run build:types    # TypeScript definitions only
npm run clean          # Remove dist/ directory
```

## Publishing Checklist

Before publishing a new version:

- [ ] Version number updated in `package.json`
- [ ] `CHANGELOG.md` updated with version and date
- [ ] Clean build: `npm run clean && npm run build`
- [ ] Package test: `npm pack --dry-run`
- [ ] Test local installation in fresh project
- [ ] Verify all module formats work (CJS, ESM, TS)
- [ ] Examples run successfully
- [ ] Documentation updated if API changed

## Package Structure

```
dist/
├── cjs/           # CommonJS build
├── esm/           # ES Modules build
└── types/         # TypeScript definitions

src/
├── core/          # Core middleware logic
├── types/         # TypeScript types
└── utils/         # Utility functions

examples/          # Working examples (included in npm package)
```

## Contributing

For package contributors:

1. Follow existing code patterns
2. Maintain TypeScript compatibility
3. Test with both CJS and ESM
4. Update documentation for API changes
5. Add examples for new features
