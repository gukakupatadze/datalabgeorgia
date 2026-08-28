# DataLab Georgia

DataLab Georgia-ს მონაცემთა აღდგენის ვებგვერდი და შიდა CRM სისტემა.

## პროექტის სტრუქტურა

- `frontend/` — საჯარო საიტი: სერვისები, ფასის კალკულატორი, მოთხოვნის ფორმა და ტიკეტის თვალთვალი;
- `admin-panel/frontend/` — ადმინისტრატორის CRM ინტერფეისი;
- `admin-panel/backend/` — FastAPI API, ავტორიზაცია, ტიკეტები, შეტყობინებები და ანალიტიკა.

## ლოკალურად გაშვება

### Backend

```bash
cd admin-panel/backend
cp .env.example .env
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn server:app --reload --port 8000
```

MongoDB-ის გარეშე დროებითი ლოკალური ტესტირებისთვის `backend/.env`-ში მიუთითეთ
`USE_IN_MEMORY_DB=true`. ამ რეჟიმში backend-ის გაჩერებისას მონაცემები იშლება.

### ადმინისტრატორის CRM

```bash
cd admin-panel/frontend
cp .env.example .env
corepack enable
pnpm install
PORT=3010 pnpm start
```

### საჯარო საიტი

```bash
cd frontend
npm install
PORT=3011 REACT_APP_BACKEND_URL=http://localhost:8000 npm start
```

მისამართები:

- საჯარო საიტი — `http://localhost:3011`;
- ადმინისტრატორის CRM — `http://localhost:3010`;
- API — `http://localhost:8000/api`.

## ტესტები

```bash
cd admin-panel/backend
source .venv/bin/activate
python run_local_tests.py
```

ტესტები ცალკე in-memory API-ზე მუშაობს და რეალურ CRM მონაცემებს არ ცვლის.

## უსაფრთხოება

რეალური `.env` ფაილები, პაროლები, OAuth საიდუმლოებები, dependency-ები და გენერირებული
build ფაილები repository-ში არ იტვირთება. საწყისი პარამეტრებისთვის გამოიყენეთ
`.env.example` ფაილები და production გარემოში აუცილებლად შეცვალეთ ადმინისტრატორის
პაროლი და ჩართეთ HTTPS cookie (`COOKIE_SECURE=true`).
