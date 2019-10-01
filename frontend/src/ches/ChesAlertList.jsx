import React, {Component} from 'react';
import PropTypes from 'prop-types';

class ChesAlertList extends Component {
  constructor(props) {
    super(props);
    this.state = {errors: []};
  }

  componentDidMount() {

  }

  componentWillUnmount() {

  }

  getDisplay() {
    if (this.props.errors && this.props.errors.length > 0) return {display: 'block'};
    return {display: 'none'};
  }

  getAlertClass() {
    return `alert alert-${this.props.alertType}`;
  }

  render() {
    return (
      <div className={this.getAlertClass()} style={this.getDisplay()}>
        <h4>{this.props.title}</h4>
        {this.props.message}
        <ul>
          {this.props.errors.map((err, key) => (
            <li key={key}>{err.message}</li>
          ))}
        </ul>
      </div>
    );
  }
}

ChesAlertList.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
  alertType: PropTypes.oneOf(['primary', 'secondary', 'success', 'light', 'dark', 'info', 'warning', 'danger']),
  errors: PropTypes.array
};

export default ChesAlertList;
