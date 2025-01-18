# Angular Hoisting Formatter

**Angular Hoisting Formatter** is an extension designed to help developers reorder methods and variables in Angular components. This avoids issues with hoisting by ensuring that all methods and variables are declared before being referenced in the code.

## Features
This extension provides the following functionalities:
- **Reorder methods and variables**: Automatically reorders methods and variables in Angular components to avoid references before declarations.
- **Prettier formatting**: Formats code according to the Prettier configuration, ensuring a consistent style with features such as:
  - Semi-colons
  - Single quotes
  - Trailing commas
  - Space inside objects
  - Tab width of 2
- **Integration with Angular**: Works seamlessly with Angular components, especially for component classes.

## Installation

You can install the **Angular Hoisting Formatter** extension from the Visual Studio Marketplace:

[Angular Hoisting Formatter on VSCode Marketplace](https://marketplace.visualstudio.com)

Alternatively, you can install the extension manually using the `.vsix` file. Follow these steps:

1. Download the `.vsix` file for the release you want.
2. In Visual Studio Code, go to the Extensions tab.
3. Click the `...` menu in the upper-right corner and select **Install from VSIX...**.
4. Select the `.vsix` file you just downloaded.

Alternatively, you can use the following command:

```bash
code --install-extension /path/to/angular-hoisting-formatter.vsix
```

## Configuration
The extension automatically reorders methods and variables when the corresponding command is triggered. You can adjust the Prettier configuration by customizing the extension settings in VSCode.

Example Prettier configuration options:

```bash
{
    "prettier.semi": true,
    "prettier.singleQuote": true,
    "prettier.trailingComma": "all",
    "prettier.tabWidth": 2,
    "prettier.useTabs": true
}
```

## Versioning
This extension uses Prettier for formatting and TypeScript for code parsing. It bundles the latest version of Prettier with the extension for consistency.