import createError from 'http-errors';
import api from '@financial-times/n-es-client';
import list from '../models/list';

function compat(tag) {
	return {
		term: Object.assign({}, { name: tag.prefLabel, id: tag.idV1 }, tag),
	};
}

function getTag(id, type) {
	const data = {
		_source: ['metadata'],
		query: {
			term: {},
		},
		sort: {
			publishedDate: {
				order: 'desc',
			},
		},
		size: 1,
	};
	data.query.term[`metadata.${type}`] = id;
	return api.search(data)
		.then(([resultData]) => {
			const { metadata } = resultData;
			if (metadata) {
				return {
					status: 200,
					body: compat(metadata.find(tag => tag[type] === id)),
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
		}))
	;
}

function getThings(opts) {
	const identifierValues = opts.identifierValues;
	const identifierType = opts.identifierType || 'idV1';

	if (identifierValues.length === 0 || !Array.isArray(identifierValues)) {
		return Promise.resolve([]);
	}

	return Promise.all(
		identifierValues.map(id => getTag(id, identifierType)),
	).then((results) => {
		const items = results
					.filter(r => r.status === 200)
					.map(r => r.body.term);
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
export default function loadThing(id) {
	return Promise.all([
		api.search({
			query: {
				bool: {
					filter: [
						{ term: { 'metadata.idV1': id } },
					],
				},
			},
		}),

		getThings({ identifierValues: [id] }),

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
	}).catch((err) => {
		// workaround api client rejecting with a stackless error
		// - see https://github.com/matthew-andrews/fetchres/issues/9
		if ((!(err instanceof Error)) || !err.stack) {
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
