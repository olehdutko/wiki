# wiki

## Короткий опис

Енциклопедія холодної зброї — модульна веб-аплікація. Складається з React-фронтенду на Vite та Express-бекенду на TypeScript з MySQL базою даних.

## Розташування на MacBook

```
~/projects/wiki/
├── package.json              # кореневий скриптовий файл
├── .env                      # змінні середовища
├── client/                   # React + Vite фронтенд
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   ├── README.md
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── services/api.service.ts
│       ├── types/api.types.ts
│       └── config/entities.config.ts
└── server/                   # Express + TypeScript бекенд
    ├── tsconfig.json
    ├── nodemon.json
    └── src/
        ├── index.ts
        ├── config/database.config.ts
        ├── models/entities.models.ts
        ├── controllers/
        │   ├── entities.controllers.ts
        │   ├── links.controller.ts
        │   ├── database.controller.ts
        │   └── base.controller.ts
        ├── services/
        │   ├── entities.services.ts
        │   └── base.service.ts
        └── routes/api.routes.ts
```

## Стек технологій

| Частина | Технології |
|---------|-----------|
| Фронтенд | React 19, Vite, Material UI 7, React Router DOM 7, Axios, Emotion |
| Бекенд | Node.js, Express, TypeScript 5, MySQL2, CORS, Helmet, class-validator, class-transformer |
| DevOps | concurrently, nodemon, eslint, jest |
| База даних | MySQL (є дампи `weaponry_online_db.sql`, `weaponry_full.sql.gz`, `all_databases.sql`) |

## Команди для запуску

### Повний dev-запуск (клієнт + сервер одночасно)

```bash
cd ~/projects/wiki
npm install            # встановлює залежності кореня
npm run install:all    # або так — встановлює і корінь, і client
npm run dev            # concurrently: server:dev + client:dev
```

### Окремо бекенд

```bash
cd ~/projects/wiki
npm run server:dev     # nodemon server/src/index.ts
```

### Окремо фронтенд

```bash
cd ~/projects/wiki/client
npm install            # якщо node_modules відсутні
npm run dev            # vite dev server
```

### Продакшн збірка

```bash
cd ~/projects/wiki
npm run build          # збирає сервер + клієнт
npm start              # node dist/server/index.js
```

## Важливі нотатки

- Проєкт повністю TypeScript: сервер (`server/tsconfig.json`) і клієнт (`client/tsconfig.app.json`, `client/tsconfig.node.json`).
- Для роботи потрібна база MySQL — є дампи в корені проєкту.
- `server/src/config/database.config.ts` — конфіг підключення до БД.
- Фронтенд використовує `api.service.ts` для роботи з бекендом.
- Конфіг сутностей знаходиться в `client/src/config/entities.config.ts`.

## Статус

- Інспектовано: 2026-06-17
- Запускався локально: невідомо, буде перевірено за запитом.

---

*Проєкт розташовано на MacBook `odutko@192.168.1.215` у `~/projects/wiki`*
