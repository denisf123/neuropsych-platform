# ЦДН Счастливые детки — Нейропсихологическая платформа

## Быстрый старт

```bash
cd neuropsych-platform
npm install
node database/init.js
node database/seed.js
node server.js
```

Открыть: http://localhost:3000

## Структура контента
- **2 блока** → **8 тем** → **8 техник** → **4 метода** = 512 методов
- Бесплатно: 1-я тема каждого блока
- Подписка: все остальные темы

## Тарифы
| Тариф | Цена | Срок |
|-------|------|------|
| Месяц | 199 ₽ | 30 дней |
| 6 месяцев | 999 ₽ | 180 дней (-16%) |
| 1 год | 1599 ₽ | 365 дней (-33%) |

## Добавить видео
Поместите `.mp4` файл в `public/videos/`, затем обновите `video_url` в таблице `methods`.

## Создать администратора
```bash
node -e "
require('dotenv').config();
const {getDb,dbRun} = require('./database/init');
const bcrypt = require('bcryptjs');
const db = getDb();
bcrypt.hash('admin123', 12).then(h =>
  dbRun(db, 'INSERT OR REPLACE INTO users (email,password_hash,name,role) VALUES (?,?,?,?)',
    ['admin@admin.com', h, 'Администратор', 'admin'])
).then(() => { console.log('Admin created'); process.exit(0); });
"
```
