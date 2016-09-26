import lruCache from 'lru-cache';
import debugLogger from 'debug';

const debug = debugLogger('cache');
const pending = new Map();
const noop = () => {};
const maxAge = 60 * 1000 * 5; // 5 mins

const lru = lruCache({
  maxAge,
  max: 200000, // 200K (ish)
  stale: true,
  length: (value, key) =>
    JSON.stringify(value).length + JSON.stringify(key).length,
});

export default function cache(keyFn = noop, refresh = noop, max = maxAge) {
  const key = typeof keyFn === 'string' ? keyFn : keyFn();

  // key can be falsey to bypass caching. e.g.
  // const keyFn = () => {
  //    return !bypassCache && 'my-key';
  // }
  if (!key) return refresh();

  if (pending.has(key)) {
   debug('already pending %s', key);
   return pending.get(key);
  }

  // grab the current value in case the key is
  // just about to be deleted so we can serve
  // stale in the event of a refresh error
  let stale = lru.peek(key);

  const isCached = lru.has(key);
  const hasStaleValue = !!stale;

  function doRefresh() {
    debug('refreshing %s', key);
    return refresh()
      .then(result => {
        debug('caching value %s', key);
        lru.set(key, result, max);
        pending.delete(key);
        return result;
      })
      .catch(err => {
        pending.delete(key);

        if (!hasStaleValue) {
          throw err;
        }

        // swallow the error and serve stale
        debug('restore previous value %s', key)
        lru.set(key, stale, max);
        return stale;
      });
  }

  if (isCached) {
    debug('cache hit %s', key);
    return Promise.resolve(lru.get(key));
  } else if (hasStaleValue) {
    debug('start BG refresh and return stale value %s', key);
    const p = Promise.resolve(stale);
    pending.set(key, p);
    process.nextTick(() => {
      doRefresh().catch(err => {
        console.error('Failed background refresh', err.message);
      });
    });
    return p;
  }

  const pendingPromise = doRefresh();
  pending.set(key, pendingPromise);
  return pendingPromise;

}
