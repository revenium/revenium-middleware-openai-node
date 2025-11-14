# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.14] - 2025-11-14

### Changed

- Updated Node.js requirement from >=16.0.0 to >=18.0.0 (LTS standard)
- Improved package distribution to exclude source files, include only compiled artifacts
- Enhanced README with governance file references (Contributing, Code of Conduct, Security)

### Fixed

- Updated dashboard URLs from app.revenium.io to app.revenium.ai in examples documentation

## [1.0.13] - 2025-11-06

### Added

- Configure() function for manual configuration
- COST_LIMIT and COMPLETION_LIMIT stop reasons to mapper (per API spec)
- Support for all 7 operationType enum values (CHAT, GENERATE, EMBED, CLASSIFY, SUMMARIZE, TRANSLATE, OTHER)

### Changed

- **BREAKING:** responseQualityScore now uses 0.0-1.0 scale (was 0-100) per updated API specification
- **API URL:** All references updated from api.revenium.io to api.revenium.ai (new production domain)
- **API Compliance:** provider value changed from 'OPENAI' to 'OpenAI' (proper casing per spec)
- **API Compliance:** modelSource changed to 'OPENAI' for direct OpenAI, 'AZURE_OPENAI' for Azure
- **API Compliance:** middlewareSource changed from 'nodejs' to 'revenium-openai-node' per spec format
- **API Compliance:** cacheCreationTokenCount now undefined (not 0) when provider doesn't report
- **API Compliance:** cacheReadTokenCount now uses ?? operator (not ||) to preserve 0 values
- **API Compliance:** timeToFirstToken now undefined (not hardcoded) until real TTFB tracking implemented
- Simplified main README from 675 to 386 lines
- Standardized Azure API versions to 2024-12-01-preview across all files
- Email addresses now masked in debug logs for PII protection
- All examples updated to use 0.0-1.0 scale for responseQualityScore

### Fixed

- Removed broken file references from examples documentation
- Removed non-existent config options from documentation (apiTimeout, failSilent, maxRetries)
- Removed misleading "custom fields" claim from Features section
- config.debug property now properly enables debug logging
- Updated OpenAI version requirement to match peer dependency (v5.0.0+)
- Removed overpromised time-to-first-token metric claim
- Removed taskId field from all files (field does not exist in API spec per code review feedback)
- Added CANCELLED stop reason to mapper for completeness
- validateMetadata now checks 0.0-1.0 scale for responseQualityScore
- Fallback provider detection now uses 'OpenAI' not 'OPENAI' (proper casing)
- Embeddings now send undefined for cache tokens (was incorrectly sending 0)
- reasoningTokenCount now optional (undefined when not reported, per spec)

## [1.0.12] - 2025-10-30

### Changed

- Improved documentation structure and Getting Started tutorial
- Enhanced package distribution to include TypeScript source files

### Fixed

- Repository configuration updates

## [1.0.11] - 2025-10-21

### Added

- Examples now included in npm package
- Comprehensive examples documentation

### Changed

- Updated API endpoint configuration
- Improved documentation structure

## [1.0.10] - 2025-10-17

### Added

- Support for OpenAI Responses API

### Changed

- Enhanced documentation and examples

## [1.0.9] - 2025-10-16

### Changed

- Bug fixes and stability improvements

## [1.0.8] - 2025-10-15

### Added

- Initial release with OpenAI usage tracking
- Support for streaming responses and function calling
- Azure OpenAI support
- TypeScript support with native type integration

[1.0.13]: https://github.com/revenium/revenium-middleware-openai-node/releases/tag/v1.0.13
[1.0.12]: https://github.com/revenium/revenium-middleware-openai-node/releases/tag/v1.0.12
[1.0.11]: https://github.com/revenium/revenium-middleware-openai-node/releases/tag/v1.0.11
[1.0.10]: https://github.com/revenium/revenium-middleware-openai-node/releases/tag/v1.0.10
[1.0.9]: https://github.com/revenium/revenium-middleware-openai-node/releases/tag/v1.0.9
[1.0.8]: https://github.com/revenium/revenium-middleware-openai-node/releases/tag/v1.0.8
