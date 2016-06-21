export default tag => {
	if (tag) {
		return {
			taxonomy: tag.taxonomy,
			headshot: tag.headshot,
			name: tag.prefLabel,
			url: '/stream/' + tag.taxonomy + 'Id/' + tag.idV1,
			id: tag.idV1
		};
	}
};
