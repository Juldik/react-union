import o from 'ramda/src/o';
import unary from 'ramda/src/unary';

import { INVALID_JSON } from '../constants';

const dangerouslyParseJsonContent = o(unary(JSON.parse), wrapper => wrapper.html());

const parseJsonContent = wrapper => {
	try {
		return dangerouslyParseJsonContent(wrapper);
	} catch (error) {
		if (wrapper.html().trim()) {
			return INVALID_JSON;
		}

		return null;
	}
};

const parseDescriptor = wrapper => ({
	widget: wrapper.data('union-widget'),
	container: wrapper.data('union-container'),
	namespace: wrapper.data('union-namespace'),
	data: parseJsonContent(wrapper),
});

export const getWidgetDescriptors = $ =>
	$('[data-union-widget]')
		.map((_, element) => parseDescriptor($(element)))
		.get();

export const getCommonDescriptors = $ =>
	$('[data-union-common]')
		.map((_, element) => parseJsonContent($(element)))
		.get();