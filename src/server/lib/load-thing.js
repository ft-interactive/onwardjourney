import fetch from 'node-fetch';
import createError from 'http-errors';
import api from '@financial-times/n-es-client';
import list from '../models/list';

const { CONCORDANCE_API_KEY } = process.env;

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
				body: '',
			};
		})
		.catch(() => ({
			status: 500,
			body: { error: 'Server error' },
		}));
}

export function getThings(ids) {
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
		.catch((e) => {
			console.error(e);
			throw new createError(404, '');
		});
}

/**
 * Downloads a list of articles from CAPI and returns
 * the UUIDs, plus any metadata.
 */
export default function loadThing(id) {
	return Promise.all([
		api.search({
			query: {
				term: { 'annotations.id': id },
			},
		}),

		getThings([id]),
	])
		.then(async ([searchResults, tags]) => {
			if (!tags.items || !tags.items.length) {
				// This is likely a CAPI v2 identifier; we need to update it to CAPI v3
				try {
					const endpoint = `http://api.ft.com/concordances?identifierValue=${id}&authority=http://api.ft.com/system/UPP&apiKey=${CONCORDANCE_API_KEY}`;
					const { concordances } = (await (await fetch(endpoint)).json());
					const v3ConceptId = concordances[0].concept.id.replace(/https?:\/\/api\.ft\.com\/\w+\//, '');

					const [searchResultsV3, tagsV3] = await Promise.all([
						api.search({
							query: {
								term: { 'annotations.id': v3ConceptId },
							},
						}),
						getThings([v3ConceptId]),
					]);

					if (!tagsV3.items || !tagsV3.items.length) { // (╯°□°）╯︵ ┻━┻
						console.error(`No items for ${id}`);
						throw new createError(404, ''); // Empty response to prevent "Not Found" text
					}

					return list({
						id,
						type: tagsV3.items[0].taxonomy,
						items: searchResultsV3,
						title: tagsV3.items[0].name,
						canFollow: true,
						url: 'https://www.ft.com/stream/' + id,
					});
				}
				catch (e) { // Couldn't resolve an updated CAPI ID; return 404 instead.
					console.error(e);
					throw new createError(404, ''); // Empty response to prevent "Not Found" text
				}
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
