# TECSERVICE CRM

შიდა CRM ტექნიკური სერვისისთვის: React ინტერფეისი, FastAPI API და MongoDB.

## სწრაფი გაშვება Docker-ით

საჭიროა მხოლოდ [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
docker compose up --build
```

შემდეგ გახსენი [http://localhost:3000](http://localhost:3000). API იქნება
`http://localhost:8000/api`-ზე. გასაჩერებლად დააჭირე `Ctrl+C`.
`docker compose down -v` შლის ლოკალურ MongoDB მონაცემებსაც.

პაროლით შესვლა მუშაობს `INITIAL_ADMIN_EMAIL` და `INITIAL_ADMIN_PASSWORD`
პარამეტრებით. Google ავტორიზაცია არასავალდებულოა და მისი ჩართვა მოგვიანებითაც
შესაძლებელია.

## გაშვება Docker-ის გარეშე

საჭიროა Node.js 20+, Python 3.11+ და MongoDB replica set. Docker-ის ვარიანტი
replica set-ს ავტომატურად აწყობს; ხელით დაყენებული MongoDB-ც replica-set რეჟიმში
უნდა მუშაობდეს, რადგან ტიკეტისა და აქტივობის ერთდროული შენახვა transaction-ს იყენებს.

### Backend

```powershell
Copy-Item backend/.env.example backend/.env
Set-Location backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
uvicorn server:app --reload --port 8000
```

თუ MongoDB ჯერ არ გაქვს, `backend/.env`-ში დროებით ჩაწერე
`USE_IN_MEMORY_DB=true`. ამ რეჟიმში პროგრამა სრულად გაეშვება, მაგრამ მონაცემები
backend-ის გაჩერებისას წაიშლება.

### უსაფრთხო backend ტესტები

```powershell
Set-Location backend
.\.venv\Scripts\Activate.ps1
python run_local_tests.py
```

ეს ბრძანება ავტომატურად ქმნის ცალკე in-memory სატესტო API-ს, უშვებს ტესტებს და
შემდეგ აჩერებს მას. ტესტებს გარე მისამართთან დაკავშირება კოდით აკრძალული აქვთ.

### Frontend

ახალ PowerShell ფანჯარაში:

```powershell
Copy-Item frontend/.env.example frontend/.env
Set-Location frontend
corepack enable
pnpm install
pnpm start
```

## გარემოს ცვლადები

- `MONGO_URL` — MongoDB კავშირის მისამართი;
- `DB_NAME` — ბაზის სახელი;
- `CORS_ORIGINS` — ნებადართული frontend მისამართები;
- `REACT_APP_BACKEND_URL` — API-ის მისამართი.
- `GOOGLE_CLIENT_ID` და `GOOGLE_CLIENT_SECRET` — Google OAuth Web Client;
- `GOOGLE_REDIRECT_URI` — Google-ში ზუსტად იგივე callback მისამართი;
- `INITIAL_ADMIN_EMAIL` — პირველი ადმინისტრატორის ჩვეულებრივი Gmail;
- `INITIAL_ADMIN_NAME` — პირველი ადმინისტრატორის საჩვენებელი სახელი;
- `INITIAL_ADMIN_PASSWORD` — პირველი ადმინისტრატორის ძლიერი საწყისი პაროლი;
- `FRONTEND_URL` და `BACKEND_URL` — CRM-ის რეალური მისამართები;
- `SESSION_HOURS` — დაცული სესიის ხანგრძლივობა (ნაგულისხმევად 12 საათი);
- `COOKIE_SECURE` — production HTTPS გარემოში აუცილებლად `true`.

`.env` ფაილები GitHub-ში არ ატვირთო: იქ შეიძლება რეალური პაროლები მოხვდეს.

## Google-ით შესვლის მომზადება

1. [Google Cloud Console](https://console.cloud.google.com/)-ში შექმენი პროექტი.
2. OAuth consent screen-ის Audience აირჩიე `External`, რადგან თანამშრომლები
   ჩვეულებრივ `gmail.com` ანგარიშებს გამოიყენებენ.
3. შექმენი `OAuth client ID` ტიპით `Web application`.
4. ლოკალური გაშვებისთვის Authorized redirect URI-ში ჩაწერე
   `http://localhost:8000/api/auth/google/callback`.
5. მიღებული Client ID და Client Secret ჩაწერე მხოლოდ `backend/.env`-ში.
6. `INITIAL_ADMIN_EMAIL`-ში ჩაწერე პირველი ადმინისტრატორის Gmail.

ონლაინ ვერსიაში საჭიროა საკუთარი HTTPS მისამართი. მაგალითად callback შეიძლება
იყოს `https://api.crm.example.ge/api/auth/google/callback`; ეს მისამართი Google
Cloud-ში და `GOOGLE_REDIRECT_URI`-ში ზუსტად ერთნაირი უნდა იყოს.

## ძიება და გვერდებად ჩატვირთვა

`GET /api/tickets` იღებს `q`, `offset` და `limit` პარამეტრებს. `q` არის
ჩვეულებრივი ტექსტური ძიება; სიმბოლოები, როგორიცაა `.*`, სიტყვასიტყვით
მოიძებნება. `offset` ნაგულისხმევად `0`-ია, `limit` — `100`, მაქსიმუმ `200`.

მაგალითი: `GET /api/tickets?q=iphone&offset=100&limit=50`.

## უსაფრთხოება

CRM იყენებს პაროლის უსაფრთხო ჰეშირებას, დაცულ session cookie-ს და სურვილის
შემთხვევაში Google OpenID Connect-ს. Google-ის პაროლი და refresh token არ
ინახება. ყველა შიდა ბიზნეს API ავტორიზაციას მოითხოვს.

როლებია მხოლოდ ადმინისტრატორი და მომხმარებელი. ადმინისტრატორი მართავს CRM-სა
და ყველა ტიკეტს, ხოლო მომხმარებელს მხოლოდ საკუთარ ტიკეტებზე აქვს წვდომა.
`AUTH_DISABLED=true` დაშვებულია მხოლოდ იზოლირებული ლოკალური ტესტებისთვის და
production-ში არასოდეს უნდა ჩაირთოს.
