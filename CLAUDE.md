# HIoS Backend

Home IoT System (HIoS) backend - Express REST API with MQTT integration and MySQL storage.

## Build & Run

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript to dist/
npm start            # Run compiled JS (production)
npm run dev          # Run with ts-node (development)
npm run watch        # Run with nodemon + ts-node (auto-reload)
```

## Docker

```bash
docker build -t hios-backend .
docker run -p 8080:8080 hios-backend
```

Uses `node:22-alpine`. Builds TypeScript at image build time, runs compiled JS.

## Project Structure

```
src/
  main.ts                  # Entry point - loads config, inits DB, MQTT, API
  config.ts                # Config loading from local_config.json + env vars
  db.ts                    # MySQL connection wrapper (mysql2)
  api/
    index.ts               # Express app setup
    middleware/
      configMiddleware.ts   # Injects config into req.config
    routes/
      index.ts             # Route mounting
      smokes.ts            # Smoker/BBQ temperature monitoring endpoints
      environment.ts       # Environment sensor endpoints (temp/humidity/pressure)
      undercabinet.ts       # Under-cabinet LED controller (MQTT JSON protocol)
      weather.ts           # Weather Underground data endpoints
      device/
        smokes.ts           # Device check helper (unused router)
  model/                   # Database query modules
    device.ts              # Device CRUD
    smokes.ts              # Smoker events, sessions, probes
    environment.ts         # Environment sensor events
    weather.ts             # Weather data (locations, forecast, hourly, astronomy)
  mqtt/
    client.ts              # MQTT client - subscribes to device topics
    device/
      device.ts            # Device check/register helper
      smokes.ts            # Handles smoker MQTT events
      environment.ts       # Handles environment sensor MQTT events
  store/
    schema.ts              # DB migration system (version-based upgrades)
  tasks/
    task.ts                # Simple interval task scheduler
    weatherUnderground.ts  # Periodic weather API polling
```

## Configuration

Config loaded from `local_config.json` at project root, overridden by environment variables:

| Env Var | Config Path | Description |
|---------|-------------|-------------|
| `STORE_HOST` | `store.params.host` | MySQL host |
| `STORE_USER` | `store.params.user` | MySQL user |
| `STORE_DB` | `store.params.databas` | MySQL database name |
| `STORE_PASS` | `store.params.password` | MySQL password |
| `MQTT_HOST` | `mqtt.host` | MQTT broker host |
| `MQTT_PORT` | `mqtt.port` | MQTT broker port |
| `WU_KEY` | `weatherUnderground.apiKey` | Weather Underground API key |
| `PORT` | - | HTTP listen port (overrides config) |

## Key Dependencies

- **express** - HTTP server
- **mysql2** - MySQL driver (replaced legacy `mysql` package)
- **mqtt** v5 - MQTT client for IoT device communication
- **ramda** - Functional utilities used in DB/model layer
- **base64-js** - Binary encoding for smoker stoker MQTT protocol
- **uuid** - UUID generation (replaced legacy `node-uuid`)

## Device Protocols

### Under-Cabinet LED Controller (ESP32)
- Topics: `/home/kitchen/cabinet/lights/{request,response,update}`
- Protocol: **JSON** (device firmware uses cJSON)
- Settings: brightness (0-15), transition, animation (0-7), color (0xRRGGBB), pallete (16 colors)

### Smoker Stoker
- Topics: `/home/outside/smoker/stoker/{state,config/update}`
- Protocol: **base64-encoded binary** for config updates, JSON for state
- Tracks up to 4 temperature probes

### Environment Sensors
- Topic: `/device/+/environment`
- Protocol: JSON (`{temp, humid, pres, motion}`)

## Database

MySQL with version-based migration in `store/schema.ts`. Current version: 6. Tables:
- `device` - registered IoT devices
- `smokes`, `smokes_session`, `smokes_events` - smoker data
- `env_events` - environment sensor readings
- `weather_location`, `weather_now`, `weather_forecast`, `weather_hourly`, `weather_astronomy` - weather cache
- `upgrade_history` - migration tracking
