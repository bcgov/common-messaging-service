import React, {Component} from 'react';
import './EmailForm.css';
import TinyMceEditor from '../htmlText/TinyMceEditor';
import Dropzone from 'react-dropzone';

const MSG_SERVICE_PATH = '/mssc/v1';
const MEDIA_TYPES = ['text/plain', 'text/html'];

class EmailForm extends Component {

  constructor(props) {
    super(props);

    this.state = {
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
        files: [],
        reset: false,
        mediaType: MEDIA_TYPES[0]
      }
    };

    this.formSubmit = this.formSubmit.bind(this);
    this.onChangeSubject = this.onChangeSubject.bind(this);
    this.onChangeRecipients = this.onChangeRecipients.bind(this);
    this.onChangePlainText = this.onChangePlainText.bind(this);
    this.onChangeMediaType = this.onChangeMediaType.bind(this);

    this.onEditorChange = this.onEditorChange.bind(this);
    this.onFileDrop = this.onFileDrop.bind(this);
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

  onChangeMediaType(event) {
    let form = this.state.form;
    form.mediaType = event.target.value;
    this.setState({form: form, info: ''});
  }

  onEditorChange(content) {
    let form = this.state.form;
    form.htmlText = content;
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
    let {credentialsGood, credentialsAuthenticated, hasTopLevel, hasCreateMessage, cmsgApiHealthy} = false;
    try {

      let data = await this.healthCheck();
      let {credentialsGood, credentialsAuthenticated, hasTopLevel, hasCreateMessage, cmsgApiHealthy} = data;

      this.setState({
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

  async healthCheck() {
    const response = await fetch(`${MSG_SERVICE_PATH}/health`);
    if (!response.ok) {
      throw Error('Could not connect to Showcase Messaging API: ' + response.statusText);
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
      if (this.state.healthCheck.hasCreateMessage) {
        let filenames = await this.uploadFiles();
        await this.postEmail(filenames);

        // this will reset the form and the tinymce editor...
        let form = this.state.form;
        form.wasValidated = false;
        form.recipients = '';
        form.subject = '';
        form.plainText = '';
        form.htmlText = '';
        form.files = [];
        form.mediaType = MEDIA_TYPES[0];
        form.reset = true;
        this.setState({
          form: form
        });
      }
      // this will show the info message, and prep the tinymce editor for next submit...
      // kind of lame, but event triggering and states are a bit out of wack in production (minified mode)
      let form = this.state.form;
      form.reset = false;
      this.setState({
        form: form,
        info: 'Message submitted to Showcase Messaging API'
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

  async uploadFiles() {
    const data = new FormData();
    for (const file of this.state.form.files) {
      data.append('files', file, file.name);
    }

    let response = await fetch(`${MSG_SERVICE_PATH}/uploads`, {
      method: 'POST',
      body: data
    });
    if (!response.ok) {
      throw Error('Could not upload attachments to Showcase Messaging API: ' + response.statusText);
    }

    return await response.json().catch(error => {
      throw Error(error.message);
    });
  }

  async postEmail(filenames) {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');

    const email  = {
      mediaType: this.state.form.mediaType,
      sender: this.state.form.sender,
      subject: this.state.form.subject,
      message: this.getMessageBody(),
      recipients: this.state.form.recipients,
      filenames: filenames
    };

    let response = await fetch(`${MSG_SERVICE_PATH}/email`, {
      method: 'POST',
      body: JSON.stringify(email),
      headers: headers
    });
    if (!response.ok) {
      throw Error('Could not deliver email to Showcase Messaging API: ' + response.statusText);
    }
    return await response.json().catch(error => {
      throw Error(error.message);
    });
  }

  onFileDrop(acceptedFiles) {
    let form = this.state.form;
    form.files = acceptedFiles;
    this.setState({form: form});
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
    const plainTextDisplay = this.state.form.mediaType === MEDIA_TYPES[0] ? {} : {display: 'none'};
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
            <div className="col-sm-4 offset-sm-4 btn-group btn-group-toggle">
              <label className={plainTextButton}>
                <input type="radio" defaultChecked={this.state.form.mediaType === MEDIA_TYPES[0]} value={MEDIA_TYPES[0]} name="mediaType" onClick={this.onChangeMediaType} /> Plain Text
              </label>
              <label className={htmlTextButton}>
                <input type="radio" defaultChecked={this.state.form.mediaType === MEDIA_TYPES[1]} value={MEDIA_TYPES[1]} name="mediaType" onClick={this.onChangeMediaType} /> HTML
              </label>
            </div>
          </div>
          <div style={plainTextDisplay} >
            <textarea id="messageText" name="plainText" className="form-control" required={this.state.form.mediaType === MEDIA_TYPES[0]}
              value={this.state.form.plainText} onChange={this.onChangePlainText}></textarea>
            <div className="invalid-feedback" style={bodyErrorDisplay}>
              Body is required.
            </div>
          </div>
          <div style={htmlTextDisplay} >
            <TinyMceEditor
              id="htmlText"
              reset={this.state.form.reset}
              onEditorChange={this.onEditorChange}
            />
            <div className="invalid-tinymce" style={bodyErrorDisplay}>
              Body is required.
            </div>
          </div>

          <div className="mt-3 mb-3">
            <label htmlFor="attachments">Attachments</label>
          </div>
          <div className="row">
            <div className="col-sm-4">
              <Dropzone onDrop={this.onFileDrop}>
                {({getRootProps}) => (
                  <div {...getRootProps({className: 'dropzone', multiple: true})}>
                    <i className="m-sm-auto fas fa-2x fa-file-import upload-icon" alt="upload"></i>
                  </div>
                )}
              </Dropzone>
            </div>
            <div className="col-sm-8">
              <div className="dropzone-files">
                {this.state.form.files.map(file => {
                  return (
                    <div key={file.name} className="row">
                      <span className="dropzone-file">{file.name}</span>
                    </div>
                  );
                })}
              </div>
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
