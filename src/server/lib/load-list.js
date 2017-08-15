import fetch from 'node-fetch';
import createError from 'http-errors';
import api from '@financial-times/n-es-client';
import list from '../models/list';

function getList(opts) {
	const uuid = opts.uuid;
	return fetch(`https://api.ft.com/lists/${uuid}?apiKey=${process.env.API_KEY}`) // Is there a better way of doing this?
		.then(res => res.json())
		.catch(() => {
			throw new createError(404, ''); // Empty response to prevent "Not Found" text
		});
}

function getItems(opts) {
	const uuid = [].concat(opts.uuid);
	const returnMany = Array.isArray(opts.uuid);

	if (uuid.length === 0) {
		return Promise.resolve([]);
	}

	return api
		.mget({
			ids: uuid,
		})
		.then((docs) => {
			if (returnMany) {
				return docs;
			}
			if (docs.length === 0) {
				throw new createError(404, ''); // Empty response to prevent "Not Found" text
			}

			return docs[0];
		})
		.catch(() => {
			throw new createError(404, ''); // Empty response to prevent "Not Found" text
		});
}

/**
 * Downloads a list of articles from CAPI and returns the UUIDs, plus any metadata.
 */
export default async function loadList(id) {
	let apiResult;
	try {
		apiResult = await getList({ uuid: id, retry: 6 });
	}
	catch (err) {
		if (err.name === 'BadServerResponseError') {
			throw new createError(404, ''); // Empty response to prevent "Not Found" text
		}

		// workaround api client rejecting with a stackless error
		// - see https://github.com/matthew-andrews/fetchres/issues/9
		if (!(err instanceof Error) || !err.stack) {
			const nonErr = new Error(`
				Non-error thrown
					name: "${err.name}";
					message: "${err.message}"}
			`);
			nonErr.originalError = err;
			throw nonErr;
		}

		throw err;
	}

	const uuids = apiResult.items.map(item => item.id.split('/').pop());

	return list({
		id,
		type: 'list',
		items: await getItems({ uuid: uuids, index: 'v3_api_v2' }),
		title: apiResult.title,
		layoutHint: apiResult.layoutHint,
	});
}
