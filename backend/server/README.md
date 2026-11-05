# SIPOCs backend (`backend/server`)

Java/Spring Boot REST API for the SIPOCs application â€” persistence, the domain model (SIPOC
instances and their suppliers/inputs/process steps/outputs/customers, plus the master data behind
them), and everything the frontend and the [`sipoc-mcp-server`](../../sipoc-mcp-server) talk to
over HTTP. See the root [`README.md`](../../README.md) for the project as a whole and
[`SCHEMA.md`](../../SCHEMA.md) for the full domain model and REST API reference.

## Requirements

- Java 25 (`brew install openjdk@25` on macOS if you don't have it)
- No local Maven install needed â€” use the bundled wrapper (`./mvnw`)

## Running it

```sh
./mvnw spring-boot:run
```

Starts on [http://localhost:8080](http://localhost:8080) with the default database (H2, in-memory,
see below). Useful endpoints once it's up:

- Swagger UI / "try it out" console: [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)
  (OpenAPI JSON at `/v3/api-docs`)
- H2 console (default database only): [http://localhost:8080/h2-console](http://localhost:8080/h2-console)
  (JDBC URL `jdbc:h2:mem:lipokdb`, user `sa`, empty password)

### Choosing a database

Selected via a Spring profile (`spring.profiles.active`, default `h2`); see
`src/main/resources/application-{h2,mysql,postgresql}.properties`:

| Profile | Database | Notes |
| --- | --- | --- |
| `h2` (default) | In-memory H2 | Zero config, data does not survive a restart |
| `mysql` | MySQL | Persistent; configure via `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USERNAME`/`DB_PASSWORD` |
| `postgresql` | PostgreSQL | Same env vars as above |

```sh
SPRING_PROFILES_ACTIVE=postgresql DB_HOST=localhost DB_PASSWORD=... ./mvnw spring-boot:run
```

All three JDBC drivers are always on the classpath â€” only the active profile's datasource URL
decides which one is actually used. Schema is always derived from the JPA entities
(`spring.jpa.hibernate.ddl-auto=update`) â€” there are no migration files on any profile.

### Running from the repo root

`../../sipoc.sh start` starts the backend *and* frontend together (plus mock-data seeding) in one
command â€” see the root README. There's no script for starting just the backend on its own; use
`./mvnw spring-boot:run` directly for that.

## Docker

Build and run the backend as a standalone container (no compose, no frontend):

```sh
docker build -t sipoc-backend .
docker run -p 8080:8080 sipoc-backend                     # H2, same as running natively
docker run -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=postgresql \
  -e DB_HOST=host.docker.internal -e DB_PASSWORD=... \
  sipoc-backend                                           # against an external PostgreSQL
```

For the backend *and* frontend together, with an optional MySQL/PostgreSQL container included, use
`docker compose` from the repo root instead â€” see the root [`README.md`](../../README.md#quick-start-docker).

## Special commands

```sh
./mvnw test                          # run all tests
./mvnw test -Dtest=ClassName#method   # run a single test
./mvnw compile                        # compile only
./mvnw javadoc:javadoc                # generate Javadoc -> target/reports/apidocs/index.html
```

**Loading mock/test data** â€” CSV-based seed data lives in [`../../tests/`](../../tests); with the
backend running:

```sh
cd ../../tests
npm install
npm run seed   # SIPOC_BASE_URL overrides the default http://localhost:8080
```

See [`tests/README.md`](../../tests/README.md) for what each CSV represents.

## Code layout

Package root `de.itsfullofstars.sipoc.server`, layered as `model/` (JPA entities) â†’ `repository/`
(Spring Data JPA) â†’ `service/` (business logic, including the cross-entity constraints
`SCHEMA.md` describes) â†’ `mapper/` (entity â‡„ DTO conversion) â†’ `controller/` (REST endpoints), one
file/class per aggregate or entity in each layer. See [`SCHEMA.md`](../../SCHEMA.md) before making
model/API changes, and `CLAUDE.md` at the repo root for the full contributor workflow.

