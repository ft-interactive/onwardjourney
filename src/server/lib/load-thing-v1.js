import * as fetch from 'node-fetch';
import createError from 'http-errors';
import api from '@financial-times/n-es-client';
import list from '../models/list';
import { isV1Id } from '../helpers';

function compat(tag) {
	return {
		term: Object.assign({}, { name: tag.prefLabel, id: tag.id }, tag),
	};
}

function getTag(id) {
	const data = {
		_source: 'annotations',
		query: {
			term: { 'annotations.id': id },
		},
		sort: {
			publishedDate: {
				order: 'desc',
			},
		},
		size: 1,
	};
	return api
		.search(data)
		.then(([resultData]) => {
			const { annotations } = resultData;
			if (annotations) {
				return {
					status: 200,
					body: compat(annotations.find(tag => tag.id === id)),
				};
			}
			return {
				status: 404,
				body: { error: 'Not found, could be deleted or might never had existed' },
			};
		})
		.catch(() => ({
			status: 500,
			body: { error: 'Server error' },
		}));
}

function getThings(ids) {
	const identifierValues = ids;

	if (identifierValues.length === 0 || !Array.isArray(identifierValues)) {
		return Promise.resolve([]);
	}

	return Promise.all(identifierValues.map(id => getTag(id)))
		.then((results) => {
			const items = results.filter(r => r.status === 200).map(r => r.body.term);

			return {
				total: items.length,
				items,
			};
		})
		.catch(() => {
			throw new createError.NotFound();
		});
}

/**
 * Downloads a list of articles from CAPI and returns
 * the UUIDs, plus any metadata.
 */
export default async function loadThing(id) {
	try {
		if (isV1Id(id)) {
			const endpoint = `http://api.ft.com/concordances?identifierValue=${id}=&authority=http://api.ft.com/system/FT-TME&apiKey=${process.env.CONTENT_API_KEY}`;
			const { concordances } = (await (await fetch(endpoint)).json());
			const idV2 = concordances[0].concept.id.replace(/https?:\/\/api\.ft\.com\/\w+\//, '');

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
						url: 'https://next.ft.com/stream/' + tags.items[0].taxonomy + 'Id/' + id,
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
	}
	catch (e) {
		throw e;
	}

	return false;
}
