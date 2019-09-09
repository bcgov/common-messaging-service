import React, {Component} from 'react';
import './EmailForm.css';
import TinyMceEditor from '../htmlText/TinyMceEditor';
import Dropzone from 'react-dropzone';
import AuthService from '../auth/AuthService';
import axios from 'axios';
import bytes from 'bytes';
import { AuthConsumer } from '../auth/AuthProvider';

const API_ROOT = process.env.REACT_APP_API_ROOT || '';
const MSG_SERVICE_PATH = `${API_ROOT}/api/v1`;
// email message media types: we are allowed to send the body of the email as html or plain text
const MEDIA_TYPES = ['text/plain', 'text/html'];
const SENDER_EDITOR_ROLE = 'mssc:sender_editor';

class EmailForm extends Component {


  constructor(props) {
    super(props);

    this.authService = new AuthService();

    this.state = {
      busy: false,
      healthCheck: {
        credentialsGood: false,
        credentialsAuthenticated: false,
        hasTopLevel: false,
        hasCreateMessage: false,
        cmsgApiHealthy: false,
      },
      tab: 'sc',
      messageIds: [],
      statuses: [],
      info: '',
      error: '',
      dropWarning: '',
      hasSenderEditor: false,
      form: {
        wasValidated: false,
        sender: '',
        recipients: '',
        subject: '',
        plainText: '',
        htmlText: '',
        files: [],
        reset: false,
        mediaType: MEDIA_TYPES[0]
      },
      config: {
        attachmentsMaxSize: bytes.parse('5mb'),
        attachmentsMaxFiles: 3,
        attachmentsAcceptedType: '.pdf',
        sender: 'NR.CommonServiceShowcase@gov.bc.ca'
      }
    };

    this.formSubmit = this.formSubmit.bind(this);
    this.onChangeSender = this.onChangeSender.bind(this);
    this.onChangeSubject = this.onChangeSubject.bind(this);
    this.onChangeRecipients = this.onChangeRecipients.bind(this);
    this.onChangePlainText = this.onChangePlainText.bind(this);
    this.onChangeMediaType = this.onChangeMediaType.bind(this);

    this.onEditorChange = this.onEditorChange.bind(this);
    this.onFileDrop = this.onFileDrop.bind(this);

    this.removeFile = this.removeFile.bind(this);

    this.onSelectTab = this.onSelectTab.bind(this);
  }

  onSelectTab(event) {
    event.preventDefault();
    if (this.state.tab !== event.target.id) {
      this.setState({tab: event.target.id, info: '', error: ''});
    }
  }

  onChangeSender(event) {
    let form = this.state.form;
    form.sender = event.target.value;
    this.setState({form: form, info: ''});
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

  async hasSenderEditor() {
    let user = await this.authService.getUser();
    return this.authService.hasRole(user, SENDER_EDITOR_ROLE);
  }

  getDefaultSender(hasSenderEditor) {
    return hasSenderEditor ? '' : this.state.config.sender;
  }

  async componentDidMount() {
    let {credentialsGood, credentialsAuthenticated, hasTopLevel, hasCreateMessage, cmsgApiHealthy} = false;
    try {
      this.setState({busy: true});


      let health = await this.healthCheck();
      let {credentialsGood, credentialsAuthenticated, hasTopLevel, hasCreateMessage, cmsgApiHealthy} = health.data.cmsg;

      let config = await this.getConfig();
      let {fileSize, fileCount, fileType} = config.data.attachments;
      let {defaultSender} = config.data;

      let tab = (credentialsGood && credentialsAuthenticated  && hasTopLevel  && hasCreateMessage  && cmsgApiHealthy) ? 'about' : 'sc';

      let user = await this.authService.getUser();
      let hasSenderEditor = this.authService.hasRole(user, SENDER_EDITOR_ROLE);

      let form = this.state.form;
      form.sender = this.getDefaultSender(hasSenderEditor);

      this.setState({
        busy: false,
        tab: tab,
        form: form,
        hasSenderEditor: hasSenderEditor,
        healthCheck: {
          credentialsGood: credentialsGood,
          credentialsAuthenticated: credentialsAuthenticated,
          hasTopLevel: hasTopLevel,
          hasCreateMessage: hasCreateMessage,
          cmsgApiHealthy: cmsgApiHealthy
        },
        config: {
          attachmentsMaxSize: parseInt(fileSize),
          attachmentsMaxFiles: parseInt(fileCount),
          attachmentsAcceptedType: fileType.startsWith('.') ? fileType : '.'.concat(fileType),
          sender: defaultSender
        }
      });

      // every minute, do a health check, and let's go get the status of messages we've sent this session.
      // could certainly do more work to no longer fetch items that are gateway delivered, but it's just a simple demo.

      this.interval = setInterval(async () => {
        await this.healthCheckTab();

        let messageIds = this.state.messageIds || [];
        let statuses = this.state.statuses || [];
        try {
          await this.asyncForEach(messageIds, async (id) => {
            let statusResponse = await this.fetchStatus(id);
            statusResponse.data.statuses.forEach(s => {
              let status = s;
              // don't add it to list of results if it's already there (same message, same recipient, same type of status)
              if (!statuses.find(x => { return x.messageId === s.messageId && x.recipient === s.recipient && x.type === s.type; })) {
                status.key = Math.random().toString(36);
                statuses.unshift(status);
              }
            });

          });
          // update the table data, take them to the status tab
          this.setState({statuses: statuses, info: '', error: '', tab: 'status'});

        } catch (err) {
          this.setState({statuses: statuses, info: '', error: err.message, tab: 'status'});
        }
      }, 60000);

    } catch (e) {
      this.setState({
        busy: false,
        tab: 'sc',
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

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  async healthCheck() {
    const response = await fetch(`${MSG_SERVICE_PATH}/health`);
    if (!response.ok) {
      throw Error('Could not connect to Showcase Messaging API for health check: ' + response.statusText);
    }
    return await response.json().catch(error => {
      throw Error(error.message);
    });
  }

  async healthCheckTab() {
    try {
      let health = await this.healthCheck();
      let {credentialsGood, credentialsAuthenticated, hasTopLevel, hasCreateMessage, cmsgApiHealthy} = health.data.cmsg;
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
          credentialsGood: false,
          credentialsAuthenticated: false,
          hasTopLevel: false,
          hasCreateMessage: false,
          cmsgApiHealthy: false
        },
        error: e.message
      });
    }
  }

  async getConfig() {
    const response = await fetch(`${MSG_SERVICE_PATH}/config`);
    if (!response.ok) {
      throw Error('Could not connect to Showcase Messaging API for configuration: ' + response.statusText);
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
    let messageIds = this.state.messageIds;
    let statuses = this.state.statuses;
    let messageId = undefined;
    try {
      if (this.state.healthCheck.hasCreateMessage) {
        this.setState({busy: true});
        let filenames = await this.uploadFiles();
        let postEmailData = await this.postEmail(filenames);

        messageId = postEmailData.data.messageId;
        messageIds.push(messageId);

        // a single status response returns an email status for each recipient
        // break it down to a row item per msg & recipient
        let statusResponse = await this.fetchStatus(messageId);
        statusResponse.data.statuses.forEach(s => {
          let status = s;
          status.key = Math.random().toString(36); //need a display key for rendering
          statuses.unshift(status);
        });

        let form = this.state.form;
        form.wasValidated = false;
        form.sender = this.getDefaultSender(this.state.hasSenderEditor);
        form.recipients = '';
        form.subject = '';
        form.plainText = '';
        form.htmlText = '';
        form.files = [];
        form.mediaType = MEDIA_TYPES[0];
        form.reset = true;
        this.setState({
          busy:false,
          form: form,
          messageIds,
          statuses: statuses
        });
      }
      // this will show the info message, and prep the tinymce editor for next submit...
      // kind of lame, but event triggering and states are a bit out of wack in production (minified mode)
      let form = this.state.form;
      form.reset = false;
      this.setState({
        busy: false,
        form: form,
        info: `Message submitted to Showcase Messaging API: id = ${messageId}`,
        error: '',
        messageIds,
        statuses: statuses
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
    if (!this.state.form.files || this.state.form.files.length === 0) {
      return [];
    }

    let user = await this.authService.getUser();

    const data = new FormData();
    for (const file of this.state.form.files) {
      data.append('files', file, file.name);
    }

    const response = await axios.post(
      `${MSG_SERVICE_PATH}/uploads`,
      data,
      {
        headers: {
          'Authorization':`Bearer ${user.access_token}`,
          'Content-Type':'application/json'
        }
      }
    ).catch(e => {
      throw Error('Could not upload files to Showcase Messaging API: ' + e.message);
    });

    return response.data.data.files;
  }

  async postEmail(filenames) {
    let user = await this.authService.getUser();

    const email  = {
      mediaType: this.state.form.mediaType,
      sender: this.state.form.sender,
      subject: this.state.form.subject,
      message: this.getMessageBody(),
      recipients: this.state.form.recipients,
      filenames: filenames
    };

    const response = await axios.post(
      `${MSG_SERVICE_PATH}/email`,
      JSON.stringify(email),
      {
        headers: {
          'Authorization':`Bearer ${user.access_token}`,
          'Content-Type':'application/json'
        }
      }
    ).catch(e => {
      throw Error('Could not deliver email to Showcase Messaging API: ' + e.message);
    });
    return response.data;
  }

  async fetchStatus(messageId) {
    let user = await this.authService.getUser();

    const response = await axios.get(`${MSG_SERVICE_PATH}/email/${messageId}/status`,{
      headers: {
        'Authorization':`Bearer ${user.access_token}`,
        'Content-Type':'application/json'
      }
    }).catch(e => {
      throw Error('Could not connect to Showcase Messaging API for email status check: ' + e.message);
    });
    return response.data;
  }

  async asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }

  async refreshStatuses() {
    let messageIds = this.state.messageIds || [];
    let statuses = this.state.statuses || [];
    await this.asyncForEach(messageIds, async (id) => {
      let statusResponse = await this.fetchStatus(id);
      statusResponse.data.statuses.forEach(s => {
        let status = s;
        status.key = Math.random().toString(36);
        statuses.unshift(status);
      });

    });
    this.setState({messageIds: messageIds, statuses: statuses});
  }

  onFileDrop(acceptedFiles) {
    let dropWarning = `Attachments are limited to ${this.state.config.attachmentsMaxFiles} total files of type ${this.state.config.attachmentsAcceptedType} and under ${bytes.format(this.state.config.attachmentsMaxSize)} in size.`;
    let form = this.state.form;
    let files = form.files;
    acceptedFiles.forEach((value) => {
      if (-1 === form.files.findIndex((f) => { return f.name === value.name && f.lastModified === value.lastModified && f.size === value.size; })) {
        files.push(value);
      }
    });

    if (acceptedFiles.length > 0 && files.length <= this.state.config.attachmentsMaxFiles) {
      // dropped in valid files, and we kept it under the desired number
      dropWarning = '';
    }
    form.files = files.slice(0, this.state.config.attachmentsMaxFiles);
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

    const emailTabClass = this.state.tab === 'email' ? 'nav-link active' : 'nav-link';
    const statusTabClass = this.state.tab === 'status' ? 'nav-link active' : 'nav-link';
    const scTabClass = this.state.tab === 'sc' ? 'nav-link active' : 'nav-link';
    const aboutTabClass = this.state.tab === 'about' ? 'nav-link active' : 'nav-link';
    const emailTabDisplay = this.state.tab === 'email' ? {} : {display: 'none'};
    const statusTabDisplay = this.state.tab === 'status' ? {} : {display: 'none'};
    const scTabDisplay = this.state.tab === 'sc' ? {} : {display: 'none'};
    const aboutTabDisplay = this.state.tab === 'about' ? {} : {display: 'none'};

    return (
      <div className="container" id="maincontainer" >

        <div id="mainrow" className="row">

          <div className="col-md-8 offset-md-2 order-md-1">

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
              <div className="alert alert-success" style={successDisplay}>
                {this.state.info}
              </div>
              <div className="alert alert-danger" style={errorDisplay}>
                {this.state.error}
              </div>

              <ul className="nav nav-tabs">
                <li className="nav-item">
                  <button className={emailTabClass} id='email' onClick={this.onSelectTab}>CMSG Email</button>
                </li>
                <li className="nav-item">
                  <button className={statusTabClass} id='status' onClick={this.onSelectTab}>Statuses</button>
                </li>
                <li className="nav-item">
                  <button className={scTabClass} id='sc' onClick={this.onSelectTab}>Service Client</button>
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
                      return (<form id="emailForm" noValidate style={emailFormDisplay} onSubmit={this.formSubmit}
                        className={wasValidated ? 'was-validated' : ''}>
                        <div className="mb-3">
                          <label htmlFor="sender">Sender</label>
                          <input type="text" className="form-control" name="sender" placeholder={this.state.config.sender}
                            readOnly={!this.state.hasSenderEditor} required value={this.state.form.sender} onChange={this.onChangeSender}/>
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
                          <div className="col-sm-3">
                            <Dropzone
                              onDrop={this.onFileDrop}
                              accept={this.state.config.attachmentsAcceptedType}
                              maxSize={this.state.config.attachmentsMaxSize}>
                              {({getRootProps, getInputProps}) => (
                                <div {...getRootProps({className: 'dropzone'})}>
                                  <input type="file" multiple {...getInputProps({className: 'dropzone-fileinput'})} />
                                  <i className="m-sm-auto fas fa-2x fa-file-pdf upload-icon" alt="upload pdf"></i>
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
                      </form>);
                    } else {
                      return <div><p>You must be logged in to send emails and review message statuses.</p></div>;
                    }
                  }}
                </AuthConsumer>
              </div>

              <div id="statusTab" style={statusTabDisplay}>
                <div className="mb-4"></div>
                <AuthConsumer>
                  {({ isAuthenticated }) => {
                    if (isAuthenticated()) {
                      return (
                        <div id="messageStatuses">
                          <div className="table-responsive-sm">
                            <table className="table table-striped table-sm">
                              <thead>
                                <tr>
                                  <th>Message ID</th>
                                  <th>Recipient</th>
                                  <th>Status</th>
                                </tr>
                              </thead>
                              <tbody>
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
                            </table>
                          </div>
                        </div>);
                    } else {
                      return <div><p>You must be logged in to send emails and review message statuses.</p></div>;
                    }
                  }}
                </AuthConsumer>
              </div>

              <div id="scTab" style={scTabDisplay}>
                <div className="mb-4"></div>
                <div id="healthCheck">
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
              </div>

              <div id="aboutTab" style={aboutTabDisplay}>
                <div className="mb-4"></div>
                <h3>Welcome to MSSC - the Common Messaging Service Showcase Application</h3>
                <br/>
                <p>MSSC demonstrates how an application can leverage the Common Messaging Service&#39;s (CMSG) ability to deliver emails by calling <a href="https://github.com/bcgov/nr-email-microservice">nr-email-microservice</a>.
                The <em>nr-email-microservice</em> illustrates how to call the CMSG API, and shows how a team can easily stand up their own CMSG service in OpenShift.</p>
                <p>The nr-email-microservice requires a Service Client that has previously been created in the environment with appropriate CMSG scopes; see <a href="https://github.com/bcgov/nr-get-token">Get OK</a> for more on how to get access to CMSG.</p>
              </div>

            </div>

          </div>

        </div>

      </div>

    );
  }
}

export default EmailForm;
