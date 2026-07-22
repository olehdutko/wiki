#!/usr/bin/env zsh
set -e

# Homebrew on Apple Silicon
export PATH="/opt/homebrew/bin:$PATH"

# Install Tesseract + languages
if ! command -v tesseract >/dev/null 2>&1; then
    echo "Installing tesseract..."
    brew install tesseract
fi

if ! brew list tesseract-lang >/dev/null 2>&1; then
    echo "Installing tesseract-lang..."
    brew install tesseract-lang
fi

# Install Python packages
python3 -m pip install pytesseract Pillow

# Verify
tesseract --version
python3 -c "import pytesseract, PIL.Image; print('OCR stack OK')"
echo "INSTALL_COMPLETE"
