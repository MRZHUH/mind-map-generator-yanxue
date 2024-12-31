# Mind Map Generator Chrome Extension

## Overview

The Mind Map Generator is a Chrome extension that allows users to generate mind maps from web page content using OpenAI's language models. This tool is particularly useful for summarizing articles, blog posts, or any web content into a structured mind map format.

## Features

- **API Configuration**: Easily configure your OpenAI API Key, Base URL, and Model directly from the extension's popup.
- **Dynamic Model Selection**: Choose the model you want to use for generating mind maps.
- **Content Extraction**: Automatically extracts and cleans content from the current web page.
- **Mind Map Generation**: Generates a mind map in Markdown format, using the specified OpenAI model.

## Installation

1. **Clone the Repository**: 
   ```bash
   git clone https://github.com/yourusername/mind-map-generator.git
   ```

2. **Load the Extension in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`.
   - Enable "Developer mode" in the top right corner.
   - Click "Load unpacked" and select the directory where you cloned the repository.

## Usage

1. **Configure API Settings**:
   - Click on the extension icon in the Chrome toolbar to open the popup.
   - Enter your OpenAI API Key, Base URL, and select the desired model.
   - Click "Save Settings" to store your configuration.

2. **Generate a Mind Map**:
   - Navigate to a web page you want to summarize.
   - Click the "Generate Mind Map" button in the extension popup.
   - The extension will extract the content, send it to the OpenAI API, and display the generated mind map.

## Requirements

- **Chrome Browser**: Ensure you have the latest version of Chrome installed.
- **OpenAI API Key**: You need an active OpenAI account and API key to use this extension.

## Troubleshooting

- **API Errors**: Ensure your API Key and Base URL are correct. Check your OpenAI account for any issues.
- **Content Not Extracted**: The extension looks for common content containers like `<article>`, `<main>`, or `.content`. If the page structure is different, extraction might fail.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

For any questions or feedback, please contact [bond@funcd.org](mailto:bond@funcd.org).