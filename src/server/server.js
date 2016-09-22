/* global fetch */
import 'dotenv/config';
import 'isomorphic-fetch';
import Pug from 'koa-pug';
import Koa from 'koa';
import koaCors from 'koa-cors';
import koaLogger from 'koa-logger';
import koaStatic from 'koa-static';
import koaConditional from 'koa-conditional-get';
import koaEtag from 'koa-etag';
import path from 'path';
import Router from 'koa-router';
import list from './lib/load-list';
import thing from './lib/load-thing';
import resolveId from './lib/resolve-id';


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

app.use(koaConditional());
app.use(koaEtag());

console.log(app);

const router = new Router({
	prefix: '/v1',
});
const rootRouter = new Router();

(new Pug({
	app,
	viewPath: path.resolve(__dirname, 'views'),
	helperPath: path.resolve(__dirname, 'helpers.js'),
}));

async function limit(ctx, next) {
	if (Number.isInteger(Number.parseInt(ctx.query.limit, 10))) {
		ctx.limit = Number.parseInt(ctx.query.limit, 10);
	}

	await next();

	if (ctx.limit && ctx.list && ctx.list.items
																	&& ctx.list.items.length > ctx.limit) {
		ctx.list.items = ctx.list.items.slice(0, ctx.limit);
	}
}

async function render(ctx, next) {
	await next();
	ctx.set('Cache-Control', 'public, maxage=1200');
	if (ctx.params.format === 'html') {
		if (ctx.list.items.length) {
			ctx.render(ctx.params.layout || 'default', ctx.list);
		}
		else {
			ctx.body = '';
		}
	}
	else if (ctx.params.format === 'json') {
		if (ctx.params.layout === 'ids') {
			ctx.body = ctx.list.items.map(item => item.id);
		}
		else if (ctx.params.layout === 'simple') {
			ctx.body = ctx.list.items.map(
				item => ({ id: item.id, title: item.title, image: item.mainImage && item.mainImage.url })
			);
		}
		else {
			ctx.body = ctx.list;
		}
	}
}

router
	.use(render)
	.use(limit)
	.get('/:path(thing|list)/:name/:format/:layout?', async (ctx, next) => {
		const fn = ctx.params.path === 'list' ? list : thing;
		const id = resolveId(ctx.params.path, ctx.params.name);
		ctx.list = await fn(id);
		await next();
	})
;

rootRouter
	.get('/favicon.ico', async ctx => {
		ctx.redirect('https://ig.ft.com/favicon.ico');
	})
	.get('/__gtg', async ctx => {
		ctx.set('Content-Type', 'no-cache');
		ctx.body = 'OK';
	});

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
	.use(router.allowedMethods())
	.use(rootRouter.routes())
	.use(koaStatic(path.resolve(__dirname, '..', 'client')))
	.listen(PORT, () => {
		console.log(`Running on port ${PORT} - http://localhost:${PORT}/`);
	})
;
