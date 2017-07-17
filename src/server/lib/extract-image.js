export default (item, defaultSize, className) => {
	if (item.mainImage) {
		if (defaultSize) {
			item.mainImage.srcset = {
				default: defaultSize,
			};
		}
		if (className) {
			item.mainImage.className = className;
		}
		if (item.mainImage.url) {
			item.mainImage.url = encodeURIComponent(item.mainImage.url);
		}
		return item.mainImage;
	}

	return undefined;
};
