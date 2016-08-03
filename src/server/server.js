/* global fetch */
import 'dotenv/config';
import 'isomorphic-fetch';
import Pug from 'koa-pug';
import Koa from 'koa';
import koaCors from 'koa-cors';
import koaLogger from 'koa-logger';
import koaStatic from 'koa-static';
import path from 'path';
import Router from 'koa-router';
import list from './lib/load-list';
import thing from './lib/load-thing';

const PORT = process.env.PORT || 5000;
const prod = process.env.NODE_ENV === 'production';

process.on('uncaughtException', error => {
	console.log('Global uncaughtException!', error.stack);
	console.dir(error);
	process.exit(1);
});

process.on('unhandledRejection', error => {
	console.log('Global uncaughtException!', error.stack);
	console.dir(error);
	process.exit(1);
});

const app = new Koa();
const router = new Router({
	prefix: '/v1',
});

(new Pug({
	app,
	viewPath: path.resolve(__dirname, 'views'),
	helperPath: path.resolve(__dirname, 'helpers.js'),
}));

// define routes
router
	.get('/list/:uuid', async (ctx, next) => {
		ctx.list = await list(ctx.params.uuid);
		await next();
	})
	.get('/thing/:uuid', async (ctx, next) => {
		ctx.list = await thing(ctx.params.uuid);
		await next();
	})
	.get('/favicon.ico', async ctx => { return; })
	// default to 'news' topic
	.get('/', async (ctx, next) => {
		ctx.list = await thing('Nw==-R2VucmVz');
		await next();
	})
;

// dev logging
if (!prod) {
	app.use(koaLogger());
}

// start it up
app
	.use(koaCors({
		methods: ['GET'],
	}))
	.use(router.routes())
	.use(async (ctx, next) => {
		// limit items
		if (ctx.query.limit && /^[0-9]+$/.test(ctx.query.limit)) {
			ctx.list.items = ctx.list.items.slice(0, ctx.query.limit);
		}

		await next();
	})
	.use(async (ctx, next) => {
		ctx.query.type = ctx.query.type || 'html';
		ctx.set('Cache-Control', 'public, maxage=1200');

		if (ctx.query.type === 'html') {
			if (ctx.list.items.length) {
				ctx.render(ctx.query.layout || 'default', ctx.list);
			}
			else {
				ctx.body = '';
			}
		}
		else if (ctx.query.type === 'json') {
			ctx.body = ctx.list;
		}

		await next();
	})
	.use(router.allowedMethods())
	.use(koaStatic(path.resolve(__dirname, '..', 'client')))
	.listen(PORT, () => {
		console.log(`
		Running on port ${PORT} - http://localhost:${PORT}/`);
	})
;
