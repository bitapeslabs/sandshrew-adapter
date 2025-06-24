# Sandshrew Adapter

Crreates a sandshrew-like interface to use with OYL sdks from the following locally hosted primatives:

(these are all required prior to using this adapter)

- Metashrew
- Bitcoin Core (with -txindex)
- Esplora-elecrs (bitapeslabs fork: https://github.com/bitapeslabs/electrs)

# Usage

1. Clone the repository:

```
git clone https://github.com/bitapeslabs/sandshrew-adapter.git
```

2. Install Dependencies:

```
cd sandshrew-adapter
npm install
```

3. Configure the environment variables from .env.example:

```
cp .env.example .env
nano .env
```

4. Start the adapter:

```
npm start
```
