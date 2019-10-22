import './MergeForm.css';
import axios from 'axios';
import bytes from 'bytes';
import React, {Component} from 'react';
import Dropzone from 'react-dropzone';
import TinyMceEditor from '../htmlText/TinyMceEditor';
import {AuthConsumer} from '../auth/AuthProvider';
import AuthService from '../auth/AuthService';
import ChesValidationError from './ChesValidationError';
import ChesAlertList from './ChesAlertList';
import AlertDisplay from '../utils/AlertDisplay';

import * as Constants from '../utils/Constants';
import * as ExcelUtils from '../utils/ExcelUtils';
import * as Utils from '../utils/Utils';
import MergeAbout from './MergeAbout';
import ChesSuccess from '../utils/ChesSuccess';

const CHES_ROOT = process.env.REACT_APP_CHES_ROOT || '';
const CHES_PATH = `${CHES_ROOT}/ches/v1`;
const EMAIL_MERGE_URL = `${CHES_PATH}/email/merge`;
const EMAIL_MERGE_PREVIEW_URL = `${CHES_PATH}/email/merge/preview`;

class MergeForm extends Component {

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
      transactionCsv: null,
      dropWarning: '',
      excel: {
        cols: [],
        data: [],
        headers: []
      },
      contextVariables: [],
      form: {
        wasValidated: false,
        contexts: '',
        contextsType: Constants.CONTEXTS_TYPES[0],
        sender: '',
        subject: '',
        plainText: '',
        priority: Constants.CHES_PRIORITIES[0],
        htmlText: '',
        files: [],
        reset: false,
        bodyType: Constants.CHES_BODY_TYPES[0]
      },
      preview: {
        allowed: false,
        data: [],
        index: -1,
        length: -1,
        email: {
          bodyType: '',
          body: '',
          from: '',
          subject: '',
          bcc: [],
          cc: [],
          to: []
        }
      },
      config: {
        attachmentsMaxSize: bytes.parse(Constants.CHES_SERVER_BODYLIMIT),
        sender: Constants.DEFAULT_SENDER
      }
    };

    this.formSubmit = this.formSubmit.bind(this);
    this.onChangeSender = this.onChangeSender.bind(this);
    this.onChangeSubject = this.onChangeSubject.bind(this);
    this.onChangePlainText = this.onChangePlainText.bind(this);
    this.onChangeBodyType = this.onChangeBodyType.bind(this);
    this.onChangeContextsType = this.onChangeContextsType.bind(this);
    this.onChangePriority = this.onChangePriority.bind(this);
    this.onChangeContexts = this.onChangeContexts.bind(this);

    this.onEditorChange = this.onEditorChange.bind(this);

    this.onFileDrop = this.onFileDrop.bind(this);
    this.removeFile = this.removeFile.bind(this);
    this.onSelectTab = this.onSelectTab.bind(this);
    this.onExcelFileDrop = this.onExcelFileDrop.bind(this);
    this.onExcelParsed = this.onExcelParsed.bind(this);

    this.loadPreview = this.loadPreview.bind(this);
    this.onPreviewNext = this.onPreviewNext.bind(this);
    this.onPreviewPrevious = this.onPreviewPrevious.bind(this);
  }

  onSelectTab(event) {
    event.preventDefault();
    if (this.state.tab !== event.target.id) {
      this.setState({tab: event.target.id, info: '', error: ''});
    }
  }

  onChangeSender(event) {
    const form = this.state.form;
    form.sender = event.target.value;
    this.setState({form: form, info: ''});
    const preview = this.state.preview;
    preview.allowed = this.canPreview();
    this.setState({preview: preview});
  }

  onChangeSubject(event) {
    const form = this.state.form;
    form.subject = event.target.value;
    this.setState({form: form, info: ''});
    const preview = this.state.preview;
    preview.allowed = this.canPreview();
    this.setState({preview: preview});
  }

  onChangePlainText(event) {
    const form = this.state.form;
    form.plainText = event.target.value;
    this.setState({form: form, info: ''});
    const preview = this.state.preview;
    preview.allowed = this.canPreview();
    this.setState({preview: preview});
  }

  onChangeBodyType(event) {
    const form = this.state.form;
    form.bodyType = event.target.value;
    this.setState({form: form, info: ''});
  }

  onChangeContextsType(event) {
    const form = this.state.form;
    form.contextsType = event.target.value;
    this.setState({form: form, info: ''});
  }

  onChangePriority(event) {
    const form = this.state.form;
    form.priority = event.target.value;
    this.setState({form: form, info: ''});
  }

  onChangeContexts(event) {
    const form = this.state.form;
    form.contexts = event.target.value;

    const contextVariables = ExcelUtils.contextsToVariables(form.contexts);

    this.setState({form: form, info: '', excel: {cols: [], data: [], headers: []}, contextVariables: contextVariables});

    const preview = this.state.preview;
    preview.allowed = this.canPreview();
    this.setState({preview: preview});
  }

  onEditorChange(content) {
    const form = this.state.form;
    form.htmlText = content;
    this.setState({form: form, info: ''});
    const preview = this.state.preview;
    preview.allowed = this.canPreview();
    this.setState({preview: preview});
  }

  // eslint-disable-next-line no-unused-vars
  onPreviewNext(event) {
    const preview = this.state.preview;
    const index = preview.index;
    const email = preview.email;
    try {
      preview.email = preview.data[preview.index + 1];
      preview.index += 1;
      if (!preview.email.cc) preview.email.cc = [];
      if (!preview.email.bcc) preview.email.bcc = [];
    } catch (e) {
      preview.index = index;
      preview.email = email;
    }
    this.setState({preview: preview});
  }

  // eslint-disable-next-line no-unused-vars
  onPreviewPrevious(event) {
    const preview = this.state.preview;
    const index = preview.index;
    const email = preview.email;
    try {
      preview.email = preview.data[preview.index - 1];
      preview.index -= 1;
      if (!preview.email.cc) preview.email.cc = [];
      if (!preview.email.bcc) preview.email.bcc = [];
    } catch (e) {
      preview.index = index;
      preview.email = email;
    }
    this.setState({preview: preview});
  }

  getMessageBody() {
    const form = this.state.form;
    if (form.bodyType === Constants.CHES_BODY_TYPES[0]) {
      return form.plainText && form.plainText.trim();
    }
    return form.htmlText && form.htmlText.trim();
  }

  hasMessageBody() {
    return this.getMessageBody().length > 0;
  }

  getContextsObject() {
    try {
      if (this.state.form.contexts && this.state.form.contexts.trim().length > 0) {
        return JSON.parse(this.state.form.contexts.trim());
      } else {
        return [];
      }
    } catch (e) {
      return [];
    }
  }

  validateContexts() {
    const contexts = this.getContextsObject();
    return ExcelUtils.validateContexts(contexts);
  }

  canPreview() {
    let form = this.state.form;
    return this.hasMessageBody() && this.validateContexts() && Utils.notEmpty(form.sender) && Utils.notEmpty(form.subject);
  }

  async hasSenderEditor() {
    const user = await this.getUser();
    return this.authService.hasRole(user, Constants.SENDER_EDITOR_ROLE);
  }

  getDefaultSender(hasSenderEditor) {
    return hasSenderEditor ? '' : this.state.config.sender;
  }

  async componentDidMount() {
    try {
      const user = await this.authService.getUser();
      const hasSenderEditor = this.authService.hasRole(user, Constants.SENDER_EDITOR_ROLE);
      const form = this.state.form;
      form.sender = this.getDefaultSender(hasSenderEditor);
      this.setState({hasSenderEditor: hasSenderEditor, form: form});
    } catch (e) {
      let {error, userError, apiValidationErrors} = Utils.errorHandler(e);
      this.setState({error: error, userError, apiValidationErrors});
    }
  }

  componentWillUnmount() {
  }

  async formSubmit(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!(event.target.checkValidity() && this.hasMessageBody() && this.validateContexts())) {
      let form = this.state.form;
      form.wasValidated = true;
      let error = this.validateContexts() ? '' : 'The Contexts for the mail merge are not defined correctly.  Please check the structure of the Contexts JSON.';
      this.setState({form: form, info: '', error: error});
      return;
    }

    let messageIds = [];
    try {

      this.setState({busy: true});

      const postMergeData = await this.postEmailMerge();
      messageIds = postMergeData.messages.map(d => d.msgId);
      const transactionCsv = ExcelUtils.transactionToCsv(postMergeData);

      let form = this.state.form;
      form.wasValidated = false;
      form.sender = this.getDefaultSender(this.state.hasSenderEditor);
      form.subject = '';
      form.plainText = '';
      form.htmlText = '';
      form.files = [];
      form.contexts = '';
      form.bodyType = Constants.CHES_BODY_TYPES[0];
      form.priority = Constants.CHES_PRIORITIES[0];
      form.reset = true;
      this.setState({
        busy: false,
        form: form,
        contextVariables: [],
        excel: {
          cols: [],
          data: [],
          headers: []
        },
        preview: {
          allowed: false,
          data: [],
          index: -1,
          length: -1,
          email: {
            bodyType: '',
            body: '',
            from: '',
            subject: '',
            bcc: [],
            cc: [],
            to: []
          }
        }
      });

      // this will show the info message, and prep the tinymce editor for next submit...
      // kind of lame, but event triggering and states are a bit out of wack in production (minified mode)
      form = this.state.form;
      form.reset = false;
      this.setState({
        busy: false,
        form: form,
        info: `${messageIds.length} message(s) submitted to Showcase CHES API`,
        error: '',
        userError: '',
        apiValidationErrors: [],
        transactionCsv: transactionCsv
      });

    } catch (e) {
      let form = this.state.form;
      form.wasValidated = false;
      let {error, userError, apiValidationErrors} = Utils.errorHandler(e);
      this.setState({
        busy: false,
        form: form,
        error: error,
        userError: userError,
        apiValidationErrors: apiValidationErrors,
        transactionCsv: null
      });
    }

    window.scrollTo(0, 0);

  }

  async postEmailMerge() {
    const user = await this.authService.getUser();
    const attachments = await Promise.all(this.state.form.files.map(file => Utils.convertFileToAttachment(file, Constants.CHES_ATTACHMENT_ENCODING[0])));

    const email = {
      contexts: this.getContextsObject(),
      attachments: attachments,
      bodyType: this.state.form.bodyType,
      body: this.getMessageBody(),
      encoding: Constants.CHES_BODY_ENCODING[0],
      from: this.state.form.sender,
      priority: this.state.form.priority,
      subject: this.state.form.subject
    };

    const response = await axios.post(
      EMAIL_MERGE_URL,
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

  async loadPreview(event) {
    event.preventDefault();
    event.stopPropagation();

    const preview = {
      allowed: true,
      data: [],
      index: -1,
      length: -1,
      email: {
        bodyType: '',
        body: '',
        from: '',
        subject: '',
        bcc: [],
        cc: [],
        to: []
      }
    };

    if (this.state.preview.allowed) {
      try {
        let postMergePreviewData = await this.postEmailMergePreview();
        if (postMergePreviewData && postMergePreviewData.length > 0) {
          preview.data = postMergePreviewData;
          preview.length = preview.data.length;
          preview.index = 0;
          preview.email = preview.data[0];
          if (!preview.email.cc) preview.email.cc = [];
          if (!preview.email.bcc) preview.email.bcc = [];
        }
        this.setState({
          preview: preview,
          error: '',
          userError: '',
          apiValidationErrors: []
        });
      } catch (e) {
        let form = this.state.form;
        form.wasValidated = false;
        let {error, userError, apiValidationErrors} = Utils.errorHandler(e);
        this.setState({
          busy: false,
          form: form,
          preview: preview,
          error: error,
          userError: userError,
          apiValidationErrors: apiValidationErrors
        });
      }
    }
  }

  async postEmailMergePreview() {
    const user = await this.authService.getUser();
    const email = {
      contexts: this.getContextsObject(),
      attachments: [],
      bodyType: this.state.form.bodyType,
      body: this.getMessageBody(),
      encoding: Constants.CHES_BODY_ENCODING[0],
      from: this.state.form.sender,
      priority: this.state.form.priority,
      subject: this.state.form.subject
    };

    const response = await axios.post(
      EMAIL_MERGE_PREVIEW_URL,
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
    const form = this.state.form;
    let files = form.files;
    let dropWarning = Utils.handleChesAttachments(files, this.state.config.attachmentsMaxSize, acceptedFiles);
    form.files = files;
    this.setState({form: form, dropWarning: dropWarning});
  }

  onExcelParsed(data) {
    let form = this.state.form;
    let {excel, contexts, contextVariables} = data;
    form.contexts = contexts;
    this.setState({excel: excel, form: form, contextVariables: contextVariables});
  }

  onExcelFileDrop(acceptedFiles) {

    if (acceptedFiles.length === 1) {
      try {
        const file = acceptedFiles[0];
        ExcelUtils.parseFile(file, this.onExcelParsed);
      } catch (e) {
        let form = this.state.form;
        form.contexts = '';
        this.setState({
          excel: {cols: [], headers: [], data: []},
          form: form,
          error: 'Error parsing the Contexts file, please check the structure and format of the file.'
        });
      }
    }
  }

  removeFile(filename) {
    const form = this.state.form;
    const files = form.files.filter((f) => {
      return f.name !== filename;
    });
    form.files = files;
    this.setState({form: form, dropWarning: ''});
  }

  render() {

    // set styles and classes here...
    const displayBusy = this.state.busy ? {} : {display: 'none'};
    const displayNotBusy = this.state.busy ? {display: 'none'} : {};

    const plainTextDisplay = this.state.form.bodyType === Constants.CHES_BODY_TYPES[0] ? {} : {display: 'none'};
    const plainTextButton = this.state.form.bodyType === Constants.CHES_BODY_TYPES[0] ? 'btn btn-sm btn-outline-secondary active' : 'btn btn-sm btn-outline-secondary';
    const htmlTextDisplay = this.state.form.bodyType === Constants.CHES_BODY_TYPES[1] ? {} : {display: 'none'};
    const htmlTextButton = this.state.form.bodyType === Constants.CHES_BODY_TYPES[1] ? 'btn btn-sm btn-outline-secondary active' : 'btn btn-sm btn-outline-secondary';
    const {wasValidated} = this.state.form;
    const bodyErrorDisplay = (this.state.form.wasValidated && !this.hasMessageBody()) ? {} : {display: 'none'};
    const dropWarningDisplay = (this.state.dropWarning && this.state.dropWarning.length > 0) ? {} : {display: 'none'};

    const emailTabClass = this.state.tab === 'email' ? 'nav-link active' : 'nav-link';
    const aboutTabClass = this.state.tab === 'about' ? 'nav-link active' : 'nav-link';
    const emailTabDisplay = this.state.tab === 'email' ? {} : {display: 'none'};
    const aboutTabDisplay = this.state.tab === 'about' ? {} : {display: 'none'};

    const contextsExcelDisplay = this.state.form.contextsType === Constants.CONTEXTS_TYPES[0] ? {} : {display: 'none'};
    const contextsExcelButton = this.state.form.contextsType === Constants.CONTEXTS_TYPES[0] ? 'btn btn-sm btn-outline-secondary active' : 'btn btn-sm btn-outline-secondary';
    const contextsJsonDisplay = this.state.form.contextsType === Constants.CONTEXTS_TYPES[1] ? {} : {display: 'none'};
    const contextsJsonButton = this.state.form.contextsType === Constants.CONTEXTS_TYPES[1] ? 'btn btn-sm btn-outline-secondary active' : 'btn btn-sm btn-outline-secondary';

    const senderPlaceholder = this.state.hasSenderEditor ? 'you@example.com' : this.state.config.sender;

    const previewBodyDisplay = (this.state.apiValidationErrors && this.state.apiValidationErrors.length > 0) || (this.state.error && this.state.error.length > 0) ? {display: 'none'} : {};

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
                errors={this.state.apiValidationErrors}/>
              <ChesSuccess title='CHES Service Success' transactionCsv={this.state.transactionCsv} />
              <AlertDisplay alertType='danger' title='CHES Service Error' message={this.state.error}/>
              <AuthConsumer>
                {({isAuthenticated}) => {
                  if (isAuthenticated()) {
                    return (
                      <AlertDisplay alertType='danger' title='Authentication Service' message={this.state.userError}/>
                    );
                  }
                }}
              </AuthConsumer>

              <ul className="nav nav-tabs">
                <li className="nav-item">
                  <button className={emailTabClass} id='email' onClick={this.onSelectTab}>CHES Mail Merge</button>
                </li>
                <li className="nav-item">
                  <button className={aboutTabClass} id='about' onClick={this.onSelectTab}>About</button>
                </li>
              </ul>

              <div id="emailTab" style={emailTabDisplay}>
                <div className="mb-4"/>
                <AuthConsumer>
                  {({isAuthenticated}) => {
                    if (isAuthenticated()) {
                      return (<form id="emailForm" noValidate onSubmit={this.formSubmit}
                        className={wasValidated ? 'was-validated' : ''}>
                        <div className="mb-3">
                          <label htmlFor="sender">Sender</label>
                          <input type="text" className="form-control" name="sender" placeholder={senderPlaceholder}
                            readOnly={!this.state.hasSenderEditor} required value={this.state.form.sender}
                            onChange={this.onChangeSender}/>
                          <div className="invalid-feedback">
                            Email sender is required.
                          </div>
                        </div>

                        <div className="mt-3 mb-3">
                          <label htmlFor="subject">Subject</label>
                          <input type="text" className="form-control" name="subject" required
                            value={this.state.form.subject}
                            onChange={this.onChangeSubject}/>
                          <div className="invalid-feedback">
                            Subject is required.
                          </div>
                        </div>

                        <div className="mb-3">
                          <label htmlFor="priority">Priority</label>
                          <select className="form-control col-sm-3" value={this.state.form.priority}
                            onChange={this.onChangePriority}>
                            {Constants.CHES_PRIORITIES.map(p => {
                              return (
                                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                              );
                            })}
                          </select>
                        </div>

                        <div className="mb-3 row">
                          <div className="col-sm-4">
                            <label className="mt-1">Contexts</label>
                          </div>
                          <div className="col-sm-4 offset-sm-4 btn-group btn-group-toggle">
                            <label className={contextsExcelButton}>
                              <input type="radio"
                                defaultChecked={this.state.form.contextsType === Constants.CONTEXTS_TYPES[0]}
                                value={Constants.CONTEXTS_TYPES[0]} name="contextsType"
                                onClick={this.onChangeContextsType}/> Excel
                            </label>
                            <label className={contextsJsonButton}>
                              <input type="radio"
                                defaultChecked={this.state.form.contextsType === Constants.CONTEXTS_TYPES[1]}
                                value={Constants.CONTEXTS_TYPES[1]} name="contextsType"
                                onClick={this.onChangeContextsType}/> JSON
                            </label>
                          </div>
                        </div>
                        <div className="row" style={contextsExcelDisplay}>
                          <div className="col-sm-2">
                            <Dropzone
                              onDrop={this.onExcelFileDrop}
                              accept="text/csv,.xls,application/msexcel,application/excel,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">
                              {({getRootProps, getInputProps}) => (
                                <div {...getRootProps({className: 'dropzone-excel'})}>
                                  <input type="file" multiple {...getInputProps({className: 'dropzone-fileinput'})} />
                                  <i className="m-sm-auto fas fa-2x fa-file-excel upload-icon" alt="upload xlsx"/>
                                </div>
                              )}
                            </Dropzone>
                          </div>
                          <div className="col-sm-10">
                            <div className="table-responsive contexts-table">
                              <table className="table table-striped table-ellipsis">
                                {this.state.excel.headers.map((r, i) => <thead key={i}>{this.state.excel.cols.map(c =>
                                  <th key={c.key}>{r[c.key]}</th>)}</thead>)}
                                <tbody>
                                  {this.state.excel.data.map((r, i) => <tr key={i}>{this.state.excel.cols.map(c => <td
                                    key={c.key}>{r[c.key]}</td>)}</tr>)}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                        <div style={contextsJsonDisplay}>
                          <textarea id="contextsText" name="contextsText" className="form-control"
                            value={this.state.form.contexts} onChange={this.onChangeContexts}/>
                        </div>

                        <div className="mt-3 mb-3 row">
                          <div className="col-sm-4">
                            <label className="mt-1">Body</label>
                          </div>
                          <div className="col-sm-4 offset-sm-4 btn-group btn-group-toggle">
                            <label className={plainTextButton}>
                              <input type="radio" defaultChecked={this.state.form.bodyType === Constants.CHES_BODY_TYPES[0]}
                                value={Constants.CHES_BODY_TYPES[0]} name="bodyType"
                                onClick={this.onChangeBodyType}/> Plain Text
                            </label>
                            <label className={htmlTextButton}>
                              <input type="radio" defaultChecked={this.state.form.bodyType === Constants.CHES_BODY_TYPES[1]}
                                value={Constants.CHES_BODY_TYPES[1]} name="bodyType"
                                onClick={this.onChangeBodyType}/> HTML
                            </label>
                          </div>
                        </div>
                        <div className="row" style={plainTextDisplay}>
                          <div className="col-sm-2 variables-sidebar">
                            <div className="table-responsive">
                              <table className="table">
                                <thead>
                                  <th>Variables</th>
                                </thead>
                                <tbody>
                                  {this.state.contextVariables.map((r, i) => <tr key={i}>
                                    <td key={i}>{r}</td>
                                  </tr>)}
                                </tbody>
                              </table>
                            </div>
                          </div>
                          <div className="col-sm-10">
                            <textarea id="messageText" name="plainText" className="form-control"
                              required={this.state.form.bodyType === Constants.CHES_BODY_TYPES[0]}
                              value={this.state.form.plainText} onChange={this.onChangePlainText}/>
                          </div>
                          <div className="invalid-feedback" style={bodyErrorDisplay}>
                            Body is required.
                          </div>
                        </div>
                        <div className="row" style={htmlTextDisplay}>
                          <div className="col-sm-2 variables-sidebar">
                            <div className="table-responsive">
                              <table className="table">
                                <thead>
                                  <th>Variables</th>
                                </thead>
                                <tbody>
                                  {this.state.contextVariables.map((r, i) => <tr key={i}>
                                    <td key={i}>{r}</td>
                                  </tr>)}
                                </tbody>
                              </table>
                            </div>
                          </div>
                          <div className="col-sm-10">
                            <TinyMceEditor
                              id="htmlText"
                              reset={this.state.form.reset}
                              onEditorChange={this.onEditorChange}
                            />
                          </div>
                          <div className="invalid-tinymce" style={bodyErrorDisplay}>
                            Body is required.
                          </div>
                        </div>

                        <div className="mt-3 mb-3">
                          <label htmlFor="attachments">Attachments</label>
                        </div>
                        <div className="row">
                          <div className="col-sm-2">
                            <Dropzone
                              onDrop={this.onFileDrop}>
                              {({getRootProps, getInputProps}) => (
                                <div {...getRootProps({className: 'dropzone'})}>
                                  <input type="file" multiple {...getInputProps({className: 'dropzone-fileinput'})} />
                                  <i className="m-sm-auto fas fa-2x fa-file-pdf upload-icon" alt="upload files"/>
                                </div>
                              )}
                            </Dropzone>
                          </div>
                          <div className="col-sm-10">
                            {this.state.form.files.map(file => {
                              return (
                                <div key={file.name} className="row">
                                  <div className="col-sm-7 dropzone-file m-auto">{file.name}</div>
                                  <div className="col-sm-1 dropzone-file m-auto">{bytes.format(file.size)}</div>
                                  <div className="col-sm-1 m-auto">
                                    <button type="button" className="btn btn-sm" onClick={() => {
                                      this.removeFile(file.name);
                                    }}><i className="far fa-trash-alt"/></button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <div className="alert alert-warning mt-2" style={dropWarningDisplay}>
                          {this.state.dropWarning}
                        </div>
                        <hr className="mb-4"/>
                        <div className="row">
                          <div className="col-sm-6">
                            <button type="button" className="btn btn-info btn-lg btn-block" data-toggle="modal"
                              data-target="#previewModal" disabled={!this.state.preview.allowed}
                              onClick={this.loadPreview}>
                              Preview
                            </button>
                          </div>
                          <div className="col-sm-6">
                            <button className="btn btn-primary btn-lg btn-block" type="submit">Send Message</button>
                          </div>
                        </div>
                        <div className="modal fade" id="previewModal" tabIndex="-1" role="dialog"
                          aria-labelledby="previewModalLabel" aria-hidden="true">
                          <div className="modal-dialog" role="document">
                            <div className="modal-content">
                              <div className="modal-header">
                                <div className="container">
                                  <div className="row">
                                    <div className="col-sm-6">
                                      <h5 className="modal-title" id="previewModalLabel">Email Merge Preview</h5>
                                    </div>
                                    <div className="offset-sm-1 col-sm-2">
                                      <button type="button" className="btn btn-info btn-lg btn-block"
                                        disabled={this.state.preview.index === -1 || (this.state.preview.index <= 0)}
                                        onClick={this.onPreviewPrevious}>&lt;</button>
                                    </div>
                                    <div className="col-sm-2">
                                      <button type="button" className="btn btn-info btn-lg btn-block"
                                        disabled={this.state.preview.index === -1 || (this.state.preview.index >= this.state.preview.length - 1)}
                                        onClick={this.onPreviewNext}>&gt;</button>
                                    </div>
                                    <div className="col-sm-1">
                                      <button type="button" className="close btn btn-lg btn-block" data-dismiss="modal"
                                        aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="modal-body">
                                <div>
                                  <ChesAlertList title="CHES Validation Errors"
                                    message="The following validation errors were returned from CHES."
                                    alertType="danger" errors={this.state.apiValidationErrors}/>
                                  <AlertDisplay alertType='success' title='CHES Service Success'
                                    message={this.state.info}/>
                                  <AlertDisplay alertType='danger' title='CHES Service Error'
                                    message={this.state.error}/>
                                  <div style={previewBodyDisplay}>
                                    <div className="row">
                                      <div className="mb-3 col-sm-6">
                                        <label>Sender</label>
                                        <input type="text" className="form-control"
                                          value={this.state.preview.email.from}
                                          readOnly={true}/>
                                      </div>

                                      <div className="mb-3 col-sm-6">
                                        <label>Recipients</label>
                                        <input type="text" className="form-control"
                                          value={this.state.preview.email.to.join(',')} readOnly={true}/>
                                      </div>
                                    </div>
                                    <div className="row">
                                      <div className="mb-3 col-sm-6">
                                        <label>CC</label>
                                        <input type="text" className="form-control"
                                          value={this.state.preview.email.cc.join(',')} readOnly={true}/>
                                      </div>

                                      <div className="mb-3 col-sm-6">
                                        <label>BCC</label>
                                        <input type="text" className="form-control"
                                          value={this.state.preview.email.bcc.join(',')} readOnly={true}/>
                                      </div>
                                    </div>

                                    <div className="mb-3">
                                      <label htmlFor="subject">Subject</label>
                                      <input type="text" className="form-control" required
                                        value={this.state.preview.email.subject} readOnly={true}/>
                                    </div>

                                    <div className="mb-3" style={plainTextDisplay}>
                                      <label className="mt-1">Body</label>
                                      <textarea id="previewBodyText" className="form-control"
                                        value={this.state.preview.email.body} readOnly={true}/>
                                    </div>

                                    <div className="mb-3" style={htmlTextDisplay}>
                                      <label className="mt-1">Body</label>
                                      <div id="previewBodyHtml"
                                        dangerouslySetInnerHTML={{__html: `${this.state.preview.email.body}`}}/>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="modal-footer">
                                <div className="container">
                                  <div className="row">
                                    <div className="col-sm-3">
                                      <button type="button" className="btn btn-info btn-lg btn-block"
                                        disabled={this.state.preview.index === -1 || (this.state.preview.index <= 0)}
                                        onClick={this.onPreviewPrevious}>Previous
                                      </button>
                                    </div>
                                    <div className="col-sm-3">
                                      <button type="button" className="btn btn-info btn-lg btn-block"
                                        disabled={this.state.preview.index === -1 || (this.state.preview.index >= this.state.preview.length - 1)}
                                        onClick={this.onPreviewNext}>Next
                                      </button>
                                    </div>
                                    <div className="offset-sm-3 col-sm-3">
                                      <button type="button" className="btn btn-primary btn-lg btn-block"
                                        data-dismiss="modal">Close
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </form>);
                    } else {
                      return <div><p>You must be logged in to send emails.</p></div>;
                    }
                  }}
                </AuthConsumer>
              </div>

              <div id="aboutTab" style={aboutTabDisplay}>
                <MergeAbout />
              </div>
            </div>

          </div>

        </div>

      </div>

    );
  }
}

export default MergeForm;
