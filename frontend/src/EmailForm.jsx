import React, {Component} from 'react';
import { Editor } from '@tinymce/tinymce-react';

const MSG_SERVICE_PATH = '/mssc/v1';
const MEDIA_TYPES = ['text/plain', 'text/html'];

class EmailForm extends Component {

  constructor(props) {
    super(props);

    this.state = {
      config: {},
      healthCheck: {
        credentialsGood: false,
        credentialsAuthenticated: false,
        hasTopLevel: false,
        hasCreateMessage: false,
        cmsgApiHealthy: false,
      },
      info: '',
      error: '',
      form: {
        wasValidated: false,
        sender: 'NR.CommonServiceShowcase@gov.bc.ca',
        recipients: '',
        subject: '',
        plainText: '',
        htmlText: '',
        mediaType: MEDIA_TYPES[0]
      }
    };

    this.formSubmit = this.formSubmit.bind(this);
    this.onChangeSubject = this.onChangeSubject.bind(this);
    this.onChangeRecipients = this.onChangeRecipients.bind(this);
    this.onChangePlainText = this.onChangePlainText.bind(this);
    this.onChangeHtmlText = this.onChangeHtmlText.bind(this);
    this.onChangeMediaType = this.onChangeMediaType.bind(this);
  }

  onChangeSubject(event) {
    let form = this.state.form;
    form.subject = event.target.value;
    this.setState({form: form, info: ''});
  }

  onChangeRecipients(event) {
    let form = this.state.form;
    form.recipients = event.target.value;
    this.setState({form: form, info: ''});
  }

  onChangePlainText(event) {
    let form = this.state.form;
    form.plainText = event.target.value;
    this.setState({form: form, info: ''});
  }

  onChangeHtmlText(event) {
    let form = this.state.form;
    form.htmlText = event.target.getContent();
    this.setState({form: form, info: ''});
  }

  onChangeMediaType(event) {
    let form = this.state.form;
    form.mediaType = event.target.value;
    this.setState({form: form, info: ''});
  }

  getMessageBody() {
    const form = this.state.form;
    if (form.mediaType === MEDIA_TYPES[0]) {
      return form.plainText && form.plainText.trim();
    }
    return form.htmlText && form.htmlText.trim();
  }

  hasMessageBody() {
    return this.getMessageBody().length > 0;
  }

  async componentDidMount() {
    let configurations = undefined;
    let defaultConfiguration = undefined;
    let {credentialsGood, credentialsAuthenticated, hasTopLevel, hasCreateMessage, cmsgApiHealthy} = false;
    try {

      await this.pingMessageService();

      configurations = await this.fetchConfigurations();
      defaultConfiguration = this.getDefaultConfiguration(configurations);
      let data = await this.fetchToken();
      let {token, credentialsGood, credentialsAuthenticated, hasTopLevel, hasCreateMessage} = data;
      let cmsgApiHealthy = false;
      if (hasTopLevel) {
        let json = await this.healthCheck(token, defaultConfiguration.urls.root);
        cmsgApiHealthy = json['@type'] === 'http://nrscmsg.nrs.gov.bc.ca/v1/endpoints';
      }

      this.setState({
        config: defaultConfiguration,
        healthCheck: {
          credentialsGood: credentialsGood,
          credentialsAuthenticated: credentialsAuthenticated,
          hasTopLevel: hasTopLevel,
          hasCreateMessage: hasCreateMessage,
          cmsgApiHealthy: cmsgApiHealthy
        }
      });

    } catch (e) {
      this.setState({
        config: defaultConfiguration,
        healthCheck: {
          credentialsGood: credentialsGood,
          credentialsAuthenticated: credentialsAuthenticated,
          hasTopLevel: hasTopLevel,
          hasCreateMessage: hasCreateMessage,
          cmsgApiHealthy: cmsgApiHealthy
        },
        error: e.message
      });
    }
  }

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
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Content-Type', 'application/json');
    const response = await fetch(url, {method: 'get', headers: headers});
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

    if (!(event.target.checkValidity() && this.hasMessageBody())) {
      let form = this.state.form;
      form.wasValidated = true;
      this.setState({form: form, info: ''});
      return;
    }

    try {
      let data = await this.fetchToken();
      let {token, hasCreateMessage} = data;
      if (hasCreateMessage) {
        await this.postEmail(token);
        //await this.checkStatus(token, response);
      }
      let form = this.state.form;
      form.wasValidated = false;
      form.recipients = '';
      form.subject = '';
      form.plainText = '';
      form.htmlText = '';
      form.mediaType= MEDIA_TYPES[0];
      this.setState({
        form: form,
        info: 'Message submitted to Common Messaging Service'
      });
    } catch (e) {
      let form = this.state.form;
      form.wasValidated = false;
      this.setState({
        form: form,
        error: e.message
      });
    }

    window.scrollTo(0, 0);

  }

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
        "maxResend": 0
    }
    `;
    // Add the user entered fields
    const requestBody = JSON.parse(defaults);
    requestBody.mediaType = this.state.form.mediaType;
    requestBody.sender = this.state.form.sender;
    requestBody.subject = this.state.form.subject;
    requestBody.message = this.getMessageBody();
    requestBody.recipients = this.state.form.recipients.replace(/\s/g, '').split(',');

    const headers = new Headers();
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Content-Type', 'application/json');

    let response = await fetch(url, {
      method: 'POST',
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
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Content-Type', 'application/json');

    await this.sleep(100);
    let result = await fetch(statusHref, {
      method: 'GET',
      headers: headers
    }).then(res => res.json());
    return result;

  }

  render() {
    // set styles and classes here...
    const credentialsIndClass = this.state.healthCheck.credentialsGood ? 'icon good' : 'icon bad';
    const apiAccessIndClass = this.state.healthCheck.hasTopLevel ? 'icon good' : 'icon bad';
    const createMsgIndClass = this.state.healthCheck.hasCreateMessage ? 'icon good' : 'icon bad';
    const healthCheckIndClass = this.state.healthCheck.cmsgApiHealthy ? 'icon good' : 'icon bad';
    const emailFormDisplay = this.state.healthCheck.hasCreateMessage ? {} : {display: 'none'};
    const successDisplay = (this.state.info && this.state.info.length > 0) ? {} : {display: 'none'};
    const errorDisplay = (this.state.error && this.state.error.length > 0) ? {} : {display: 'none'};
    const plainTextDisplay = this.state.form.mediaType === MEDIA_TYPES[0] ? { height: '200px'} : {display: 'none'};
    const plainTextButton = this.state.form.mediaType === MEDIA_TYPES[0] ? 'btn btn-sm btn-outline-secondary active' : 'btn btn-sm btn-outline-secondary';
    const htmlTextDisplay = this.state.form.mediaType === MEDIA_TYPES[1] ? {} : {display: 'none'};
    const htmlTextButton = this.state.form.mediaType === MEDIA_TYPES[1] ? 'btn btn-sm btn-outline-secondary active' : 'btn btn-sm btn-outline-secondary';
    const {wasValidated} = this.state.form;
    const bodyErrorDisplay = (this.state.form.wasValidated && !this.hasMessageBody()) ? {} : {display: 'none'};

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
              readOnly required value={this.state.form.sender}/>
            <div className="invalid-feedback">
              Email sender is required.
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="recipients">Recipients</label>
            <input type="text" className="form-control" name="recipients"
              placeholder="you@example.com (separate multiple by comma)" required
              value={this.state.form.recipients} onChange={this.onChangeRecipients}/>
            <div className="invalid-feedback">
              One or more email recipients required.
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="subject">Subject</label>
            <input type="text" className="form-control" name="subject" required value={this.state.form.subject}
              onChange={this.onChangeSubject}/>
            <div className="invalid-feedback">
              Subject is required.
            </div>
          </div>

          <div className="mb-3 row">
            <div className="col-sm-4">
              <label className="mt-1">Body</label>
            </div>
            <div className="col-sm-4  offset-sm-4 btn-group btn-group-toggle">
              <label className={plainTextButton}>
                <input type="radio" defaultChecked={this.state.form.mediaType === MEDIA_TYPES[0]} value={MEDIA_TYPES[0]} name="mediaType" onChange={this.onChangeMediaType} /> Plain Text
              </label>
              <label className={htmlTextButton}>
                <input type="radio" defaultChecked={this.state.form.mediaType === MEDIA_TYPES[1]} value={MEDIA_TYPES[1]} name="mediaType" onChange={this.onChangeMediaType} /> HTML
              </label>
            </div>
          </div>
          <div style={plainTextDisplay} >
            <textarea name="plainText" className="form-control" cols="30" rows="8" required={this.state.form.mediaType === MEDIA_TYPES[0]}
              value={this.state.form.plainText} onChange={this.onChangePlainText}></textarea>
            <div className="invalid-feedback" style={bodyErrorDisplay}>
              Body is required.
            </div>
          </div>
          <div style={htmlTextDisplay} >
            <Editor
              value={this.state.form.htmlText}
              init={{
                plugins: 'link image code',
                toolbar: 'undo redo | bold italic | alignleft aligncenter alignright | code',
                height : '120'
              }}
              onChange={this.onChangeHtmlText}
            />
            <div className="invalid-tinymce" style={bodyErrorDisplay}>
              Body is required.
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
