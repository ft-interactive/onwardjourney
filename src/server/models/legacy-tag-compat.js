const streamUrl = (id, taxonomy) =>
	(id && taxonomy ? `https://next.ft.com/stream/${taxonomy}Id/${id}` : '');

const createTag = ({ taxonomy, headshot, prefLabel, idV1 }) =>
	({ id: idV1, taxonomy, headshot, name: prefLabel, url: streamUrl(idV1, taxonomy) });

export default metadata =>
	(metadata ? createTag(metadata) : undefined);
