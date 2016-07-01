import api from 'next-ft-api-client';
import extractImage from './lib/extract-image';
import getBranding from 'ft-n-article-branding';
import legacyTagCompat from './models/legacy-tag-compat';
import loadList from './lib/load-list';
import subheading from './models/subheading';

export default async (uuid, limit = null) => {

	return loadList(uuid)
			.then(list => {
				if (limit) {
					list.uuids = list.uuids.slice(0, limit);
				}
				return api.content({ uuid: list.uuids, index: 'v3_api_v2' })
			})
			.then(items => ({
				items: items.filter(item => item).map(item => articleModel(item)),
				id: 'list-fragment_' + uuid,
			}));
}

const articleModel = item => {
	return {
		id: item.id,
		title: item.title,
		publishedDate: item.publishedDate,
		subheading: subheading(item),
		mainImage: extractImage(item),
		branding: legacyTagCompat(getBranding(item.metadata)),
	};
};
