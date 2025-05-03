# Ping Monitor

A desktop application built with Electron and Node.js for continuous ping testing of remote servers.

## Features

- Continuous ping testing with configurable duration
- Real-time metrics display (min/max/average ping times)
- Automatic log file generation
- Export functionality for test results
- API integration for result submission
- Modern and intuitive user interface

## Installation

1. Clone this repository
2. Install dependencies:
```bash
npm install
```

## Usage

1. Start the application:
```bash
npm start
```

2. Fill in the required fields:
   - Target (URL/IP address to ping)
   - Company/Client Name
   - Test Duration (optional, leave empty for continuous testing)

3. Click "Start Test" to begin monitoring
4. Use "Stop Test" to end the current test
5. Click "Export Results" to save the test results

## Configuration

The application can be configured by modifying the `config.json` file:

```json
{
  "apiEndpoint": "http://localhost:3000/api/ping-results",
  "defaultPingInterval": 1,
  "maxLogFiles": 5,
  "logDirectory": "logs"
}
```

- `apiEndpoint`: URL for submitting test results
- `defaultPingInterval`: Time between pings in seconds
- `maxLogFiles`: Maximum number of log files to keep
- `logDirectory`: Directory for storing log files

## Log File Format

Log files are created in the format: `[TIMESTAMP]_[COMPANY]_ping.txt`

Each line contains:
```
[TIMESTAMP] Time: XXms
```

## Development

To run the application in development mode:
```bash
npm run dev
```

## License

ISC 