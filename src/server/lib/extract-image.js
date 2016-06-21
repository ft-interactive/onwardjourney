export default (item, defaultSize, className) => {
	if (item.mainImage) {
		if (defaultSize) {
			item.mainImage.srcset = {
				default: defaultSize
			};
		}
		if (className) {
			item.mainImage.className = className;
		}
		return item.mainImage;
	}
};
