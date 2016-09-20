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

## Licence
This software is published by the Financial Times under the [MIT licence](http://opensource.org/licenses/MIT).

Please note the MIT licence includes only the software, and does not cover any FT content made available using the software, which is copyright &copy; The Financial Times Limited, all rights reserved. For more information about re-publishing FT content, please contact our [syndication department](http://syndication.ft.com/).
