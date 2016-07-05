import api from 'next-ft-api-client';
import extractImage from './lib/extract-image';
import getBranding from 'ft-n-article-branding';
import legacyTagCompat from './models/legacy-tag-compat';
import loadList from './lib/load-list';
import loadThing from './lib/load-thing';
import subheading from './models/subheading';

export default async (reqType, uuid) => {

	let getItems;

	if (reqType === 'list') {
		getItems = loadList(uuid).then(items => api.content({ uuid: items.uuids, index: 'v3_api_v2' }));
	} else if (reqType === 'thing') {
		getItems = loadThing(uuid);
	}

	return getItems.then(items => ({
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
	}
}
