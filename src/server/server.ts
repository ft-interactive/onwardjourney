import "dotenv/config";
import Pug from "koa-pug";
import Koa, { Context, Next } from "koa";
import koaCors from "koa-cors";
import koaLogger from "koa-logger";
import koaConditional from "koa-conditional-get";
import koaEtag from "koa-etag";
import path from "path";
import Router from "koa-router";
import list from "./lib/load-list";
import thing from "./lib/load-thing";
import thingV1 from "./lib/load-thing-v1";
import resolveId from "./lib/resolve-id";
import cache from "./lib/cache";

const PORT = process.env.PORT || 5000;
const prod = process.env.NODE_ENV === "production";

process.on("uncaughtException", (error) => {
  console.log("Global uncaughtException!", error.stack);
  console.dir(error);
  // process.exit(1);
});

process.on("unhandledRejection", (error) => {
  console.log("Global unhandledRejection!", error);
  // process.exit(1);
});

const app = new Koa();

// Global error handler
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = "";
  }
});

app.use(koaConditional());
app.use(koaEtag());

const routerV3 = new Router({
  prefix: "/v3",
});

const router = new Router({
  prefix: "/v2",
});

const routerLegacy = new Router({
  prefix: "/v1",
});

const rootRouter = new Router();

new Pug({
  // eslint-disable-line no-new
  app,
  viewPath: path.resolve(__dirname, "views"),
  helperPath: [path.resolve(__dirname, "helpers.ts")],
});

async function limit(ctx: Context, next: Next) {
  if (Number.isInteger(Number.parseInt(<string>ctx.query.limit, 10))) {
    ctx.limit = Number.parseInt(<string>ctx.query.limit, 10);
  }

  await next();

  if (
    ctx.limit &&
    ctx.state.list &&
    ctx.state.list.items &&
    ctx.state.list.items.length > ctx.limit
  ) {
    ctx.state.list.items = ctx.state.list.items.slice(0, ctx.limit);
  }
}

async function render(ctx: Context, next: Next) {
  await next();
  ctx.set("Cache-Control", "public, max-age=600, s-maxage=60");
  ctx.set("Server", "ig-onwardjourney");
  if (ctx.params.format === "html") {
    if (ctx.state.list && ctx.state.list.items && ctx.state.list.items.length) {
      ctx.render(ctx.params.layout || "default", ctx.state.list);
    } else {
      ctx.body = "";
    }
  } else if (ctx.params.format === "json") {
    if (ctx.params.layout === "ids") {
      ctx.body = ctx.state.list.items.map(
        (item: IElasticSearchItem) => item.id
      );
    } else if (ctx.params.layout === "simple") {
      ctx.body = ctx.state.list.items.map((item: IElasticSearchItem) => ({
        id: item.id,
        title: item.title,
        image: item.mainImage && item.mainImage.url,
      }));
    } else {
      ctx.body = ctx.state.list;
    }
  }
}

async function renderV3(ctx: Context, next: Next) {
  await next();
  ctx.set("Cache-Control", "public, max-age=600, s-maxage=60");
  ctx.set("Server", "ig-onwardjourney");
  if (ctx.params.format === "html") {
    if (ctx.state.list && ctx.state.list.items && ctx.state.list.items.length) {
      await ctx.render(ctx.params.layout || "default-v3", ctx.state.list);
    } else {
      ctx.body = "";
    }
  } else if (ctx.params.format === "json") {
    if (ctx.params.layout === "ids") {
      ctx.body = ctx.state.list.items.map(
        (item: IElasticSearchItem) => item.id
      );
    } else if (ctx.params.layout === "simple") {
      ctx.body = ctx.state.list.items.map((item: IElasticSearchItem) => ({
        id: item.id,
        title: item.title,
        image: item.mainImage && item.mainImage.url,
      }));
    } else {
      ctx.body = ctx.state.list;
    }
  }
}

routerV3
  .use(renderV3)
  .use(limit)
  .get("/:path(thing|list)/:name/:format/:layout?", async (ctx, next) => {
    const fn = ctx.params.path === "list" ? list : thing;
    const id = resolveId(ctx.params.path, ctx.params.name);
    if (id) {
      ctx.state.list = await cache(`res:${id}`, () => fn(id));
    }
    await next();
  });

router
  .use(render)
  .use(limit)
  .get("/:path(thing|list)/:name/:format/:layout?", async (ctx, next) => {
    const fn = ctx.params.path === "list" ? list : thing;
    const id = resolveId(ctx.params.path, ctx.params.name);
    if (id) {
      ctx.state.list = await cache(`res:${id}`, () => fn(id));
    }
    await next();
  });

routerLegacy
  .use(render)
  .use(limit)
  .get("/:path(thing|list)/:name/:format/:layout?", async (ctx, next) => {
    const fn = ctx.params.path === "list" ? list : thingV1;
    const id = resolveId(ctx.params.path, ctx.params.name);
    if (id) {
      ctx.state.list = await cache(`res:${id}`, () => fn(id));
    }
    await next();
  });

rootRouter
  .get("/favicon.ico", async (ctx) => {
    ctx.redirect("https://ig.ft.com/favicon.ico");
  })
  .get("/__gtg", async (ctx) => {
    ctx.set("Content-Type", "no-cache");
    ctx.body = "OK";
  });

// dev logging
if (!prod) {
  app.use(koaLogger());
}

const domainWhitelist = {
  "ft-ig-content-prod.s3-website-eu-west-1.amazonaws.com": true,
  "ft-ig-content-dev.s3-website-eu-west-1.amazonaws.com": true,
};

// start it up
app
  .use(
    koaCors({
      methods: ["GET"],
      origin: !prod
        ? true
        : (req) => {
            const { origin } = req.headers;

            if (!origin) return "ig.ft.com";

            if (
              Object.prototype.hasOwnProperty.call(domainWhitelist, origin) ||
              /\.ft\.com(:\d+)?$/.test(origin) ||
              /localhost(:\d+)?$/.test(origin)
            ) {
              return origin;
            }

            return "ig.ft.com";
          },
    })
  )
  .use(async (ctx, next) => {
    const acao = ctx.response.get("Access-Control-Allow-Origin");
    if (acao && acao !== "*") {
      ctx.response.set(
        "Vary",
        [ctx.response.get("Vary"), "Origin"].filter(Boolean).join(", ")
      );
    }
    await next();
  })
  .use(routerV3.routes())
  .use(routerV3.allowedMethods())
  .use(router.routes())
  .use(router.allowedMethods())
  .use(routerLegacy.routes())
  .use(routerLegacy.allowedMethods())
  .use(rootRouter.routes())
  .listen(PORT, () => {
    console.log(`Running on port ${PORT} - http://localhost:${PORT}/`);
  });

interface IElasticSearchItem {
  id: string;
  title: string;
  mainImage: {
    url: string;
  };
}
