import './StatusPanel.css';

import React, {Component} from 'react';
import {AuthConsumer} from '../auth/AuthProvider';
import * as StorageUtils from '../utils/StorageUtils';
import PropTypes from 'prop-types';

import CreatableSelect from 'react-select/creatable';
import Select from 'react-select';
import axios from 'axios';
import moment from 'moment';
import ChesValidationError from './ChesValidationError';

const CHES_ROOT = process.env.REACT_APP_CHES_ROOT || '';
const CHES_PATH = `${CHES_ROOT}/ches/v1`;
const STATUS_URL = `${CHES_PATH}/status`;
const CANCEL_URL = `${CHES_PATH}/cancel`;

const statusOptions = ['accepted', 'completed', 'enqueued', 'failed'].map((t) => {
  return {value: t, label: t};
});

class StatusPanel extends Component {
  constructor(props) {
    super(props);
    this.formSubmit = this.formSubmit.bind(this);

    this.state = {
      transactionIdOptions: [],
      messageIdOptions: [],
      statusOptions: [],
      form: {
        wasValidated: false,
        transactionId: {value: '', label: ''},
        transactionIdValid: false,
        messageId: {value: '', label: ''},
        status: {value: '', label: ''},
        tag: ''
      },
      statuses: [],
      noResults: false
    };

    this.handleTransactionIdChange = this.handleTransactionIdChange.bind(this);
    this.handleCreateTransactionId = this.handleCreateTransactionId.bind(this);
    this.handleMessageIdChange = this.handleMessageIdChange.bind(this);
    this.handleCreateMessageId = this.handleCreateMessageId.bind(this);
    this.handleStatusChange = this.handleStatusChange.bind(this);

    this.tagChanged = this.tagChanged.bind(this);

    this.clear = this.clear.bind(this);
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  handleTransactionIdChange(value) {
    let form = this.state.form;
    form.transactionId = value;
    form.transactionIdValid = (value && value.value !== '');
    this.setState({form: form});
  }

  handleCreateTransactionId(value) {
    const option = StorageUtils.addTransactionId(value);
    this.handleTransactionIdChange(option);
  }

  handleMessageIdChange(value) {
    let form = this.state.form;
    form.messageId = value;
    this.setState({form: form});
  }

  handleCreateMessageId(value) {
    const option = StorageUtils.addMessageId(value);
    this.handleMessageIdChange(option);
  }

  handleStatusChange(value) {
    let form = this.state.form;
    form.status = value;
    this.setState({form: form});
  }

  tagChanged(event) {
    const form = this.state.form;
    form.tag = event.target.value;
    this.setState({form: form});
  }

  clear() {
    this.setState({
      form: {
        wasValidated: false,
        transactionId: {value: '', label: ''},
        transactionIdValid: false,
        messageId: {value: '', label: ''},
        status: {value: '', label: ''},
        tag: ''
      },
      statuses: [],
      noResults: false
    });
  }

  getOptionValue(x) {
    if (x && x.value) {
      return x.value;
    }
    return '';
  }

  async formSubmit(event) {
    event.preventDefault();
    event.stopPropagation();

    let form = this.state.form;
    if (!this.state.form.transactionIdValid) {
      form.wasValidated = true;
      this.setState({form: form, statuses: []});
      return;
    }

    await this.getStatuses(form);
  }

  async getStatuses(form) {
    let params = {txId: encodeURIComponent(this.getOptionValue(form.transactionId))};
    if (this.getOptionValue(form.messageId) !== '') {
      params.msgId = encodeURIComponent(this.getOptionValue(form.messageId));
    }
    if (form.tag !== '') {
      params.tag = encodeURIComponent(form.tag);
    }
    if (this.getOptionValue(form.status)) {
      params.status = encodeURIComponent(this.getOptionValue(form.status));
    }
    params.fields = 'delayTS';
    try {
      this.props.onBusy(true);
      const user = await this.props.authService.getUser();
      const response = await axios.get(
        STATUS_URL,
        {
          params: params,
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      ).catch(e => {
        if (e && e.response && e.response.status === 422) {
          throw new ChesValidationError(e.response.data);
        } else {
          throw Error('Could not get statuses from Showcase CHES API: ' + e.message);
        }
      });
      // use the response data to populate the table...
      this.setState({
        statuses: response.data,
        form: form,
        noResults: response.data && response.data.length === 0
      });
      this.props.onBusy(false);
    } catch (err) {
      this.setState({statuses: [], form: form, noResults: false});
      this.props.onBusy(false, err);
    }
  }

  async cancel(status) {
    if (status && status.status !== 'completed') {
      let form = this.state.form;
      let params = {msgId: status.msgId};

      try {
        this.props.onBusy(true);
        const user = await this.props.authService.getUser();
        await axios.get(
          CANCEL_URL,
          {
            params: params,
            headers: {
              'Authorization': `Bearer ${user.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        ).catch(e => {
          if (e && e.response && e.response.status === 422) {
            throw new ChesValidationError(e.response.data);
          } else {
            throw Error('Could not cancel message from Showcase CHES API: ' + e.message);
          }
        });
        //fetch status
        await this.getStatuses(form);
      } catch (err) {
        this.setState({statuses: [], form: form, noResults: false});
        this.props.onBusy(false, err);
      }
    }
  }

  themeOverride(theme) {
    return {
      ...theme,
      colors: {
        ...theme.colors,
        primary: '#80bdff'
      },
    };
  }

  getTransactionIdOptions() {
    return StorageUtils.getTransactionIdOptions();
  }

  getMessageIdOptions() {
    return StorageUtils.getMessageIdOptions();
  }

  getStatusOptions() {
    return statusOptions;
  }
  render() {
    const buttonStyle = {'margin-top': '2em'};
    const transactionErrorDisplay = (this.state.form.wasValidated && !this.state.form.transactionIdValid) ? {} : {display: 'none'};
    const statusTableDisplay = this.state.statuses && this.state.statuses.length > 0 ? {} : {display: 'none'};
    const noResultsDisplay = this.state.noResults ? {} : {display: 'none'};

    return (
      <div>
        <AuthConsumer>
          {({isAuthenticated}) => {
            if (isAuthenticated()) {
              return (<form id="statusForm" noValidate onSubmit={this.formSubmit}>
                <div className='row'>
                  <div className="mb-3 col-md-5">
                    <label htmlFor="transactionId">Transaction ID</label>
                    <CreatableSelect
                      isClearable={true}
                      isSearchable={true}
                      theme={this.themeOverride}
                      onChange={(value) => this.handleTransactionIdChange(value)}
                      options={this.getTransactionIdOptions()}
                      value={this.state.form.transactionId}
                      onCreateOption={this.handleCreateTransactionId}
                    />
                    <div className="invalid-field" style={transactionErrorDisplay}>
                      Transaction ID is required.
                    </div>
                  </div>
                  <div className="mb-3 col-md-5">
                    <label htmlFor="messageId">Message ID</label>
                    <CreatableSelect
                      isClearable={true}
                      isSearchable={true}
                      theme={this.themeOverride}
                      onChange={(value) => this.handleMessageIdChange(value)}
                      options={this.getMessageIdOptions()}
                      value={this.state.form.messageId}
                      onCreateOption={this.handleCreateMessageId}
                    />
                  </div>
                  <div className="mb-3 col-md-2">
                    <button className="btn btn-primary btn-block" type="submit" style={buttonStyle}>Search&nbsp;<i
                      className="fas fa-search"/></button>
                  </div>
                </div>
                <div className='row'>
                  <div className="mb-3 col-md-5">
                    <label htmlFor="tag">Tag</label>
                    <input type="text" className="form-control" name="tag" value={this.state.form.tag}
                      onChange={this.tagChanged}/>
                  </div>
                  <div className="mb-3 col-md-5">
                    <label htmlFor="status">Status</label>
                    <Select
                      isClearable={true}
                      isSearchable={true}
                      theme={this.themeOverride}
                      onChange={(value) => this.handleStatusChange(value)}
                      options={this.getStatusOptions()}
                      value={this.state.form.status}
                    />
                  </div>
                  <div className="mb-3 col-md-2">
                    <button className="btn btn-secondary btn-block" type="button" style={buttonStyle}
                      onClick={this.clear}>Clear&nbsp;<i
                        className="fas fa-eraser"/></button>
                  </div>
                </div>
                <div id="messageStatuses">
                  <div className="table-responsive-md">
                    <table className="table table-striped table-ellipsis">
                      <thead>
                        <tr>
                          <th>Transaction ID</th>
                          <th>Message ID</th>
                          <th>Tag</th>
                          <th>Status</th>
                          <th>Delayed Until</th>
                          <th>Cancel</th>
                        </tr>
                      </thead>
                      <tbody style={statusTableDisplay}>
                        {this.state.statuses.map((status, idx) => {
                          return (
                            <tr key={idx}>
                              <td>{status.txId}</td>
                              <td>{status.msgId}</td>
                              <td>{status.tag}</td>
                              <td>{status.status}</td>
                              <td><span style={status.status === 'enqueued' ? {} : {display: 'none'}}>{moment(status.delayTS).format('YYYY-MM-DD HH:mm')}</span></td>
                              <td style={{'padding': '6px', 'text-align': 'center'}}>
                                <button className="btn btn-sm btn-outline-danger"
                                  type="button"
                                  style={status.status === 'completed' ? {display: 'none'} : {}}
                                  onClick={() => this.cancel(status)}><i className="fas fa-minus-circle"
                                    alt="Cancel"/></button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tbody style={noResultsDisplay}>
                        <tr>
                          <td colSpan="5" style={{'text-align': 'center'}}>No results found.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </form>);
            } else {
              return <div><p>You must be logged in to view message statuses.</p></div>;
            }
          }}
        </AuthConsumer>
      </div>
    );
  }
}

StatusPanel.propTypes = {
  authService: PropTypes.object,
  onBusy: PropTypes.func
};

export default StatusPanel;
