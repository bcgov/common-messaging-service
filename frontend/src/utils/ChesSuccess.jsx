import React, {Component} from 'react';
import PropTypes from 'prop-types';
import * as ExcelUtils from './ExcelUtils';

class ChesSuccess extends Component {
  constructor(props) {
    super(props);
    this.onDownload = this.onDownload.bind(this);
  }

  onDownload(event) {
    event.preventDefault();
    if (this.props.transactionCsv) {
      ExcelUtils.writeCsv(this.props.transactionCsv);
    }
  }

  componentDidMount() {

  }

  componentWillUnmount() {

  }

  getDisplay() {
    return (this.props.transactionCsv) ? {} : {display: 'none'};
  }

  render() {
    return (
      <div className="alert alert-success" style={this.getDisplay()}>
        <h4>{this.props.title}</h4>
        <hr className="my-4"/>
        <h6>Download transaction and message information for tracking in your system.</h6>
        <button type="button" className="btn btn-success" onClick={this.onDownload}>Download <i
          className="fa fa-download"/></button>
      </div>
    );
  }
}

ChesSuccess.propTypes = {
  title: PropTypes.string,
  transactionCsv: PropTypes.object
};

export default ChesSuccess;
