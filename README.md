# Claude Code Server

Docker-образ с Claude Code CLI.

## Environment Variables
- `ANTHROPIC_API_KEY` - Anthropic API key
- `API_SECRET` - Secret for API authorization
- `PORT` - Server port (default: 3001)

## API Endpoints
- `GET /health` - Health check
- `POST /execute` - Execute Claude Code command (requires Authorization header)
