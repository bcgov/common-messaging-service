import React, {Component} from 'react';
import PropTypes from 'prop-types';

class AlertDisplay extends Component {

  componentDidMount() {

  }

  componentWillUnmount() {

  }

  getDisplay() {
    return (this.props.message && this.props.message.length > 0) ? {} : {display: 'none'};
  }

  getAlertClass() {
    return `alert alert-${this.props.alertType}`;
  }

  render() {
    return (
      <div className={this.getAlertClass()} style={this.getDisplay()}>
        <h4>{this.props.title}</h4>
        {this.props.message}
      </div>
    );
  }
}

AlertDisplay.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
  alertType: PropTypes.oneOf(['primary', 'secondary', 'success', 'light', 'dark', 'info', 'warning', 'danger']),
  displayEvaluator: PropTypes.bool
};

export default AlertDisplay;
