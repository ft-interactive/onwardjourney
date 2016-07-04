/* global fetch */
import 'dotenv/config';
import 'isomorphic-fetch';
import getArticles from './getArticles';
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

const renderArticles = jade.compileFile(path.join(views, 'articles.jade'));

const respond = (ctx, result) => {
	ctx.set('Content-Type', ctx.request.url.endsWith('.json') ? 'application/json' : 'text/html');
	ctx.body = ctx.request.url.endsWith('.json') ? JSON.stringify(result) : renderArticles(result);
}

// define routes
router
	.get('/list/:uuid', async ctx => {

		const result = await getArticles('list', ctx.params.uuid);
		respond(ctx, result);
	})
	.get('/list/:uuid/limit/:limit', async ctx => {

		const result = await getArticles('list', ctx.params.uuid, ctx.params.limit);
		respond(ctx, result);
	})
	.get('/thing/:uuid', async ctx => {

		const result = await getArticles('thing', ctx.params.uuid);
		respond(ctx, result);
	})
	.get('/thing/:uuid/limit/:limit', async ctx => {

		const result = await getArticles('thing', ctx.params.uuid, ctx.params.limit);
		respond(ctx, result);
	})
;

// log in development
if (process.env.ENVIRONMENT === 'development') {
	app.use(koaLogger());
}

// start it up
app
	.use(router.routes())
	.use(router.allowedMethods())
	.use(koaStatic(path.resolve(__dirname, '..', 'client')))
	.listen(PORT, () => {
		console.log(`\nRunning on port ${PORT} - http://localhost:${PORT}/`);
	})
;
