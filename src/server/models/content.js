import getBranding from 'ft-n-article-branding';
import getPrimaryTag from 'ft-next-article-primary-tag';
import legacyTagCompat from './legacy-tag-compat';
import subheading from './subheading';
import extractImage from '../lib/extract-image';

export default content => ({
	id: content.id,
	title: content.title,
	publishedDate: new Date(content.publishedDate),
	subheading: subheading(content),
	mainImage: extractImage(content),
	// metadata: item.metadata,//.map(legacyTagCompat),
	branding: legacyTagCompat(getBranding(content.metadata)),
	primaryTag: legacyTagCompat(getPrimaryTag(content.metadata)),
});
