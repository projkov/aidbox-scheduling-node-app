install:
	yarn install;

prepare:
	cp -n .env.tmpl .env;

up:
	docker compose -f docker-compose.yml up -d scheduling-app;
	docker compose -f docker-compose.yml up --exit-code-from dockerize-scheduling-app dockerize-scheduling-app || exit 1;

app-logs:
	docker compose logs -f scheduling-app

down:
	docker compose down;

build:
	npm run build;

test:
	npm run test;

generate-aidbox-ts:
	docker-compose -f docker-compose.yml -f docker-compose.aidbox-ts.yml run --rm aidbox-ts-generator;
	yarn run prettier --write shared/src/contrib/aidbox/index.ts;
