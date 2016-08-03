const prepositions = {
	topics: 'on',
	sections: 'in',
	authors: 'from',
};

export default (taxonomy, name) =>
	(!prepositions[taxonomy] ? name : ['Latest', prepositions[taxonomy], name].join(' '));
