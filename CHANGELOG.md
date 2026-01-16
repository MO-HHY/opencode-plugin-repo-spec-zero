# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-01-17

### Added
- **Smart DAG Planner**: Dynamic agent selection and execution based on detected repository features.
- **Feature Detector**: Automatic detection of frameworks, languages, and architecture patterns.
- **Diagram Generator**: Automatic generation of Mermaid.js diagrams (ERD, Sequence, Flowchart, Class, State, C4).
- **Template System**: Handlebars-style markdown templates for consistent output.
- **Hierarchical Output**: New 8-layer folder structure (`00-foundation` to `07-ops`).
- **Manifest Validator**: Robust validation and repair tool for specs manifests.
- **CLI Flags**: Added `--smart-dag`, `--diagrams`, `--template`, and `--skipAgents`.
- **Standalone Diagrams**: Export diagrams as `.mmd` files with SPEC-OS frontmatter.

### Changed
- **Modular Swarm**: Refactored hardcoded agents into generic analysis agents driven by prompts.
- **Prompt Registry**: Prompts are now stored externally in a versioned registry.
- **Manifest v2.1**: Extended manifest with `file_locations`, `structure_hash`, and `folder_structure_version`.
- **Improved index.md**: Better organization with grouped sections and relative links.

### Fixed
- Idempotency issues in folder creation.
- Improved error handling for large repositories.

## [2.0.0] - 2025-11-20
- Initial v2 release with Git Submodule support.
- Specialized 17-agent swarm.
- Audit mode and Apply command.
- Specs manifest v2.0.
