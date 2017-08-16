import { utcFormat } from 'd3-time-format';

export function isotime(date) {
	if (!date) {
		return '';
	}
	else if (!(date instanceof Date)) {
		return date;
	}
	return date.toISOString();
}

const formatterCache = new Map();
const defaultFTDateFormat = '%A, %-e %B %Y';

export function strftime(date, format = defaultFTDateFormat) {
	if (!date) {
		return '';
	}
	else if (!(date instanceof Date)) {
		return date;
	}

	if (formatterCache.has(format)) {
		return formatterCache.get(format)(date);
	}

	const fm = utcFormat(format);
	formatterCache.set(format, fm);
	return fm(date);
}

export function ftdate(d) {
	return strftime(d);
}
