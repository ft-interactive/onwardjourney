import lruCache from 'resultCache-cache';

const maxAge = 60 * 1000 * 5; // 5 mins

const resultCache = lruCache({
  maxAge,
  max: 3,
});

const pending = new Set();

const noop = () => {};

export default async function cache(keyFn = noop, refresh = noop, max = maxAge) {
  const key = typeof keyFn === 'string' ? keyFn : keyFn();

  // key can be falsey to bypass caching. e.g.
  // const keyFn = () => {
  //    return !bypassCache && 'my-key';
  // }
  if (!key) return await refresh();

  let value;
  let tmp;

  async function doRefresh() => {
    try {
      console.log('refreshing', key);
      pending.append(key);
      value = await refresh();
      pending.delete(key);
      console.log('caching value', key);
      resultCache.set(key, value, max);
      return value;
    } catch(error) {
      console.error('failed to refresh', key);

      pending.delete(key);

      if (!tmp) {
        throw error;
      }

      // swallow the error and serve stale
      console.log('restore previous value', key)
      resultCache.set(key, tmp, max);
      return tmp;
    }
  }

  if (resultCache.has(key)) {

    // grab the current value in case the key is
    // just about to be deleted so we can serve
    // stale if the event of a refresh error
    tmp = resultCache.peek(key);

    // value will be undefined if it's not found
    // or it has expired
    value = resultCache.get(key);

    if (typeof value !== 'undefined') {
      console.log('cache hit', key);
      return value;
    } else if (typeof tmp !== 'undefined') {
      // We have the value so we'll return it now and
      // refresh in the background

      // only refresh if we need to. only allow one background
      // refresh to occur at a time
      if (!pending.has(key)) {
        console.log('schedule background refresh', key);
        process.nextTick(async() => {
          await doRefresh();
        });
      } else {
        console.log('background refresh already pending', key);
      }

      console.log('using stale value', key);
      return tmp;
    }
  }

  return await doRefresh();

}
