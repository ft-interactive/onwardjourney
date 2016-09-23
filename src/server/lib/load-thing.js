import 'isomorphic-fetch';
import createError from 'http-errors';
import api from 'next-ft-api-client';
import list from '../models/list';

/**
 * Downloads a list of articles from CAPI and returns
 * the UUIDs, plus any metadata.
 */
export default function loadThing(id) {
	return Promise.all([
		api.search({ filter: {
			bool: {
				must: [
					{ term: { 'metadata.idV1': id } },
				],
			},
		} }),

		api.things({ identifierValues: [id] }),

	]).then(([searchResults, tags]) => {
		if (!tags.items || !tags.items.length) {
			throw new createError.NotFound();
		}

		return list({
			id,
			type: tags.items[0].taxonomy,
			items: searchResults,
			title: tags.items[0].name,
			canFollow: true,
			url: 'https://next.ft.com/stream/' + tags.items[0].taxonomy + 'Id/' + id,
		});
	}).catch(err => {
		// workaround api client rejecting with a stackless error
		// - see https://github.com/matthew-andrews/fetchres/issues/9
		if ((!err instanceof Error) || !err.stack) {

			if (err.name === 'BadServerResponseError') {
				throw new createError.NotFound();
			}

			const nonError = new Error(`
				Non-error thrown -
					name: "${err.name}";
					message: "${err.message}"}
			`);
			nonError.originalError = err;
			throw nonError;
		}
		throw err;
	});
}
