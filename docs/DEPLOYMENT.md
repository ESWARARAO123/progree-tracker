# PinnacleHub Local Network Deployment

Serve the Daily Work Tracker at **`http://PinnacleHub`** (no port number) instead of
`http://172.16.16.21:5111`.

## How it works

```
User browser
   │  http://PinnacleHub  (port 80)
   ▼
DNS entry: PinnacleHub -> 172.16.16.21   (or client /etc/hosts)
   ▼
productdemo-nginx (port 80, catch-all reverse proxy)
   │  server_name PinnacleHub
   ▼
http://172.16.16.21:5111  (tracker_frontend container)
   │  /api/v1/ proxied internally to backend:8000
   ▼
FastAPI backend
```

The tracker frontend container already routes `/api/v1/` to the backend over its
internal Docker network, so the reverse proxy only needs to forward to `:5111`.

## 1. DNS / name resolution

Either ask IT to create a DNS entry, or add the line below to every client machine:

```
172.16.16.21   PinnacleHub
```

On this server itself (requires sudo):

```bash
echo "172.16.16.21   PinnacleHub" | sudo tee -a /etc/hosts
```

## 2. Reverse proxy config (already applied)

A `server_name PinnacleHub` block was added to the existing port-80 proxy:

- Config file: `~/Desktop/PinnacleAI-App/src/services/loadBalancer/nginx/nginx.conf`
- It forwards all requests to `http://172.16.16.21:5111`
- The default `server_name _` block is untouched, so the PinnacleAI product demo
  keeps working for every other hostname.

### Rebuilding the nginx container after a config reset

The Dockerfile only needs the one config file, so build with a minimal context:

```bash
mkdir -p /tmp/nginx-ctx/src/services/loadBalancer/nginx
cp ~/Desktop/PinnacleAI-App/src/services/loadBalancer/nginx/nginx.conf \
   /tmp/nginx-ctx/src/services/loadBalancer/nginx/nginx.conf

docker build -f ~/Desktop/PinnacleAI-App/Docker/Dockerfile.nginx \
  -t docker-nginx /tmp/nginx-ctx

cd ~/Desktop/PinnacleAI-App/Docker
docker compose up -d --no-deps --force-recreate nginx
```

## 3. Verification

```bash
# Tracker reachable via PinnacleHub
curl -s -H "Host: PinnacleHub" http://localhost/ | grep -o '<title>[^<]*</title>'

# Product demo still reachable on the same port
curl -s -o /dev/null -w "%{http_code}\n" http://localhost/   # 200
```

## Access

| URL | What |
| --- | --- |
| `http://PinnacleHub` | Tracker SPA (no port needed) |
| `http://PinnacleHub/api/v1/...` | Tracker API (proxied) |
| `http://172.16.16.21:5111` | Tracker direct (still works) |
| `http://172.16.16.21` | PinnacleAI product demo (unchanged) |
