/* global fetch */
import 'dotenv/config';
import 'isomorphic-fetch';
import getItems from './getItems';
import jade from 'jade';
import Koa from 'koa';
import koaLogger from 'koa-logger';
import koaStatic from 'koa-static';
import path from 'path';
import Router from 'koa-router';

const PORT = process.env.PORT || 5000;

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
const router = new Router();

// precompile template functions
const views = path.resolve(__dirname, 'views');

const renderDefaultLayout = jade.compileFile(path.join(views, 'articles-default.jade'));

// define routes
router
	.get('/list/:uuid', async (ctx, next) => {
		ctx.list = await getItems('list', ctx.params.uuid);
		await next();
	})
	.get('/thing/:uuid', async (ctx, next) => {
		ctx.list = await getItems('thing', ctx.params.uuid);
		await next();
	})
	.get('/search/:term', async (ctx, next) => {
		ctx.list = await getItems('search', ctx.params.uuid);
		await next();
	})
	.get('/favicon.ico', async ctx => { return; })
	//default to 'news' topic
	.get('/', async (ctx, next) => {
		ctx.list = await getItems('thing', 'Nw==-R2VucmVz');
		await next();
	})
;

// log in development
if (process.env.ENVIRONMENT === 'development') {
	app.use(koaLogger());
}

// start it up
app
	.use(router.routes())
	.use(async (ctx, next) => {
		// limit items
		if (ctx.query.limit && /^[0-9]+$/.test(ctx.query.limit)) {
			ctx.list.items = ctx.list.items.slice(0, ctx.query.limit);
		}

		await next();
	})
	.use(async (ctx, next) => {
		//set content type
		ctx.query.type = ctx.query.type || 'html';

		if (ctx.query.type === 'html') {
			ctx.set('Content-Type', 'text/html');
		} else if (ctx.query.type === 'json') {
			ctx.set('Content-Type', 'application/json');
			ctx.output = JSON.stringify(ctx.list);
		}

		await next();
	})
	.use(async (ctx, next) => {
		// set html layout
		if (ctx.query.type === 'html') {

			ctx.query.layout = ctx.query.layout || 'default';

			if (ctx.query.layout === 'default') {
				ctx.output = renderDefaultLayout(ctx.list);
			}
		}

		await next();
	})
	.use(async ctx => { ctx.body = ctx.output; })
	.use(router.allowedMethods())
	.use(koaStatic(path.resolve(__dirname, '..', 'client')))
	.listen(PORT, () => {
		console.log(`\nRunning on port ${PORT} - http://localhost:${PORT}/`);
	})
;
