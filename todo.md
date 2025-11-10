# Anime Episode Checker - TODO

## Features

- [x] Backend API to fetch list of items from https://data.streamindia.co.in/api/list-json
- [x] Backend API to fetch episode details for a specific item
- [x] Backend API to validate episode URLs (check for 404 and other errors)
- [x] Backend API to check video player URLs for validity
- [x] Frontend UI with RUN button to start checking
- [x] Frontend input field to specify starting item number
- [x] Frontend display of results and errors for each episode
- [x] Frontend download results functionality (only when no errors)
- [x] Frontend "Run Next" button to check next item
- [x] Exclude download results when starting from a specific item number
- [x] Error handling and display for failed episode/video URL checks
- [x] Real-time checking without database persistence

## Implementation Status

- [x] Project initialized with Node.js/React/tRPC
- [x] Backend procedures for fetching and validating URLs
- [x] Frontend components for UI
- [ ] Integration testing
- [ ] Packaging and deployment preparation
