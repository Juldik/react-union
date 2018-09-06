import React, { Component } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';

import { invariant, memoizedClearContent } from '../../utils';
import { withErrorBoundary } from '../../decorators';
import { WidgetContext } from '../../contexts';
import { WidgetConfigShape } from '../../shapes';
import { INVALID_JSON } from '../../constants';

/**
 * An internal component of `Union`.
 *
 * It renders a widget based on `descriptor` and `component` using React portals.
 * Provides context to the `component` with widget descriptor information.
 *
 */
export class Widget extends Component {
	static propTypes = {
		config: PropTypes.shape(WidgetConfigShape).isRequired,
		initialProps: PropTypes.object,
		isServer: PropTypes.bool.isRequired,
	};

	state = {
		initialProps: null,
	};

	componentDidMount() {
		if (!this.props.initialProps) {
			this.getInitialProps();
		}
	}

	getInitialProps = async () => {
		const { config } = this.props;
		const { component } = config;
		const { getInitialProps } = component.preload ? await component.preload() : component;

		if (getInitialProps) {
			const initialProps = await getInitialProps(config);
			this.setState({ initialProps });
		}
	};

	render() {
		const { config, isServer } = this.props;
		const { component: WidgetComponent, container, data, namespace, widget } = config;

		invariant(
			data !== INVALID_JSON,
			`Invalid JSON data encountered while attempting to render widget "${widget}". ` +
				'This is often due to a trailing comma or missing quotation marks.'
		);

		const widgetProps = { data, isServer, namespace };

		// NOTE: On the server, `this.state.initialProps` is always null.
		// On the client, state contains client-side initialProps and props contain server-side ones.
		const initialProps = this.state.initialProps || this.props.initialProps;

		const widgetElement = (
			<WidgetContext.Provider value={widgetProps}>
				<WidgetComponent {...widgetProps} {...initialProps} />
			</WidgetContext.Provider>
		);

		if (isServer) {
			return <div data-union-portal={container}>{widgetElement}</div>;
		}

		const domElement = document.getElementById(container);
		invariant(domElement, `HTML element with ID "${container}" not found for widget "${widget}".`);

		// NOTE: Because React does not support hydration of portals yet, we clear the domElement's
		// inner HTML on the initial render. In order to prevent an ugly white flash, we need to do
		// this immediately before rendering the actual client-side portal. Memoization is used
		// to prevent clearing the same element more than once per multiple client-side renders.
		// TODO: Remove next line when https://github.com/facebook/react/issues/13097 is resolved.
		memoizedClearContent(domElement);
		return createPortal(widgetElement, domElement);
	}
}

export default withErrorBoundary(Widget);
