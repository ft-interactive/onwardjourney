import 'isomorphic-fetch';
import createError from 'http-errors';
import api from 'next-ft-api-client';
import list from '../models/list';

/**
 * Downloads a list of articles from CAPI and returns the UUIDs, plus any metadata.
 */
export default async function loadList(id) {
	let apiResult;
	try {
		apiResult = await api.lists({ uuid: id, retry: 6 });
	}
	catch (err) {

		if (err.name === 'BadServerResponseError') {
			throw new createError.NotFound();
		}

		// workaround api client rejecting with a stackless error
		// - see https://github.com/matthew-andrews/fetchres/issues/9
		if ((!err instanceof Error) || !err.stack) {
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
		items: await api.content({ uuid: uuids, index: 'v3_api_v2' }),
		title: apiResult.title,
		layoutHint: apiResult.layoutHint,
	});
};
