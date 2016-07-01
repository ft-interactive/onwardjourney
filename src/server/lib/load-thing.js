import 'isomorphic-fetch';
import api from 'next-ft-api-client';
import {coroutine} from 'bluebird';

/**
 * Downloads a list of articles from CAPI and returns the UUIDs, plus any metadata.
 */

export default coroutine(function * loadList(id) {
	let apiResult;

	try {
		apiResult = yield api.search({filter: {
			bool: {
				must: [
					{ term: { 'metadata.idV1': id } }
				]
			}
		}});
	}
	catch (err) {
		// workaround api client rejecting with a stackless error
		// - see https://github.com/matthew-andrews/fetchres/issues/9
		if ((!err instanceof Error) || !err.stack) {
			err = new Error(`Non-error thrown - name: "${err.name}"; message: "${err.message}"}`);
			err.originalError = err;
		}

		throw err;
	}

	return apiResult;
});
