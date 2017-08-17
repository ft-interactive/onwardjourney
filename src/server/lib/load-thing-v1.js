import fetch from 'node-fetch';
import createError from 'http-errors';
import api from '@financial-times/n-es-client';
import list from '../models/list';
import { getThings } from './load-thing';

const { CONCORDANCE_API_KEY } = process.env;

/**
 * Downloads a list of articles from CAPI and returns
 * the UUIDs, plus any metadata.
 */
export default async function loadThingV1(id) {
	try {
		let idV2;
		if (id.indexOf('=') > -1) {
			const endpoint = `http://api.ft.com/concordances?identifierValue=${id}&authority=http://api.ft.com/system/FT-TME&apiKey=${CONCORDANCE_API_KEY}`;
			const { concordances } = (await (await fetch(endpoint)).json());
			idV2 = concordances[0].concept.id.replace(/https?:\/\/api\.ft\.com\/\w+\//, '');
		}
		else { // This is actually a v2 ID already
			idV2 = id;
		}


		return Promise.all([
			api.search({
				query: {
					term: { 'annotations.id': idV2 },
				},
			}),

			getThings([idV2]),
		])
			.then(([searchResults, tags]) => {
				if (!tags.items || !tags.items.length) {
					throw new createError(404, ''); // Empty response to prevent "Not Found" text
				}

				return list({
					id,
					type: tags.items[0].taxonomy,
					items: searchResults,
					title: tags.items[0].name,
					canFollow: true,
					url: 'https://www.ft.com/stream/' + id,
				});
			})
			.catch((err) => {
				// workaround api client rejecting with a stackless error
				// - see https://github.com/matthew-andrews/fetchres/issues/9
				if (!(err instanceof Error) || !err.stack) {
					if (err.name === 'BadServerResponseError') {
						throw new createError(404, ''); // Empty response to prevent "Not Found" text
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
	catch (e) {
		console.error(e);
		throw e;
	}
}
