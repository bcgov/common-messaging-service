import React, {Component} from 'react';
import './EmailForm.css';
import TinyMceEditor from '../htmlText/TinyMceEditor';
import Dropzone from 'react-dropzone';

const MSG_SERVICE_PATH = '/mssc/v1';
// email message media types: we are allowed to send the body of the email as html or plain text
const MEDIA_TYPES = ['text/plain', 'text/html'];

// attachments limiting.
// let's limit the file size and file count(match what our server will accept - arbitrary)
// and we should limit the file type because the Common Messaging API currently only accepts pdf.
const ATTACHMENTS_ACCEPTED_TYPE = '.pdf';
const ATTACHMENTS_MAX_SIZE = 5242880;
const ATTACHMENTS_MAX_FILES = 3;

class EmailForm extends Component {

  constructor(props) {
    super(props);

    this.state = {
      busy: false,
      healthCheck: {
        credentialsGood: false,
        credentialsAuthenticated: false,
        hasTopLevel: false,
        hasCreateMessage: false,
        cmsgApiHealthy: false,
      },
      info: '',
      error: '',
      dropWarning: '',
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

    this.removeFile = this.removeFile.bind(this);
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
      this.setState({busy: true});

      let data = await this.healthCheck();
      let {credentialsGood, credentialsAuthenticated, hasTopLevel, hasCreateMessage, cmsgApiHealthy} = data;

      this.setState({
        busy: false,
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
        busy: false,
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
        this.setState({busy: true});
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
          busy:false,
          form: form
        });
      }
      // this will show the info message, and prep the tinymce editor for next submit...
      // kind of lame, but event triggering and states are a bit out of wack in production (minified mode)
      let form = this.state.form;
      form.reset = false;
      this.setState({
        busy: false,
        form: form,
        info: 'Message submitted to Showcase Messaging API'
      });
    } catch (e) {
      let form = this.state.form;
      form.wasValidated = false;
      this.setState({
        busy: false,
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
    let dropWarning = `Attachments are limited to ${ATTACHMENTS_MAX_FILES} total files of type ${ATTACHMENTS_ACCEPTED_TYPE} and under ${ATTACHMENTS_MAX_SIZE} bytes in size.`;
    let form = this.state.form;
    let files = form.files;
    acceptedFiles.forEach((value) => {
      if (-1 === form.files.findIndex((f) => { return f.name === value.name && f.lastModified === value.lastModified && f.size === value.size; })) {
        files.push(value);
      }
    });

    if (acceptedFiles.length > 0 && files.length <= ATTACHMENTS_MAX_FILES) {
      // dropped in valid files, and we kept it under the desired number
      dropWarning = '';
    }
    form.files = files.slice(0, ATTACHMENTS_MAX_FILES);
    this.setState({form: form, dropWarning: dropWarning});
  }

  removeFile(filename) {
    let form = this.state.form;
    let files = form.files.filter((f) => { return f.name !== filename; });
    form.files = files;
    this.setState({form: form});
  }

  render() {

    // set styles and classes here...
    const displayBusy = this.state.busy ? {} : {display: 'none'};
    const displayNotBusy = this.state.busy ? {display: 'none'} : {};

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
    const dropWarningDisplay = (this.state.dropWarning && this.state.dropWarning.length > 0) ? {} : {display: 'none'};

    return (
      <div className="col-md-8 offset-md-2 order-md-1">

        <div className="text-center" style={displayBusy}>
          <div className="spinner-grow text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <div className="spinner-grow text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <div className="spinner-grow text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>

        <div style={displayNotBusy}>
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
              <div className="col-sm-10 hc-text">Service Client credentials</div>
              <div className="col-sm-2"><span id="credentialsInd" className={credentialsIndClass}></span></div>
            </div>
            <div className="row">
              <div className="col-sm-10 hc-text">Service Client has access to Common Messaging API</div>
              <div className="col-sm-2"><span id="apiAccessInd" className={apiAccessIndClass}></span></div>
            </div>
            <div className="row">
              <div className="col-sm-10 hc-text">Service Client can send message</div>
              <div className="col-sm-2"><span id="createMsgInd" className={createMsgIndClass}></span></div>
            </div>
            <div className="row">
              <div className="col-sm-10 hc-text">Common Messaging API available</div>
              <div className="col-sm-2"><span id="healthCheckInd" className={healthCheckIndClass}></span></div>
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
                <Dropzone
                  onDrop={this.onFileDrop}
                  accept={ATTACHMENTS_ACCEPTED_TYPE}
                  maxSize={ATTACHMENTS_MAX_SIZE}>
                  {({getRootProps, getInputProps}) => (
                    <div {...getRootProps({className: 'dropzone'})}>
                      <input type="file" multiple {...getInputProps({className: 'dropzone-fileinput'})} />
                      <i className="m-sm-auto fas fa-2x fa-file-pdf upload-icon" alt="upload pdf"></i>
                    </div>
                  )}
                </Dropzone>
              </div>
              <div className="col-sm-8">
                {this.state.form.files.map(file => {
                  return (
                    <div key={file.name} className="row">
                      <div className="col-sm-7 dropzone-file m-auto">{file.name}</div>
                      <div className="col-sm-1 m-auto"><button type="button" className="btn btn-sm" onClick={() => { this.removeFile(file.name); }}><i className="far fa-trash-alt"></i></button></div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="alert alert-warning mt-2" style={dropWarningDisplay}>
              {this.state.dropWarning}
            </div>
            <hr className="mb-4"/>
            <button className="btn btn-primary btn-lg btn-block" type="submit">Send Message</button>
          </form>
        </div>
      </div>
    );
  }
}

export default EmailForm;
