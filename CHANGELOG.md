## [0.2.0] - 2026-04-06

> **@kb-labs/ai-review** 0.1.0 → 0.2.0 (manual)
## [0.1.0] - 2026-04-06

> **@kb-labs/ai-review** 0.0.1 → 0.1.0 (minor: new features)

### ✨ New Features

- **review-llm**: Introduces a prompt loader that allows for dynamic loading of rules, enhancing flexibility in rule management.
- **review-cli**: Launches a new V2 CLI plugin with a run command, streamlining user interactions and improving usability.
- **review-llm**: Adds an LLM-Lite analysis engine, providing a lighter option for users who need efficient analysis without heavy resource usage.
- **review-heuristic**: Implements ESLint-based heuristic analysis, helping users maintain coding standards and improve code quality.
- **review-core**: Introduces a V2 core orchestration package, providing a more robust foundation for the system's operations.
- **review-contracts**: Adds a V2 contracts package, ensuring users have access to updated contract management features.
- **contracts**: Migrates the manifest to Level 2, ensuring better compatibility and performance for contract handling.
- **commands**: Introduces explicit flag and result types for the ai-review command, making it easier for users to understand command outputs and options.
- **architecture**: Implements a domain-driven architecture and documentation, improving clarity and structure for users navigating the system.
- **plugin**: Adds ai-review runtime and CLI integration, enhancing the overall user experience by making tools more accessible.
- **providers**: Introduces local and mock review providers, allowing users to test and run reviews in various environments.
- **core**: Ports ai-review heuristics and utilities, ensuring users benefit from the latest enhancements in analytical capabilities.
- **contracts**: Adds ai-review contract schemas, which helps users ensure their contracts are compliant with the latest standards.
- **docs**: Standardizes the ADR format and adds base architecture decisions, making documentation clearer and more navigable for users.
- **analytics**: Integrates analytics into build-context, render, and init-profile commands, providing users with valuable insights into their operations.
- **general**: Replaces legacy analytics with a new analytics SDK, improving performance and reliability for users relying on analytics data.
- **cli**: Migrates the CLI from a commander-based to a manifest-based architecture, enhancing maintainability and user experience.
- **demo**: Adds ESLint configuration and dependencies, helping users set up their development environments with best practices.
- **cli**: Expands the review command with more parameters, offering users greater control and customization over their review processes.
- **CI/CD**: Implements feedback collection, allowing users

### 🐛 Bug Fixes

- **review-cli**: Resolves issues with code formatting, ensuring a cleaner and more consistent experience when using the command line interface.
- **review-core**: Addresses various code style warnings, leading to improved readability and maintainability of the core codebase.
- **review-llm**: Fixes style warnings in LLM analyzers, enhancing the overall quality and consistency of the code.
- **docs**: Updates the "Last Updated" date to November 2025, providing users with accurate information about the documentation's currency.
- **docs**: Corrects a typo in the ADR filename, ensuring users can easily find and reference the correct documentation.
- **build**: Configures the build process for an unbundled version of the manifest, allowing for better compatibility and performance.
- **tests**: Updates tests to adapt to the new configuration structure and ensures proper handling of undefined values, improving the reliability of the software.
- **general**: Fixes a crash in CI/CD processes, ensuring smoother and more reliable deployment pipelines.
- **CI/CD**: Corrects issues with code review runs, leading to a more efficient review process.
- **CI/CD**: Updates conditions for launching reviews, making the process more intuitive and user-friendly.
- **CI/CD**: Enhances label usage for review launches, allowing for more precise control over the review process.
- **CI/CD**: Fixes the functionality of running reviews based on label changes, streamlining the review workflow.
- **cli**: Fixes syntax issues, ensuring that the command line interface functions correctly without errors.
- **cli**: Updates the markdown rendering script, leading to improved output formatting for better user readability.
- **CI/CD**: Adds GitHub tokens, facilitating secure access and improved integration with third-party services.
- **CI/CD**: Updates the CI/CD review configuration file, ensuring it aligns with the latest requirements and practices.
- **general**: Stabilizes package deployments, leading to a more reliable user experience when installing and using the software.
- **apps**: Fixes deployment issues for the demo application, ensuring users can access the demo without problems.
- **packages**: Corrects an incorrect TypeScript configuration, enhancing compatibility and reducing potential errors for users.
- **general**: Resolves import issues in packages, leading to a smoother setup and usage experience for all users.
