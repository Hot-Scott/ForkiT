{
  "name": "forkit-backend",
  "version": "1.0.0",
  "description": "Secure Google Maps proxy + realtime multiplayer server for the ForkIt app",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "start:mp": "node multiplayer.js",
    "dev": "node --watch server.js",
    "dev:mp": "node --watch multiplayer.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-rate-limit": "^7.4.0",
    "ws": "^8.18.0"
  }
}
