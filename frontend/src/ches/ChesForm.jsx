import './ChesForm.css';
import axios from 'axios';
import bytes from 'bytes';
import React, { Component } from 'react';
import Dropzone from 'react-dropzone';
import TinyMceEditor from '../htmlText/TinyMceEditor';
import { AuthConsumer } from '../auth/AuthProvider';
import AuthService from '../auth/AuthService';
import ChesValidationError from './ChesValidationError';
import ChesAlertList from './ChesAlertList';
import AlertDisplay from '../utils/AlertDisplay';
import GetUserError from '../auth/GetUserError';
import moment from 'moment';
import { DatetimePickerTrigger } from 'rc-datetime-picker';

const CHES_ROOT = process.env.REACT_APP_CHES_ROOT || '';
const CHES_PATH = `${CHES_ROOT}/ches/v1`;
const EMAIL_URL = `${CHES_PATH}/email`;
const BODY_TYPES = ['text', 'html'];
const PRIORITIES = ['normal', 'low', 'high'];
const BODY_ENCODING = ['utf-8', 'base64', 'binary', 'hex'];
const ATTACHMENT_ENCODING = ['base64', 'binary', 'hex'];

// setting the front end to less than the backend payload, just to ensure delivery.
const SERVER_BODYLIMIT = '20mb';
const SENDER_EDITOR_ROLE = 'mssc:sender_editor';

class ChesForm extends Component {

  constructor(props) {
    super(props);

    this.authService = new AuthService();

    this.state = {
      busy: false,
      tab: 'about',
      info: '',
      error: '',
      userError: '',
      apiValidationErrors: [],
      dropWarning: '',
      hasSenderEditor: false,
      form: {
        wasValidated: false,
        sender: '',
        recipients: '',
        cc: '',
        bcc: '',
        subject: '',
        plainText: '',
        priority: PRIORITIES[0],
        htmlText: '',
        files: [],
        reset: false,
        bodyType: BODY_TYPES[0],
        moment: moment(),
        tag: ''
      },
      config: {
        attachmentsMaxSize: bytes.parse(SERVER_BODYLIMIT),
        sender: 'NR.CommonServiceShowcase@gov.bc.ca'
      }
    };

    this.formSubmit = this.formSubmit.bind(this);
    this.onChangeSender = this.onChangeSender.bind(this);
    this.onChangeSubject = this.onChangeSubject.bind(this);
    this.onChangeRecipients = this.onChangeRecipients.bind(this);
    this.onChangeCC = this.onChangeCC.bind(this);
    this.onChangeBCC = this.onChangeBCC.bind(this);
    this.onChangePlainText = this.onChangePlainText.bind(this);
    this.onChangeBodyType = this.onChangeBodyType.bind(this);
    this.onChangePriority = this.onChangePriority.bind(this);
    this.onChangeMoment = this.onChangeMoment.bind(this);
    this.onChangeTag = this.onChangeTag.bind(this);

    this.onEditorChange = this.onEditorChange.bind(this);

    this.onFileDrop = this.onFileDrop.bind(this);
    this.removeFile = this.removeFile.bind(this);
    this.onSelectTab = this.onSelectTab.bind(this);
  }

  onSelectTab(event) {
    event.preventDefault();
    if (this.state.tab !== event.target.id) {
      this.setState({ tab: event.target.id, info: '', error: '' });
    }
  }

  onChangeTag(event) {
    const form = this.state.form;
    form.tag = event.target.value;
    this.setState({ form: form, info: '' });
  }

  onChangeMoment(moment) {
    const form = this.state.form;
    form.moment = moment;
    this.setState({ form: form, info: '' });
  }

  onChangeSender(event) {
    const form = this.state.form;
    form.sender = event.target.value;
    this.setState({ form: form, info: '' });
  }

  onChangeSubject(event) {
    const form = this.state.form;
    form.subject = event.target.value;
    this.setState({ form: form, info: '' });
  }

  onChangeRecipients(event) {
    const form = this.state.form;
    form.recipients = event.target.value;
    this.setState({ form: form, info: '' });
  }

  onChangeCC(event) {
    const form = this.state.form;
    form.cc = event.target.value;
    this.setState({ form: form, info: '' });
  }

  onChangeBCC(event) {
    const form = this.state.form;
    form.bcc = event.target.value;
    this.setState({ form: form, info: '' });
  }

  onChangePlainText(event) {
    const form = this.state.form;
    form.plainText = event.target.value;
    this.setState({ form: form, info: '' });
  }

  onChangeBodyType(event) {
    const form = this.state.form;
    form.bodyType = event.target.value;
    this.setState({ form: form, info: '' });
  }

  onChangePriority(event) {
    const form = this.state.form;
    form.priority = event.target.value;
    this.setState({ form: form, info: '' });
  }

  onEditorChange(content) {
    const form = this.state.form;
    form.htmlText = content;
    this.setState({ form: form, info: '' });
  }

  getMessageBody() {
    const form = this.state.form;
    if (form.bodyType === BODY_TYPES[0]) {
      return form.plainText && form.plainText.trim();
    }
    return form.htmlText && form.htmlText.trim();
  }

  hasMessageBody() {
    return this.getMessageBody().length > 0;
  }

  getAddresses(csv) {
    if (csv && csv.trim().length > 0) {
      return csv.split(',').map(item => item.trim());
    } else {
      return [];
    }
  }

  async hasSenderEditor() {
    const user = await this.authService.getUser();
    return this.authService.hasRole(user, SENDER_EDITOR_ROLE);
  }

  getDefaultSender(hasSenderEditor) {
    return hasSenderEditor ? '' : this.state.config.sender;
  }

  errorHandler(e) {
    let error = '';
    let userError = '';
    let apiValidationErrors = [];
    if (e && e instanceof GetUserError) {
      userError = 'There appears to be an issue with login credentials.  Please logout and back in to renew your session.';
    } else if (e && e instanceof ChesValidationError) {
      apiValidationErrors = e.errors;
    } else if (e) {
      error = e.message;
    }
    return { error, userError, apiValidationErrors };
  }

  async componentDidMount() {
    try {
      const user = await this.authService.getUser();
      const hasSenderEditor = this.authService.hasRole(user, SENDER_EDITOR_ROLE);
      const form = this.state.form;
      form.sender = this.getDefaultSender(hasSenderEditor);
      this.setState({ hasSenderEditor: hasSenderEditor, form: form });
    } catch (e) {
      let { error, userError, apiValidationErrors } = this.errorHandler(e);
      this.setState({ error: error, userError, apiValidationErrors });
    }
  }

  componentWillUnmount() {
  }

  async formSubmit(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!(event.target.checkValidity() && this.hasMessageBody())) {
      let form = this.state.form;
      form.wasValidated = true;
      this.setState({ form: form, info: '' });
      return;
    }

    let messageId = undefined;
    try {

      this.setState({ busy: true });

      const postEmailData = await this.postEmail();
      messageId = postEmailData.msgId;

      let form = this.state.form;
      form.wasValidated = false;
      form.sender = this.getDefaultSender(this.state.hasSenderEditor);
      form.recipients = '';
      form.cc = '';
      form.bcc = '';
      form.subject = '';
      form.plainText = '';
      form.htmlText = '';
      form.files = [];
      form.bodyType = BODY_TYPES[0];
      form.priority = PRIORITIES[0];
      form.moment = moment();
      form.tag = '';
      form.reset = true;
      this.setState({
        busy: false,
        form: form
      });

      // this will show the info message, and prep the tinymce editor for next submit...
      // kind of lame, but event triggering and states are a bit out of wack in production (minified mode)
      form = this.state.form;
      form.reset = false;
      this.setState({
        busy: false,
        form: form,
        info: `Message submitted to Showcase CHES API: id = ${messageId}`,
        error: '',
        apiValidationErrors: []
      });

    } catch (e) {
      let form = this.state.form;
      form.wasValidated = false;
      let { error, userError, apiValidationErrors } = this.errorHandler(e);
      this.setState({
        busy: false,
        form: form,
        error: error,
        userError: userError,
        apiValidationErrors: apiValidationErrors
      });
    }

    window.scrollTo(0, 0);

  }

  async toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsBinaryString(file);
      reader.onload = () => resolve(btoa(reader.result));
      reader.onerror = error => reject(error);
    });
  }

  async convertFileToAttachment(file) {
    const content = await this.toBase64(file);
    return {
      content: content,
      contentType: file.type,
      filename: file.name,
      encoding: ATTACHMENT_ENCODING[0]
    };
  }

  async postEmail() {
    const user = await this.authService.getUser();
    const attachments = await Promise.all(this.state.form.files.map(file => this.convertFileToAttachment(file)));

    const email = {
      attachments: attachments,
      bcc: this.getAddresses(this.state.form.bcc),
      bodyType: this.state.form.bodyType,
      body: this.getMessageBody(),
      cc: this.getAddresses(this.state.form.cc),
      encoding: BODY_ENCODING[0],
      from: this.state.form.sender,
      priority: this.state.form.priority,
      to: this.getAddresses(this.state.form.recipients),
      subject: this.state.form.subject,
      delayTS: this.state.form.moment.utc().valueOf(),
      tag: this.state.form.tag
    };

    const response = await axios.post(
      EMAIL_URL,
      JSON.stringify(email),
      {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    ).catch(e => {
      if (e && e.response && e.response.status === 422) {
        throw new ChesValidationError(e.response.data);
      } else {
        throw Error('Could not deliver email to Showcase CHES API: ' + e.message);
      }
    });
    return response.data;
  }

  onFileDrop(acceptedFiles) {
    let dropWarning = '';

    const form = this.state.form;
    let files = form.files;

    const attachmentsSize = files.length === 0 ? 0 : files.map(f => f.size).reduce((a, b) => a + b);
    let attachmentsSizeAvailable = this.state.config.attachmentsMaxSize - attachmentsSize;

    // accept smaller files first...
    const acceptedFilesSortedBySize = acceptedFiles.sort((a, b) => parseFloat(a.size) - parseFloat(b.size));
    acceptedFilesSortedBySize.forEach((value) => {
      if (-1 === form.files.findIndex((f) => {
        return f.name === value.name && f.lastModified === value.lastModified && f.size === value.size;
      })) {
        if (attachmentsSizeAvailable - value.size > 0) {
          attachmentsSizeAvailable = attachmentsSizeAvailable - value.size;
          files.push(value);
        } else {
          dropWarning = `Attachments are limited to ${bytes.format(this.state.config.attachmentsMaxSize)} bytes in total size.`;
        }
      }
    });

    form.files = files;
    this.setState({ form: form, dropWarning: dropWarning });
  }

  removeFile(filename) {
    const form = this.state.form;
    const files = form.files.filter((f) => {
      return f.name !== filename;
    });
    form.files = files;
    this.setState({ form: form, dropWarning: '' });
  }

  render() {

    // set styles and classes here...
    const displayBusy = this.state.busy ? {} : { display: 'none' };
    const displayNotBusy = this.state.busy ? { display: 'none' } : {};

    const plainTextDisplay = this.state.form.bodyType === BODY_TYPES[0] ? {} : { display: 'none' };
    const plainTextButton = this.state.form.bodyType === BODY_TYPES[0] ? 'btn btn-sm btn-outline-secondary active' : 'btn btn-sm btn-outline-secondary';
    const htmlTextDisplay = this.state.form.bodyType === BODY_TYPES[1] ? {} : { display: 'none' };
    const htmlTextButton = this.state.form.bodyType === BODY_TYPES[1] ? 'btn btn-sm btn-outline-secondary active' : 'btn btn-sm btn-outline-secondary';
    const { wasValidated } = this.state.form;
    const bodyErrorDisplay = (this.state.form.wasValidated && !this.hasMessageBody()) ? {} : { display: 'none' };
    const dropWarningDisplay = (this.state.dropWarning && this.state.dropWarning.length > 0) ? {} : { display: 'none' };

    const emailTabClass = this.state.tab === 'email' ? 'nav-link active' : 'nav-link';
    const aboutTabClass = this.state.tab === 'about' ? 'nav-link active' : 'nav-link';
    const emailTabDisplay = this.state.tab === 'email' ? {} : { display: 'none' };
    const aboutTabDisplay = this.state.tab === 'about' ? {} : { display: 'none' };

    const senderPlaceholder = this.state.hasSenderEditor ? 'you@example.com' : this.state.config.sender;

    const shortcuts = {
      'Yesterday': moment().subtract(1, 'days'),
      'Today': moment(),
      'Tomorrow': moment().add(1, 'days')
    };

    return (
      <div className="container-fluid" id="maincontainer">

        <div id="mainrow" className="row">

          <div className="col-md-10 offset-md-1 order-md-1">
            <div className="text-center mt-4 mb-4" style={displayBusy}>
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
              <ChesAlertList title="CHES Validation Errors"
                message="The following validation errors were returned from CHES." alertType="danger"
                errors={this.state.apiValidationErrors} />
              <AlertDisplay alertType='success' title='CHES Service Success' message={this.state.info} />
              <AlertDisplay alertType='danger' title='CHES Service Error' message={this.state.error} />
              <AuthConsumer>
                {({ isAuthenticated }) => {
                  if (isAuthenticated()) {
                    return (
                      <AlertDisplay alertType='danger' title='Authentication Service' message={this.state.userError} />
                    );
                  }
                }}
              </AuthConsumer>
              <ul className="nav nav-tabs">
                <li className="nav-item">
                  <button className={emailTabClass} id='email' onClick={this.onSelectTab}>CHES Email</button>
                </li>
                <li className="nav-item">
                  <button className={aboutTabClass} id='about' onClick={this.onSelectTab}>About</button>
                </li>
              </ul>

              <div id="emailTab" style={emailTabDisplay}>
                <div className="mb-4"></div>
                <AuthConsumer>
                  {({ isAuthenticated }) => {
                    if (isAuthenticated()) {
                      return (<form id="emailForm" noValidate onSubmit={this.formSubmit}
                        className={wasValidated ? 'was-validated' : ''}>
                        <div className='row'>
                          <div className="mb-3 col-sm-6">
                            <label htmlFor="sender">Sender</label>
                            <input type="text" className="form-control" name="sender" placeholder={senderPlaceholder}
                              readOnly={!this.state.hasSenderEditor} required value={this.state.form.sender}
                              onChange={this.onChangeSender} />
                            <div className="invalid-feedback">
                              Email sender is required.
                            </div>
                          </div>
                          <div className="mb-3 col-sm-6">
                            <label htmlFor="recipients">Recipients</label>
                            <input type="text" className="form-control" name="recipients"
                              placeholder="you@example.com (separate multiple by comma)" required
                              value={this.state.form.recipients} onChange={this.onChangeRecipients} />
                            <div className="invalid-feedback">
                              One or more email recipients required.
                            </div>
                          </div>
                        </div>

                        <div className='row'>
                          <div className="mb-3 col-sm-6">
                            <label htmlFor="cc">CC</label>
                            <input type="text" className="form-control" name="cc"
                              placeholder="you@example.com (separate multiple by comma)"
                              value={this.state.form.cc} onChange={this.onChangeCC} />
                          </div>
                          <div className="mb-3 col-sm-6">
                            <label htmlFor="bcc">BCC</label>
                            <input type="text" className="form-control" name="bcc"
                              placeholder="you@example.com (separate multiple by comma)"
                              value={this.state.form.bcc} onChange={this.onChangeBCC} />
                          </div>
                        </div>

                        <div className="mb-3">
                          <label htmlFor="subject">Subject</label>
                          <input type="text" className="form-control" name="subject" required
                            value={this.state.form.subject}
                            onChange={this.onChangeSubject} />
                          <div className="invalid-feedback">
                            Subject is required.
                          </div>
                        </div>

                        <div className="row">
                          <div className="mb-3 col-sm-4">
                            <label htmlFor="priority">Priority</label>
                            <select className="form-control" value={this.state.form.priority}
                              onChange={this.onChangePriority}>
                              {PRIORITIES.map(p => {
                                return (
                                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                                );
                              })}
                            </select>
                          </div>
                          <div className="mb-3 col-sm-4">
                            <label htmlFor="moment">Delay Until</label>
                            <DatetimePickerTrigger
                              shortcuts={shortcuts}
                              moment={this.state.form.moment}
                              onChange={this.onChangeMoment}>
                              <input type="text" className="form-control" value={this.state.form.moment.local().format('YYYY-MM-DD HH:mm')} readOnly />
                            </DatetimePickerTrigger>
                          </div>
                          <div className="mb-3 col-sm-4">
                            <label htmlFor="moment">Tag</label>
                            <input type="text" className="form-control" name="tag"
                              placeholder="(optional) tag to aid with message search"
                              value={this.state.form.tag} onChange={this.onChangeTag} />
                          </div>
                        </div>

                        <div className="mb-3 row">
                          <div className="col-sm-4">
                            <label className="mt-1">Body</label>
                          </div>
                          <div className="col-sm-4 offset-sm-4 btn-group btn-group-toggle">
                            <label className={plainTextButton}>
                              <input type="radio" defaultChecked={this.state.form.bodyType === BODY_TYPES[0]}
                                value={BODY_TYPES[0]} name="bodyType" onClick={this.onChangeBodyType} /> Plain Text
                            </label>
                            <label className={htmlTextButton}>
                              <input type="radio" defaultChecked={this.state.form.bodyType === BODY_TYPES[1]}
                                value={BODY_TYPES[1]} name="bodyType" onClick={this.onChangeBodyType} /> HTML
                            </label>
                          </div>
                        </div>
                        <div style={plainTextDisplay}>
                          <textarea id="messageText" name="plainText" className="form-control"
                            required={this.state.form.bodyType === BODY_TYPES[0]}
                            value={this.state.form.plainText} onChange={this.onChangePlainText}></textarea>
                          <div className="invalid-feedback" style={bodyErrorDisplay}>
                            Body is required.
                          </div>
                        </div>
                        <div style={htmlTextDisplay}>
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
                          <div className="col-sm-3">
                            <Dropzone
                              onDrop={this.onFileDrop}>
                              {({ getRootProps, getInputProps }) => (
                                <div {...getRootProps({ className: 'dropzone' })}>
                                  <input type="file" multiple {...getInputProps({ className: 'dropzone-fileinput' })} />
                                  <i className="m-sm-auto fas fa-2x fa-file-pdf upload-icon" alt="upload files"></i>
                                </div>
                              )}
                            </Dropzone>
                          </div>
                          <div className="col-sm-9">
                            {this.state.form.files.map(file => {
                              return (
                                <div key={file.name} className="row">
                                  <div className="col-sm-7 dropzone-file m-auto">{file.name}</div>
                                  <div className="col-sm-1 dropzone-file m-auto">{bytes.format(file.size)}</div>
                                  <div className="col-sm-1 m-auto">
                                    <button type="button" className="btn btn-sm" onClick={() => {
                                      this.removeFile(file.name);
                                    }}><i className="far fa-trash-alt"></i></button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <div className="alert alert-warning mt-2" style={dropWarningDisplay}>
                          {this.state.dropWarning}
                        </div>
                        <hr className="mb-4" />
                        <button className="btn btn-primary btn-lg btn-block" type="submit">Send Message</button>
                      </form>);
                    } else {
                      return <div><p>You must be logged in to send emails.</p></div>;
                    }
                  }}
                </AuthConsumer>
              </div>

              <div id="aboutTab" style={aboutTabDisplay}>
                <div className="mb-4"></div>
                <h3>CHES Showcase - the Common Hosted Email Service Showcase Page</h3>
                <br />
                <p>MSSC demonstrates how an application can leverage the Common Hosted Email Service&#39;s (CHES)
                  ability to deliver emails by calling <a
                    href="https://github.com/bcgov/common-hosted-email-service.git">common-hosted-email-service</a>.</p>
                <p>The common-hosted-email-service requires a Service Client that has previously been created in the
                  environment with appropriate CHES scopes; see <a href="https://github.com/bcgov/nr-get-token">Get
                    OK</a> for more on how to get access to CHES.</p>
              </div>

            </div>
          </div>

        </div>

      </div>

    );
  }
}

export default ChesForm;
