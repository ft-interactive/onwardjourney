const vanities = {
	thing: {
		news: 'Nw==-R2VucmVz',
		baseline: 'N2M5Mjc5ZjktNjBhOS00MjEzLWFjMjItMGVhNjNiN2U1MTFj-QnJhbmRz',
		companies: 'Mjk&#x3D;-U2VjdGlvbnM&#x3D;',
		world: 'MQ&#x3D;&#x3D;-U2VjdGlvbnM&#x3D;',
		'chart-doctor': 'YTIwMWFhZGEtOGE4MS00ZDdlLTlhYjUtZjA4NmY0ZjcxNzhh-QnJhbmRz',
		'the-big-read': 'MTE4-U2VjdGlvbnM&#x3D;',
		'ft-data': 'MGY2ZTQ3MTYtYjJiNS00ODVhLTlkYTktNzZlNzc3YTcxOWYy-QnJhbmRz',
	},

	list: {
		graphics: '2f94fa02-647f-11e6-8e73-a628b7ca0fc8',
		highlights: '73667f46-1a55-11e5-a130-2e7db721f996',
		lawyers: '64641b86-2b85-11e8-9b4b-bc4b9f08f381',
	},
};

export default function resolveId(type, vanityOrId) {
	if (!vanities[type]) {
		throw new Error('Unknown taxonomy type');
	}

	return vanities[type][vanityOrId] ?
		vanities[type][vanityOrId] :
		vanityOrId;
}
