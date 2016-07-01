import api from 'next-ft-api-client';
import extractImage from './lib/extract-image';
import getBranding from 'ft-n-article-branding';
import legacyTagCompat from './models/legacy-tag-compat';
import loadThing from './lib/load-thing';
import subheading from './models/subheading';

export default async (uuid, limit = null) => {

	return loadThing(uuid)
			.then(items => {
				if (limit) {
					items = items.slice(0, limit);
				}
				return items;
			})
			.then(items => {
				return {
					items: items.filter(item => item).map(item => articleModel(item)),
					id: 'list-fragment_' + uuid,
				}
			});
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
