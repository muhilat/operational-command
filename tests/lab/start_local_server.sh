#!/bin/bash
# Start a local HTTP server for testing the extension with mock HTML files

echo "Starting local HTTP server on http://localhost:8000"
echo "Open http://localhost:8000/mock_pcc_staffing.html in Chrome"
echo "Press Ctrl+C to stop the server"
echo ""

cd "$(dirname "$0")"
python3 -m http.server 8000




