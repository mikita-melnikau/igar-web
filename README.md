# Igar-web

Для разработки нужен docker.

Запускать разработку:

```bash
rm -rf .next
docker compose down -v
docker compose build --no-cache
docker compose up
```