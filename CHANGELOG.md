# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.13] - 2025-11-06

### Added
- configure() function for manual configuration (simpler alias for initializeRevenium)
- Support for COST_LIMIT and COMPLETION_LIMIT stop reasons
- Support for all 7 operationType enum values (CHAT, GENERATE, EMBED, CLASSIFY, SUMMARIZE, TRANSLATE, OTHER)

### Changed
- **BREAKING:** responseQualityScore now uses 0.0-1.0 scale (was 0-100) per updated API specification
- API endpoint updated from api.revenium.io to api.revenium.ai (new production domain)
- Improved API compliance with proper enum values and field casing
- Enhanced token counting accuracy for cache operations
- Email addresses now masked in debug logs for PII protection
- All examples updated to use 0.0-1.0 scale for responseQualityScore

### Fixed
- Improved documentation accuracy and removed deprecated configuration options
- config.debug property now properly enables debug logging
- Manual configuration example now includes required patchOpenAIInstance call
- Updated OpenAI version requirement to match peer dependency (v5.0.0+)
- Enhanced metadata validation for responseQualityScore scale
- Improved provider detection fallback handling
- Fixed cache token reporting for embeddings API
- reasoningTokenCount now correctly optional based on provider support

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
