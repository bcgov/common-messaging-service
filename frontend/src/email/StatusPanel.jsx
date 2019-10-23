import React, {Component} from 'react';
import {AuthConsumer} from '../auth/AuthProvider';
import PropTypes from 'prop-types';
import * as StorageUtils from '../utils/StorageUtils';

class StatusPanel extends Component {
  constructor(props) {
    super(props);
    this.formSubmit = this.formSubmit.bind(this);
    this.state = {
      statuses: [],
      noResults: false
    };
  }

  async formSubmit(event) {
    event.preventDefault();
    event.stopPropagation();

    await this.refreshStatuses();
  }

  async asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }

  async refreshStatuses() {
    const messageIds = StorageUtils.getCommonMsgIds();
    this.props.setBusy(true);
    try {
      const user = await this.props.authService.getUser();
      await this.asyncForEach(messageIds, async (id) => {
        const statusResponse = await this.props.fetchStatus(user, id);
        statusResponse.data.statuses.forEach(s => {
          StorageUtils.cmsgToStorage(s);
        });
      });

      const statuses = StorageUtils.getCommonMsgStatuses().map(s => { return { key: Math.random().toString(36), ...s}; });
      this.setState({statuses: statuses, noResults: statuses.length === 0});
      this.props.setBusy(false);
    } catch (e) {
      this.props.setBusy(false, e.message);
      this.setState({noResults: false});
    }
  }

  componentDidMount() {

  }

  componentWillUnmount() {

  }

  render() {
    const statusTableDisplay = this.state.statuses && this.state.statuses.length > 0 ? {} : {display: 'none'};
    const noResultsDisplay = this.state.statuses && this.state.statuses.length === 0 && this.state.noResults ? {} : {display: 'none'};

    return (
      <div>
        <AuthConsumer>
          {({isAuthenticated}) => {
            if (isAuthenticated()) {
              return (<form id="statusForm" noValidate onSubmit={this.formSubmit}>
                <div className='row'>
                  <div className="mb-3 col-md-5">
                  </div>
                  <div className="mb-3 col-md-5">
                  </div>
                  <div className="mb-3 col-md-2">
                    <button className="btn btn-primary btn-block" type="submit">Refresh&nbsp;<i
                      className="fas fa-search"/></button>
                  </div>
                </div>
                <div id="messageStatuses">
                  <div className="table-responsive-md">
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>Message ID</th>
                          <th>Recipient</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody style={statusTableDisplay}>
                        {this.state.statuses.map((status, idx) => {
                          return (
                            <tr key={idx}>
                              <td>{status.messageId}</td>
                              <td>{status.recipient}</td>
                              <td>{status.type}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tbody style={noResultsDisplay}>
                        <tr>
                          <td colSpan="3" style={{'text-align': 'center'}}>No results found.</td>
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
  fetchStatus: PropTypes.func,
  setBusy: PropTypes.func
};

export default StatusPanel;
