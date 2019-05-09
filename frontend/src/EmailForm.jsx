import React, {Component} from 'react';

const MSG_SERVICE_PATH = '/mssc/v1';

class EmailForm extends Component {

  constructor(props) {
    super(props);

    this.state = {
      config: {},
      credentialsGood: false,
      credentialsAuthenticated: false,
      hasTopLevel: false,
      hasCreateMessage: false,
      cmsgApiHealthy: false,
      wasValidated: false,
      sender: "NR.CommonServiceShowcase@gov.bc.ca",
      recipients: "",
      subject: "",
      body: "",
      info: "",
      error: ""
    };

    this.formSubmit = this.formSubmit.bind(this);
    this.onChangeSubject = this.onChangeSubject.bind(this);
    this.onChangeRecipients = this.onChangeRecipients.bind(this);
    this.onChangeBody = this.onChangeBody.bind(this);
  }

  onChangeSubject(event) {
    this.setState({subject: event.target.value, info: ""});
  }

  onChangeRecipients(event) {
    this.setState({recipients: event.target.value, info: ""});
  }

  onChangeBody(event) {
    this.setState({body: event.target.value, info: ""});
  }

  async componentDidMount() {
    let configurations = undefined;
    let defaultConfiguration = undefined;
    let { credentialsGood, credentialsAuthenticated, hasTopLevel, hasCreateMessage, cmsgApiHealthy } = false;
    try {

      await this.pingMessageService();

      configurations = await this.fetchConfigurations();
      defaultConfiguration = this.getDefaultConfiguration(configurations);
      let data = await this.fetchToken();
      let {token, credentialsGood, credentialsAuthenticated, hasTopLevel, hasCreateMessage} = data;
      let cmsgApiHealthy = false;
      if (hasTopLevel){
        let json = await this.healthCheck(token, defaultConfiguration.urls.root);
        cmsgApiHealthy = json['@type'] === 'http://nrscmsg.nrs.gov.bc.ca/v1/endpoints';;
      }

      this.setState({
        config: defaultConfiguration,
        credentialsGood: credentialsGood,
        credentialsAuthenticated: credentialsAuthenticated,
        hasTopLevel: hasTopLevel,
        hasCreateMessage: hasCreateMessage,
        cmsgApiHealthy: cmsgApiHealthy
      });

    } catch(e) {
      this.setState({
        config: defaultConfiguration,
        credentialsGood: credentialsGood,
        credentialsAuthenticated: credentialsAuthenticated,
        hasTopLevel: hasTopLevel,
        hasCreateMessage: hasCreateMessage,
        cmsgApiHealthy: cmsgApiHealthy,
        error: e.message
      });
   }
  };

  async pingMessageService() {
    const response = await fetch(`${MSG_SERVICE_PATH}/config`);
    if (!response.ok) {
      throw Error(`Could not reach Showcase Messaging Service, please ensure that it is running at ${process.env.PUBLIC_URL}${MSG_SERVICE_PATH}`);
    }
  }

  async fetchConfigurations() {
    const response = await fetch(`${MSG_SERVICE_PATH}/config`);
    if (!response.ok) {
      throw Error('Could not fetch configuration from Showcase Messaging Service: ' + response.statusText);
    }
    return await response.json()
      .then(json => {
        return json.configs;
      })
      .catch(error => {
        throw Error(error.message);
    });
  }

  getDefaultConfiguration(configs) {
    const result = configs.filter(c => c.default);
    return result[0];
  }

  async fetchToken() {
    const response = await fetch(`${MSG_SERVICE_PATH}/token`);
    if (!response.ok) {
      throw Error('Could not fetch Authentication token from Showcase Messaging Service: ' + response.statusText);
    }
    return await response.json().catch(error => {
      throw Error(error.message);
    });
  }

  async healthCheck(token, url) {
    if (!url) {
      url = this.state.config.urls.root;
    }
    let headers = new Headers();
    headers.set("Authorization", `Bearer ${token}`);
    headers.set("Content-Type", "application/json");
    const response = await fetch(url, {method: "get", headers: headers});
    if (!response.ok) {
      throw Error('Could not connect to Common Messaging Service: ' + response.statusText);
    }
    return await response.json().catch(error => {
      throw Error(error.message);
    });
  }

  async formSubmit(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!event.target.checkValidity()) {
      this.setState({wasValidated: true, info: ""});
      return;
    }

    try {
      let data = await this.fetchToken();
      let {token, hasCreateMessage} = data;
      if (hasCreateMessage) {
        await this.postEmail(token);
        //await this.checkStatus(token, response);
      }
      this.setState({
        wasValidated: false,
        recipients: "",
        subject: "",
        body: "",
        info: "Message submitted to Common Messaging Service"
      });
    } catch(e) {
      this.setState({
        wasValidated: false,
        info: "",
        error: e.message
      });
    }

    window.scrollTo(0, 0);

  };

  async postEmail(token, url) {
    if (!url) {
      url = this.state.config.urls.messages;
    }
    // Things that aren't in the UI to enter
    const defaults = `
    {
        "@type" : "http://nrscmsg.nrs.gov.bc.ca/v1/emailMessage",
        "links": [
        ],
        "delay": 0,
        "expiration": 0,
        "maxResend": 0,
        "mediaType": "text/plain"
    }
    `
    // Add the user entered fields
    const requestBody = JSON.parse(defaults);
    requestBody.sender = this.state.sender;
    requestBody.subject = this.state.subject;
    requestBody.message = this.state.body;
    requestBody.recipients = this.state.recipients.replace(/\s/g, '').split(",");

    const headers = new Headers();
    headers.set("Authorization", `Bearer ${token}`);
    headers.set("Content-Type", "application/json");

    let response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: headers
    });
    if (!response.ok) {
      throw Error('Could not connect to Common Messaging Service: ' + response.statusText);
    }
    return await response.json().catch(error => {
      throw Error(error.message);
    });
  }

  async checkStatus(token, msg) {
    let done = false;
    let result = undefined;
    do {
      let status = await this.fetchStatus(token, msg.links[0]['href']);
      done = status.elements && status.elements.length === 1;
      if (done) {
        result = status.elements[0]['content'];
      }
    } while (!done);

    return result;

  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fetchStatus(token, statusHref) {
    const headers = new Headers();
    headers.set("Authorization", `Bearer ${token}`);
    headers.set("Content-Type", "application/json");

    await this.sleep(100);
    let result = await fetch(statusHref, {
      method: "GET",
      headers: headers
    }).then(res => res.json());
    return result;

  }


  render() {
    // set styles and classes here...
    const credentialsIndClass = this.state.credentialsGood ? "icon good" : "icon bad";
    const apiAccessIndClass = this.state.hasTopLevel ? "icon good" : "icon bad";
    const createMsgIndClass = this.state.hasCreateMessage ? "icon good" : "icon bad";
    const healthCheckIndClass = this.state.cmsgApiHealthy ? "icon good" : "icon bad";
    const emailFormDisplay = this.state.hasCreateMessage ? {} : {display: 'none'};
    const successDisplay = (this.state.info && this.state.info.length > 0) ? {} : {display: 'none'};
    const errorDisplay = (this.state.error && this.state.error.length > 0) ? {} : {display: 'none'};
    const {wasValidated} = this.state;


    return (
      <div className="col-md-8 order-md-1">
        <div className="alert alert-success" style={successDisplay}>
          {this.state.info}
        </div>
        <div className="alert alert-danger" style={errorDisplay}>
          {this.state.error}
        </div>
        <h4 className="mb-3">Service Client</h4>
        <div id="healthCheck">
          <hr className="mb-4"/>
          <div className="row">
            <span className="col-md-6 hc-text">Service Client credentials</span><span
            className="col-md-6 hc-ind"><span id="credentialsInd"
                                              className={credentialsIndClass}></span></span>
          </div>
          <div className="row">
                            <span
                              className="col-md-6 hc-text">Service Client has access to Common Messaging API</span><span
            className="col-md-6 hc-ind"><span id="apiAccessInd" className={apiAccessIndClass}></span></span>
          </div>
          <div className="row">
            <span className="col-md-6 hc-text">Service Client can send message</span><span
            className="col-md-6 hc-ind"><span id="createMsgInd" className={createMsgIndClass}></span></span>
          </div>
          <div className="row">
            <span className="col-md-6 hc-text">Common Messaging API available</span><span
            className="col-md-6 hc-ind"><span id="healthCheckInd"
                                              className={healthCheckIndClass}></span></span>
          </div>
        </div>

        <hr className="mb-4"/>
        <form id="emailForm" noValidate style={emailFormDisplay} onSubmit={this.formSubmit}
              className={wasValidated ? 'was-validated' : ''}>
          <h4 className="mb-3">Email</h4>
          <div className="mb-3">
            <label htmlFor="sender">Sender</label>
            <input type="text" className="form-control" name="sender"
                   readOnly required value={this.state.sender}/>
            <div className="invalid-feedback">
              Email sender is required.
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="recipients">Recipients</label>
            <input type="text" className="form-control" name="recipients"
                   placeholder="you@example.com (separate multiple by comma)" required
                   value={this.state.recipients} onChange={this.onChangeRecipients}/>
            <div className="invalid-feedback">
              One or more email recipients required.
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="subject">Subject</label>
            <input type="text" className="form-control" name="subject" required value={this.state.subject}
                   onChange={this.onChangeSubject}/>
            <div className="invalid-feedback">
              Subject is required.
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="body">Body</label>
            <textarea name="body" className="form-control" cols="30" rows="7" required
                      value={this.state.body} onChange={this.onChangeBody}></textarea>
            <div className="invalid-feedback">
              Email body is required.
            </div>
          </div>

          <hr className="mb-4"/>
          <button className="btn btn-primary btn-lg btn-block" type="submit">Send Message</button>
        </form>
      </div>
    );
  }
}

export default EmailForm;
