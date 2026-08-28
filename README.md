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

## საჯარო AI ასისტენტი

ჩატბოტის ნაგულისხმევი `knowledge` რეჟიმი უფასოა, გარე სერვისს არ უკავშირდება და
მხოლოდ DataLab-ის სერვისებზე, ფასებზე, უსაფრთხო პირველ ნაბიჯებსა და ტიკეტის
თვალთვალზე პასუხობს. ბოტს CRM-ისა და მომხმარებელთა მონაცემების წვდომა არ აქვს.

უფასო ლოკალური გენერაციული AI-სთვის დააყენეთ [Ollama](https://ollama.com/),
ჩამოტვირთეთ მრავალენოვანი მოდელი და backend-ის `.env`-ში ჩართეთ:

```bash
ollama run qwen3:4b
AI_PROVIDER=ollama
OLLAMA_MODEL=qwen3:4b
```

OpenAI API-ზე გადასასვლელად გასაღები შეინახეთ მხოლოდ backend-ის `.env`-ში:

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=your-server-side-key
OPENAI_MODEL=gpt-5.6-luna
```

`AI_CHAT_PER_MINUTE`, `AI_CHAT_PER_DAY`, IP ლიმიტები და
`AI_CHAT_GLOBAL_PER_DAY` ზღუდავს ბოროტად გამოყენებასა და საერთო დღიურ ხარჯს.
production-ში რამდენიმე backend instance-ის შემთხვევაში in-memory ლიმიტერი უნდა
შეიცვალოს საერთო Redis/edge rate limiter-ით. API გასაღები არასდროს ჩაწეროთ
`frontend/`-ში ან `REACT_APP_*` ცვლადში.

## უსაფრთხოება

რეალური `.env` ფაილები, პაროლები, OAuth საიდუმლოებები, dependency-ები და გენერირებული
build ფაილები repository-ში არ იტვირთება. საწყისი პარამეტრებისთვის გამოიყენეთ
`.env.example` ფაილები და production გარემოში აუცილებლად შეცვალეთ ადმინისტრატორის
პაროლი და ჩართეთ HTTPS cookie (`COOKIE_SECURE=true`).

## Production deployment — Docker Compose + GitHub Actions

Production stack is defined by the single root [`compose.yaml`](./compose.yaml):

- Caddy is the only public service and automatically manages HTTPS;
- the public website is served at `/`;
- the CRM is served at `/admin/`;
- FastAPI is available through `/api/` but its container port is not public;
- MongoDB is isolated on an internal Docker network and persists in a named volume.

The public frontend, CRM frontend and backend each have a production multi-stage
Dockerfile. Dependency downloads use BuildKit cache mounts. The GitHub workflow also
uses a separate GitHub Actions cache scope for each image, so unchanged dependency
layers are reused between deployments.

### VPS prerequisites

Install Docker Engine with Docker Compose v2 on a Linux VPS. Allow inbound SSH, TCP
80 and TCP 443 in the VPS firewall. Point the production domain's DNS record to the
VPS before enabling automatic HTTPS. The deployment user must be able to run
`docker` and `docker compose` without an interactive password prompt.

### GitHub production environment

In the repository, create one GitHub Environment named `production`. Add these
environment secrets:

- `VPS_HOST` — VPS IP address or hostname;
- `VPS_USER` — SSH deployment user;
- `VPS_SSH_PRIVATE_KEY` — the private key dedicated to deployment;
- `VPS_KNOWN_HOSTS` — the verified SSH host-key line for this VPS;
- `GHCR_PULL_TOKEN` — GitHub classic PAT with `read:packages` for pulling private images;
- `PRODUCTION_ENV_FILE_B64` — base64-encoded contents of the production environment file.

Add these environment variables:

- `VPS_PORT` — normally `22`;
- `DEPLOY_PATH` — normally `/opt/datalabgeorgia`;
- `GHCR_USERNAME` — the GitHub account that owns `GHCR_PULL_TOKEN`;
- `SITE_URL` — for example `https://datalabgeorgia.ge`.

Copy [`deploy/production.env.example`](./deploy/production.env.example) outside Git,
replace every placeholder and encode the finished file. On macOS:

```bash
base64 -i production.env | pbcopy
```

Paste the copied value into the `PRODUCTION_ENV_FILE_B64` environment secret. Never
commit the decoded production file.

The workflow builds images on every push to `main`, but VPS deployment remains off
until the repository-level Actions variable `DEPLOY_ENABLED=true` is added. You can
also run **Build and deploy production** manually and select its deploy option.

The workflow publishes commit-specific images to GHCR, uploads only deployment
configuration over verified SSH, pulls the exact commit images, waits for container
health checks, and attempts to restore the previous image tag if startup fails.

### Local production-stack check

Create a local `.env` from the production example, set `SITE_ADDRESS=:80`, choose
non-production passwords and then run:

```bash
export IMAGE_REPOSITORY=datalabgeorgia
export IMAGE_TAG=local
docker compose build
docker compose up -d --wait
```

For a host port other than 80, set `HTTP_PORT` in `.env`. Stop the stack with
`docker compose down`; do not add `--volumes` unless the MongoDB data should also be
deleted.
