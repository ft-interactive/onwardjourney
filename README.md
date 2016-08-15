# Onward Journey

## Routes

- `/list/:id`
- `/thing/:id`

Both routes have the following query parameters:

- `type={html|json}` Response format. Default is `html`.
- `limit={number}` Integer limiting the number of articles in the list. Defaults to no limit.
- `layout={layoutName}` Specify a template. Optional; a default layout is provided.

## Developing

You need an `.env` file with the variables listed in [app.json](./app.json)

Start a watch server:

```
npm run develop
```
