import Koa from 'koa';
import Router from 'koa-router';

export async function main() {
  const app = new Koa();
  const router = new Router();
  console.log('Starting server on 0.0.0.0:8081');
  app.listen(Number(process.env.APP_PORT) ?? 8081, process.env.APP_HOST ?? '0.0.0.0');
}
