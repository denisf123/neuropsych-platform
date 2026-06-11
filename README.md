## Быстрый старт

```bash
cd neuropsych-platform
npm install
node database/init.js
node database/seed.js
node server.js
```

Открыть: http://localhost:3000


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
