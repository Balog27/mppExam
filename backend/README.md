# Candidate Backend Server

This is a simple Node.js backend for managing political candidates with real-time updates via WebSockets. All data is stored in memory (no database).

## How to Run

```
cd backend
node server.js
```

- REST API: http://localhost:4000
- WebSocket: ws://localhost:4001

## REST Endpoints

- `GET /candidates` — List all candidates
- `POST /candidates` — Add a candidate (JSON: name, imageUrl, party, description)
- `PUT /candidates/:id` — Update a candidate
- `DELETE /candidates/:id` — Delete a candidate
- `POST /generate/start` — Start generating random candidates
- `POST /generate/stop` — Stop generating

## WebSocket

- Connect to ws://localhost:4001
- Receives `{ type: 'update', candidates: [...] }` on any change 