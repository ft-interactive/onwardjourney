import label from './label';
import content from './content';

const excludedThings = [
	// FastFT
	'NTlhNzEyMzMtZjBjZi00Y2U1LTg0ODUtZWVjNmEyYmU1NzQ2-QnJhbmRz',

	// Alphaville
	'ZDkyYTVhMzYtYjAyOS00OWI1LWI5ZTgtM2QyYTIzYjk4Y2Jj-QnJhbmRz',
].reduce((o, t) => o.set(t, true), new Map());

const hasExcludedBrand = ({ branding }) =>
	!branding || !excludedThings.has(branding.id);

const hasMainImage = ({ mainImage }) =>
	!!mainImage && !!mainImage.url;

interface IListItem {
	id: string;
	type: string;
	items: any[];
	title: string;
	canFollow?: boolean;
	layoutHint?: null | undefined;
	url?: null | string;
}

export default ({
	id, type, items,
	title = '',
	canFollow = false,
	layoutHint = null,
	url = null,
}: IListItem) => ({
	id,
	type,
	title,
	label: label(type, title),
	url,
	canFollow,
	layoutHint,
	items: items.filter(Boolean)
		.map(content)
		.filter(hasMainImage)
		.filter(hasExcludedBrand),
});
