# General Copilot Instructions Template

This template provides a structure for creating effective `.github/copilot-instructions.md` files for any repository.

## Purpose

Help Copilot Coding Agent work efficiently by providing:
- Repository context and structure
- Build, test, and validation procedures
- Key architectural decisions
- Common pitfalls and workarounds

## Template Structure

```markdown
# Copilot Instructions for [Repository Name]

## Project Overview

[Brief description: what does this repo do?]
[Repository type: web app, library, CLI tool, etc.]
[Size: small/medium/large, number of files/lines]
[Primary languages and frameworks]
[Target runtime/platform]

## Repository Structure

**Main Source Files**:
- [list key source files with paths and line counts]

**Configuration Files**:
- [build configs: package.json, Makefile, etc.]
- [linting/formatting: .eslintrc, .prettierrc, etc.]
- [CI/CD: .github/workflows/*.yml]

**Documentation**:
- [README, CONTRIBUTING, docs folder, etc.]

## Technology Stack

**Core Technologies**: [languages, frameworks, libraries]
**Build Tools**: [webpack, rollup, make, etc.]
**Testing**: [jest, mocha, pytest, etc.]
**Dependencies**: [key dependencies and their purpose]

## Build, Test, and Development

**Installation/Setup**:
```bash
[exact commands to set up the project from scratch]
```

**Local Development**:
```bash
[commands to run dev server, watch mode, etc.]
[expected ports, URLs, etc.]
```

**Building**:
```bash
[exact build commands]
[expected output location]
[typical build time]
```
**IMPORTANT:** [any critical notes about build process]

**Testing**:
```bash
[commands to run tests]
[how to run specific tests]
[expected test execution time]
```

**Linting/Formatting**:
```bash
[linting commands]
[formatting commands]
[pre-commit hooks if any]
```

**Validation Checklist**:
1. [step by step validation process]
2. [what to verify after changes]

## Architecture

**Key Architectural Elements**:
- [describe major components/modules]
- [data flow and dependencies]
- [design patterns used]

**Directory Structure**:
```
/src - [description]
/tests - [description]
/config - [description]
```

## Coding Standards

**[Language 1]**: [style guidelines, conventions]
**[Language 2]**: [style guidelines, conventions]
**File Organization**: [how files should be organized]
**Naming Conventions**: [variable, function, file naming]

## Common Tasks

**Adding a New Feature**: [steps]
**Modifying Existing Code**: [guidelines]
**Adding Tests**: [how to add and structure tests]
**Updating Dependencies**: [process and precautions]

## Critical Files - DO NOT MODIFY Without Understanding

- [list files that are sensitive/generated/critical]
- [explain why they shouldn't be modified]

## CI/CD and Validation

**GitHub Actions/CI Pipeline**:
- [describe what runs on PR]
- [describe what runs on merge]
- [how to debug failed checks]

**Pre-commit Checks**:
- [what runs locally before commit]

## Deployment

**Deployment Process**: [how code gets deployed]
**Environments**: [dev, staging, prod details]
**Configuration**: [environment-specific configs]

## Troubleshooting

**Common Issues**:
- **[Issue]**: [Solution]
- **[Issue]**: [Solution]

**Known Limitations**:
- [list any known issues or workarounds]

## Agent Instructions

1. **ALWAYS run tests** - [specific guidance]
2. **Build before committing** - [specific guidance]
3. **Follow existing patterns** - [specific guidance]
4. **Check CI/CD before marking complete** - [specific guidance]
5. **Trust these instructions** - Only explore if info incomplete/incorrect

## Additional Notes

[Any project-specific quirks, historical context, or important details]
```

## Guidelines for Using This Template

1. **Be Specific**: Replace all bracketed placeholders with exact commands and information
2. **Test Everything**: Run every command you document to ensure it works
3. **Include Timing**: Note how long builds/tests take to prevent timeouts
4. **Document Failures**: If a command commonly fails, document why and the workaround
5. **Keep Concise**: Aim for 1-2 pages maximum. Be brief but complete.
6. **Update Regularly**: Keep instructions current as the project evolves
7. **Think Like a New Developer**: What would someone new to the project need to know?

## What to Include vs. Exclude

**INCLUDE**:
- Commands that must be run in a specific order
- Non-obvious setup requirements
- Common error messages and solutions
- Build/test execution times
- File structure and key files
- Deployment procedures
- CI/CD pipeline details

**EXCLUDE**:
- Task-specific instructions (this is for general repo knowledge)
- Detailed API documentation (link to it instead)
- Complete code listings (summarize instead)
- Obvious information that's easily discoverable

## Example Scenarios

**Scenario 1: No Build Process**
```markdown
**NO BUILD PROCESS** - This is a static site. Files run directly in browser.
**Local Development**: `python3 -m http.server 8000` or any HTTP server
**CRITICAL**: Must use HTTP server, not file:// protocol (CORS issues)
```

**Scenario 2: Complex Build**
```markdown
**Build Process**: Multi-step build with specific order
1. `npm install` (first time or after package.json changes)
2. `npm run generate-types` (generates TypeScript types, ~30 seconds)
3. `npm run build` (webpack build, ~2 minutes)
**IMPORTANT**: Always run generate-types before build or build will fail
```

**Scenario 3: Test Requirements**
```markdown
**Testing**: 
- `npm test` - Runs all tests (~45 seconds)
- `npm run test:unit` - Unit tests only (~10 seconds)
- `npm run test:e2e` - E2E tests (~3 minutes, requires Docker)
**CRITICAL**: E2E tests will fail if port 3000 is in use
```

## Best Practices

1. **Validate Every Command**: Run it yourself before documenting
2. **Note Prerequisites**: Environment variables, required services, etc.
3. **Document Workarounds**: If something commonly breaks, explain how to fix it
4. **Be Prescriptive**: Use "ALWAYS", "NEVER", "MUST" when appropriate
5. **Explain Why**: For non-obvious requirements, briefly explain the reason
6. **Link to Docs**: Reference detailed documentation rather than duplicating it
7. **Keep It Fresh**: Update when you discover new information

## Maintenance

- Review and update instructions quarterly
- Update immediately after major changes (build process, tech stack, etc.)
- When onboarding new developers, ask them to validate and suggest improvements
- Track common questions from new developers and add answers to instructions
