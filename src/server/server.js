/* global fetch */
import 'dotenv/config';
import 'isomorphic-fetch';
import getArticlesFromList from './getArticlesFromList';
import getArticlesFromThing from './getArticlesFromThing';
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

// define routes
router
	// a route to get the bertha data (post-transformations)
	.get('/list/:uuid', async ctx => {
		ctx.set('Content-Type', 'text/html');
		ctx.body = renderArticles(await getArticlesFromList(ctx.params.uuid));
	})
	.get('/list/:uuid/limit/:limit', async ctx => {
		ctx.set('Content-Type', 'text/html');
		ctx.body = renderArticles(await getArticlesFromList(ctx.params.uuid, ctx.params.limit));
	})
	.get('/thing/:uuid', async ctx => {
		ctx.set('Content-Type', 'text/html');
		ctx.body = renderArticles(await getArticlesFromThing(ctx.params.uuid));
	})
	.get('/thing/:uuid/limit/:limit', async ctx => {
		ctx.set('Content-Type', 'text/html');
		ctx.body = renderArticles(await getArticlesFromThing(ctx.params.uuid, ctx.params.limit));
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
