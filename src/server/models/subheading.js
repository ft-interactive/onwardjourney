import cheerio from 'cheerio';

export default (item) => {
	if (item.summaries && item.summaries.length) {
		return item.summaries[0];
	}
	else if (item.openingXML) {
		return cheerio.load(item.openingXML)('p').first().text();
	}
	else if (item.bodyXML) {
		return cheerio.load(item.bodyXML)('p').first().text();
	}
	return undefined;
};
