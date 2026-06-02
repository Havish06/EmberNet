# EmberNet

**Distributed secure mesh communication network simulator**

EmberNet is an interactive simulation and monitoring dashboard for a decentralized mesh network. It visualises nodes, connections, traffic, and security features in real time.

---

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **State Management**: Zustand
- **Styling**: Tailwind CSS + Radix UI components
- **Real‑time**: Socket.io (client & server)
- **Security primitives**: TweetNaCl for encryption, Crypto‑JS for hashing, custom key‑exchange and signing logic
- **Data store**: Redis (optional, configurable)

---

## Features
- Dynamic network topology with gateways, relays, and endpoints
- Real‑time packet flow visualisation
- Secure handshakes (ECDH‑like key exchange) and encrypted messaging
- Chaotic testing mode (packet loss, latency spikes, node failures, battery drain)
- Discovery environment that simulates peer scanning
- Management environment for node/connection control
- Metrics dashboard (throughput, latency, packet loss, uptime)
- Extensible routing engine with Dijkstra, secure path selection, and quality scoring

---

## Getting Started

### Prerequisites
- Node.js **≥ 18**
- npm (comes with Node)
- Optional: Redis server if you want persistence for real‑time signalling (the app falls back to in‑memory if not configured)

### Installation
```sh
# Clone the repository (if you haven't already)
git clone https://github.com/Havish06/EmberNet.git
cd EmberNet

# Install dependencies
npm install
```

### Development
```sh
# Start the development server
npm run dev
```
Open **http://localhost:3000** in your browser. The UI will load the simulation dashboard where you can:
- Start/stop the simulation
- Adjust speed, toggle chaos, and configure scan radius
- Inspect nodes, connections, and traffic details
- Send encrypted messages between peers

### Building for Production
```sh
npm run build   # Compile the Next.js app
npm start       # Run the compiled server
```

### Linting & Type Checking
```sh
npm run lint          # Run ESLint
npm run type-check   # Run TypeScript type checking without emitting files
```

---

## Configuration
The project reads optional environment variables via `dotenv`. Create a `.env` file at the project root if you need to override defaults (e.g., Redis URL, custom port).
```dotenv
# Example .env file
REDIS_URL=redis://localhost:6379
PORT=3000
```
If no `.env` is provided, the app defaults to `localhost:3000` and uses an in‑memory store.

---

## Contributing
Contributions are welcome! Please follow these steps:
1. Fork the repository and create your feature branch (`git checkout -b feature/my-feature`).
2. Ensure the code builds and passes lint/type‑check.
3. Run the simulation locally and verify UI behavior.
4. Submit a pull request with a clear description of the change.

---

## Author
**Havish Karthikeya Kanamarlapudi** – [GitHub](https://github.com/havish06) • [LinkedIn](https://linkedin.com/in/Havish%20Karthikeya%20Kanamarlapudi)

---

## Show your support
Give this project a ⭐️ if you find it useful!
