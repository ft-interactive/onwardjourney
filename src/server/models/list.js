import label from './label';
import content from './content';

export default ({ id, type, items, title = '',
											canFollow = false, layoutHint = null,
											url = null }) => ({
												id,
												type,
												title,
												label: label(type, title),
												url,
												canFollow,
												layoutHint,
												items: items.filter(Boolean).map(content),
											});
