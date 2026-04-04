# ProjectSET — Шаблон проекта

Продакшн-шаблон Python-проекта с PostgreSQL, Docker, FastAPI-бэкендом и двумя Next.js-фронтендами.

## Структура проекта

```
ProjectSET/
├── backend/                    # FastAPI-приложение
│   ├── src/app/
│   │   ├── main.py             # Точка входа (FastAPI app factory)
│   │   ├── run.py              # Запуск uvicorn
│   │   ├── settings.py         # Pydantic-settings конфигурация
│   │   ├── database.py         # Async SQLAlchemy engine + сессии
│   │   ├── models/             # SQLAlchemy модели
│   │   ├── routers/            # API роутеры
│   │   ├── db/                 # Миграции
│   │   └── data/init.sql       # Init-скрипт для PostgreSQL
│   ├── tests/                  # Unit + E2E тесты
│   ├── Dockerfile              # 2-этапная сборка (uv → slim)
│   └── pyproject.toml          # Зависимости backend
├── frontend-user/              # Next.js — пользовательская панель
│   ├── src/app/
│   │   ├── layout.tsx          # Корневой лейаут с навигацией
│   │   ├── page.tsx            # Главная страница
│   │   └── globals.css         # Стили
│   ├── next.config.ts          # Next.js конфиг (standalone + rewrites)
│   ├── Dockerfile              # 2-этапная сборка (node)
│   └── package.json
├── frontend-admin/             # Next.js — админ-панель
│   ├── src/app/
│   │   ├── layout.tsx          # Корневой лейаут с админ-навигацией
│   │   ├── page.tsx            # Дашборд админа
│   │   └── globals.css         # Стили
│   ├── next.config.ts          # Next.js конфиг (standalone + rewrites)
│   ├── Dockerfile              # 2-этапная сборка (node)
│   └── package.json
├── caddy/
│   └── Caddyfile               # Reverse proxy (маршрутизация)
├── nanobot/                    # AI-агент (nanobot-ai)
│   ├── config.json             # Конфигурация агента (в .gitignore!)
│   ├── config.template.json    # Шаблон конфигурации
│   ├── entrypoint.py           # Резолв env → config + запуск
│   ├── Dockerfile              # Сборка nanobot
│   └── workspace/              # Рабочее пространство агента
├── qwen-code-api/              # Прокси к LLM (git submodule)
├── docker-compose.yml          # Оркестрация всех сервисов
├── .env.docker.example         # Шаблон переменных окружения
├── pyproject.toml              # Корневой — uv workspace, dev-зависимости
├── .gitignore
└── README.md / REPORT.md       # Документация
```

## Сервисы (docker-compose.yml)

| Сервис | Описание | Порт |
|--------|----------|------|
| **backend** | FastAPI + SQLAlchemy | 42001 |
| **postgres** | PostgreSQL 18 | 42004 |
| **pgadmin** | Веб-админка БД | 42003 |
| **frontend-user** | Next.js (user panel) | — |
| **frontend-admin** | Next.js (admin panel) | — |
| **nanobot** | AI-агент (nanobot-ai + webchat) | 42006 |
| **qwen-code-api** | Прокси к LLM | 42005 |
| **caddy** | Reverse proxy | 42002 |

## Маршрутизация (Caddyfile)

| Путь | Куда |
|------|------|
| `/admin*` | frontend-admin:3001 |
| `/` (остальное) | frontend-user:3000 |
| `/docs*`, `/openapi.json` | backend:8000 |
| `/utils/pgadmin*` | pgadmin:80 |

API-запросы (`/api/*`) проксируются через Next.js rewrites — каждый фронтенд сам роутит их на backend.

## Развёртывание

### Предварительные требования

- **Docker** и **Docker Compose** установлены
- **Python 3.12+** (для локальной разработки)
- **uv** — менеджер зависимостей (`pip install uv`)
- **Qwen Code CLI** авторизован на хост-машине

### Шаг 1 — Авторизация Qwen Code

Nanobot использует `qwen-code-api` как прокси к LLM. Для этого нужна авторизация:

```bash
# Установи Qwen Code CLI (если ещё не установлен)
pip install qwen-code

# Войди в аккаунт — создаст ~/.qwen/oauth_creds.json
qwen login
```

> **Без этого шага** `qwen-code-api` не сможет обращаться к LLM, и nanobot не ответит.

### Шаг 2 — Конфигурация окружения

```bash
# Скопируй шаблон
cp .env.docker.example .env.docker.secret

# Отредактируй .env.docker.secret:
#   LLM_API_KEY=demo-key          # любой ключ для nanobot
#   LMS_API_KEY=change-me         # ключ для MCP-тулзов (если добавишь)
#   QWEN_CODE_API_KEY=            # оставь пустым (используется ~/.qwen)
```

### Шаг 3 — Запуск

```bash
docker compose up --build
```

Первый запуск займёт 2-5 минут (сборка образов, загрузка postgres, node, nanobot-ai).

### Шаг 4 — Проверка

| Сервис | URL |
|--------|-----|
| User panel | http://localhost:42002 |
| Admin panel | http://localhost:42002/admin |
| Swagger docs | http://localhost:42002/docs |
| pgAdmin | http://localhost:42002/utils/pgadmin |
| Nanobot (WebSocket) | ws://localhost:42002/ws/chat |

## Быстрый старт (для опытных)

```bash
qwen login
cp .env.docker.example .env.docker.secret
docker compose up --build
```

Открой http://localhost:42002 — готово.

## Что где

- **`backend/src/app/`** — бизнес-логика. Роутеры в `routers/`, модели в `models/`, БД в `db/`
- **`frontend-user/`** и **`frontend-admin/`** — два независимых Next.js приложения
- **`nanobot/`** — AI-агент: `config.json` (секреты, не коммитить!), `entrypoint.py` (резолв env), `workspace/`
- **`qwen-code-api/`** — прокси к LLM (git submodule), монтирует `~/.qwen` для авторизации
- **`docker-compose.yml`** — 8 сервисов в одной сети `app-network`
- **`caddy/Caddyfile`** — маршрутизация: `/admin*` → admin, `/ws/chat` → nanobot, остальное → user
- **`pyproject.toml` (корневой)** — uv workspace + dev tools (ruff, pyright, pytest, poethepoet)
- **`backend/Dockerfile`** — двухэтапная сборка: uv sync → slim образ с nonroot-юзером
- **`frontend-*/Dockerfile`** — двухэтапная сборка: node builder → node runner (standalone)
- **`.env.docker.secret`** — ВСЕ секреты здесь, НИКОГДА не коммитить

## Команды

```bash
# Запустить всё
docker compose up --build

# Только backend
docker compose up backend postgres

# Запустить backend локально (для разработки)
cd backend && python -m app.run

# Тесты
poe test

# Линтинг + форматирование
poe check
```
