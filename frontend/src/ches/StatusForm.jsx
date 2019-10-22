import React, {Component} from 'react';
import {AuthConsumer} from '../auth/AuthProvider';
import * as StorageUtils from '../utils/StorageUtils';

import CreatableSelect from 'react-select/creatable';

class StatusForm extends Component {
  constructor(props) {
    super(props);
    this.formSubmit = this.formSubmit.bind(this);
    this.state = {
      busy: false,
      form: {
        wasValidated: false,
        transactionId: '',
        messageId: '',
        status: '',
        tag: ''
      }
    };

    this.transactionIdChanged = this.transactionIdChanged.bind(this);
    this.messageIdChanged = this.messageIdChanged.bind(this);
    this.statusChanged = this.statusChanged.bind(this);
    this.tagChanged = this.tagChanged.bind(this);
  }

  transactionIdChanged(value) {
    let form = this.state.form;
    form.transactionId = value ? value.value : '';
    this.setState({form: form});
  }

  messageIdChanged(value) {
    let form = this.state.form;
    form.messageId = value ? value.value : '';
    this.setState({form: form});
  }

  statusChanged(value) {
    let form = this.state.form;
    form.status = value ? value.value : '';
    this.setState({form: form});
  }

  tagChanged(value) {
    let form = this.state.form;
    form.tag = value;
    this.setState({form: form});
  }

  async formSubmit(event) {
    event.preventDefault();
    event.stopPropagation();

    if (this.state.form.transactionId === '') {
      let form = this.state.form;
      form.wasValidated = true;
      this.setState({form: form});
      return;
    }

  }

  componentDidMount() {

  }

  componentWillUnmount() {

  }

  getStatusOptions() {
    return ['accepted', 'completed', 'enqueued', 'failed'].map((t) => {
      return {value: t, label: t};
    });
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

  render() {
    const buttonStyle = {'margin-top': '2em'};
    const transactionErrorDisplay = (this.state.form.wasValidated && this.state.form.transactionId === '') ? {} : {display: 'none'};

    return (
      <div>
        <AuthConsumer>
          {({isAuthenticated}) => {
            if (isAuthenticated()) {
              return (<form id="statusForm" noValidate onSubmit={this.formSubmit}>
                <div className='row'>
                  <div className="mb-3 col-md-6">
                    <label htmlFor="transactionId">Transaction ID</label>
                    <CreatableSelect
                      isClearable
                      theme={this.themeOverride}
                      onChange={this.transactionIdChanged}
                      options={StorageUtils.getTransactionIdOptions()}
                    />
                    <div className="invalid-field" style={transactionErrorDisplay}>
                      Transaction ID is required.
                    </div>
                  </div>
                  <div className="mb-3 col-md-6">
                    <label htmlFor="messageId">Message ID</label>
                    <CreatableSelect
                      isClearable
                      theme={this.themeOverride}
                      onChange={this.messageIdChanged}
                      options={StorageUtils.getMessageIdOptions()}
                    />
                  </div>
                </div>
                <div className='row'>
                  <div className="mb-3 col-md-6">
                    <label htmlFor="tag">Tag</label>
                    <input type="text" className="form-control" name="tag" value={this.state.tag}
                      onChange={this.tagChanged}/>
                  </div>
                  <div className="mb-3 col-md-4">
                    <label htmlFor="status">Status</label>
                    <CreatableSelect
                      isClearable
                      theme={this.themeOverride}
                      onChange={this.statusChanged}
                      options={this.getStatusOptions()}
                    />
                  </div>
                  <div className="mb-3 col-md-2">
                    <button className="btn btn-primary btn-block" type="submit" style={buttonStyle}>Search&nbsp;<i
                      className="fas fa-search"/></button>
                  </div>
                </div>
                <hr className="mb-4"/>

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

StatusForm.propTypes = {};

export default StatusForm;
