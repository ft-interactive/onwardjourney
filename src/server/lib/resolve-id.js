const vanities = {
	thing: {
		news: 'Nw==-R2VucmVz',
	},

	list: {
		graphics: '2f94fa02-647f-11e6-8e73-a628b7ca0fc8',
		highlights: '73667f46-1a55-11e5-a130-2e7db721f996',
	},
};

export default function resolveId(type, vanityOrId) {
	if (!vanities[type]) {
		throw new Error('Unknown taxonomy type');
	}

	return !!vanities[type][vanityOrId]
                                ? vanities[type][vanityOrId]
                                : vanityOrId;
}
