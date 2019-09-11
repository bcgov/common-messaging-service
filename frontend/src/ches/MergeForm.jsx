import './MergeForm.css';
import axios from 'axios';
import bytes from 'bytes';
import React, {Component} from 'react';
import Dropzone from 'react-dropzone';
import TinyMceEditor from '../htmlText/TinyMceEditor';
import {AuthConsumer} from '../auth/AuthProvider';
import XLSX from 'xlsx';
import AuthService from '../auth/AuthService';

const CHES_ROOT = process.env.REACT_APP_CHES_ROOT || '';
const CHES_PATH = `${CHES_ROOT}/ches/v1`;
const EMAIL_MERGE_URL = `${CHES_PATH}/email/merge`;
const EMAIL_MERGE_PREVIEW_URL = `${CHES_PATH}/email/merge/preview`;
const BODY_TYPES = ['text', 'html'];
const PRIORITIES = ['normal', 'low', 'high'];
const BODY_ENCODING = ['utf-8', 'base64', 'binary', 'hex'];
const ATTACHMENT_ENCODING = ['base64', 'binary', 'hex'];

const CONTEXTS_TYPES = ['xlsx', 'json'];

// setting the front end to less than the backend payload, just to ensure delivery.
const SERVER_BODYLIMIT = '20mb';
const SENDER_EDITOR_ROLE = 'mssc:sender_editor';

class MergeForm extends Component {

  constructor(props) {
    super(props);

    this.authService = new AuthService();

    this.state = {
      busy: false,
      tab: 'about',
      info: '',
      error: '',
      dropWarning: '',
      excel: {
        cols: [],
        data: [],
        headers: [],
        variables: []
      },
      form: {
        wasValidated: false,
        contexts: '',
        contextsType: CONTEXTS_TYPES[0],
        sender: '',
        subject: '',
        plainText: '',
        priority: PRIORITIES[0],
        htmlText: '',
        files: [],
        reset: false,
        bodyType: BODY_TYPES[0]
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
        attachmentsMaxSize: bytes.parse(SERVER_BODYLIMIT),
        sender: 'NR.CommonServiceShowcase@gov.bc.ca'
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
    let form = this.state.form;
    form.sender = event.target.value;
    this.setState({form: form, info: ''});
    let preview = this.state.preview;
    preview.allowed = this.canPreview();
    this.setState({preview: preview});
  }

  onChangeSubject(event) {
    let form = this.state.form;
    form.subject = event.target.value;
    this.setState({form: form, info: ''});
    let preview = this.state.preview;
    preview.allowed = this.canPreview();
    this.setState({preview: preview});
  }

  onChangePlainText(event) {
    let form = this.state.form;
    form.plainText = event.target.value;
    this.setState({form: form, info: ''});
    let preview = this.state.preview;
    preview.allowed = this.canPreview();
    this.setState({preview: preview});
  }

  onChangeBodyType(event) {
    let form = this.state.form;
    form.bodyType = event.target.value;
    this.setState({form: form, info: ''});
  }

  onChangeContextsType(event) {
    let form = this.state.form;
    form.contextsType = event.target.value;
    this.setState({form: form, info: ''});
  }

  onChangePriority(event) {
    let form = this.state.form;
    form.priority = event.target.value;
    this.setState({form: form, info: ''});
  }

  onChangeContexts(event) {
    let form = this.state.form;
    form.contexts =  event.target.value;
    let excel = this.state.excel;
    excel = {cols: [], data: [], headers: []};
    this.setState({form: form, info: '', excel: excel});
    let preview = this.state.preview;
    preview.allowed = this.canPreview();
    this.setState({preview: preview});
  }

  onEditorChange(content) {
    let form = this.state.form;
    form.htmlText = content;
    this.setState({form: form, info: ''});
    let preview = this.state.preview;
    preview.allowed = this.canPreview();
    this.setState({preview: preview});
  }

  // eslint-disable-next-line no-unused-vars
  onPreviewNext(event) {
    let preview = this.state.preview;
    let index = preview.index;
    let email = preview.email;
    try {
      preview.email = preview.data[preview.index+1];
      preview.index += 1;
    } catch(e) {
      preview.index = index;
      preview.email = email;
    }
    this.setState({preview: preview});
  }
  // eslint-disable-next-line no-unused-vars
  onPreviewPrevious(event) {
    let preview = this.state.preview;
    let index = preview.index;
    let email = preview.email;
    try {
      preview.email = preview.data[preview.index-1];
      preview.index -= 1;
    } catch(e) {
      preview.index = index;
      preview.email = email;
    }
    this.setState({preview: preview});
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
    try {
      return csv.split(',');
    } catch (e) {
      return '';
    }
  }

  getContextsObject() {
    try {
      if (this.state.form.contexts && this.state.form.contexts.trim().length > 0) {
        return JSON.parse(this.state.form.contexts.trim());
      } else {
        return {};
      }
    } catch (e) {
      return {};
    }
  }

  validateContext(obj) {
    try {
      return obj && obj.to && Array.isArray(obj.to) && obj.to.length > 0;
    } catch(e) {
      return false;
    }
  }

  validateContexts() {
    const contexts = this.getContextsObject();
    let result = Array.isArray(contexts) && contexts.length > 0;
    if (result) {
      contexts.forEach(c => {
        if (!this.validateContext(c)) {
          result = false;
        }
      });
    }
    return result;
  }

  isEmpty(str) {
    return (!str || /^\s*$/.test(str));
  }

  notEmpty(str) {
    return !this.isEmpty(str);
  }

  canPreview() {
    let form = this.state.form;
    return this.hasMessageBody() && this.validateContexts() && this.notEmpty(form.sender) && this.notEmpty(form.subject);
  }

  async hasSenderEditor() {
    let user = await this.authService.getUser();
    return this.authService.hasRole(user, SENDER_EDITOR_ROLE);
  }

  getDefaultSender(hasSenderEditor) {
    return hasSenderEditor ? '' : this.state.config.sender;
  }

  async componentDidMount() {
    let user = await this.authService.getUser();
    const hasSenderEditor = this.authService.hasRole(user, SENDER_EDITOR_ROLE);
    let form = this.state.form;
    form.sender = this.getDefaultSender(hasSenderEditor);
    this.setState({hasSenderEditor: hasSenderEditor, form: form});
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

      let postMergeData = await this.postEmailMerge();
      messageIds = postMergeData.map(d => d.messageId);

      let form = this.state.form;
      form.wasValidated = false;
      form.sender = this.getDefaultSender(this.state.hasSenderEditor);
      form.subject = '';
      form.plainText = '';
      form.htmlText = '';
      form.files = [];
      form.contexts = '';
      form.bodyType = BODY_TYPES[0];
      form.priority = PRIORITIES[0];
      form.reset = true;
      this.setState({
        busy:false,
        form: form,
        excel: {
          cols: [],
          data: [],
          headers: [],
          variables: []
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
        info: `Message submitted to Showcase CHES API: ${messageIds}`,
        error: ''
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

  async postEmailMerge() {
    let user = await this.authService.getUser();
    let attachments = await Promise.all(this.state.form.files.map(file => this.convertFileToAttachment(file)));

    const email = {
      contexts: this.getContextsObject(),
      attachments: attachments,
      bodyType: this.state.form.bodyType,
      body: this.getMessageBody(),
      encoding: BODY_ENCODING[0],
      from: this.state.form.sender,
      priority: this.state.form.priority,
      subject: this.state.form.subject
    };

    const response = await axios.post(
      EMAIL_MERGE_URL,
      JSON.stringify(email),
      {
        headers: {
          'Authorization':`Bearer ${user.access_token}`,
          'Content-Type':'application/json'
        }
      }
    ).catch(e => {
      throw Error('Could not deliver email to Showcase CHES API: ' + e.message);
    });
    return response.data;
  }

  async loadPreview(event) {
    event.preventDefault();
    event.stopPropagation();

    let preview = this.state.preview;
    if (preview.allowed) {
      let postMergePreviewData = await this.postEmailMergePreview();
      if (postMergePreviewData && postMergePreviewData.length > 0) {
        preview.data = postMergePreviewData;
        preview.length = preview.data.length;
        preview.index = 0;
        preview.email = preview.data[0];
      }
    }
    this.setState({preview: preview});
  }

  async postEmailMergePreview() {
    let user = await this.authService.getUser();

    const email = {
      contexts: this.getContextsObject(),
      attachments: [],
      bodyType: this.state.form.bodyType,
      body: this.getMessageBody(),
      encoding: BODY_ENCODING[0],
      from: this.state.form.sender,
      priority: this.state.form.priority,
      subject: this.state.form.subject
    };

    const response = await axios.post(
      EMAIL_MERGE_PREVIEW_URL,
      JSON.stringify(email),
      {
        headers: {
          'Authorization':`Bearer ${user.access_token}`,
          'Content-Type':'application/json'
        }
      }
    ).catch(e => {
      throw Error('Could not deliver email to Showcase CHES API: ' + e.message);
    });
    return response.data;
  }

  onFileDrop(acceptedFiles) {
    let dropWarning = '';

    let form = this.state.form;
    let files = form.files;

    let attachmentsSize = files.length === 0 ? 0 : files.map(f => f.size).reduce((a,b) => a + b);
    let attachmentsSizeAvailable = this.state.config.attachmentsMaxSize - attachmentsSize;

    // accept smaller files first...
    const acceptedFilesSortedBySize = acceptedFiles.sort((a, b) => parseFloat(a.size) - parseFloat(b.size));
    acceptedFilesSortedBySize.forEach((value) => {
      if (-1 === form.files.findIndex((f) => { return f.name === value.name && f.lastModified === value.lastModified && f.size === value.size; })) {
        if (attachmentsSizeAvailable - value.size > 0) {
          attachmentsSizeAvailable = attachmentsSizeAvailable - value.size;
          files.push(value);
        } else {
          dropWarning = `Attachments are limited to ${bytes.format(this.state.config.attachmentsMaxSize)} bytes in total size.`;
        }
      }
    });

    form.files = files;
    this.setState({form: form, dropWarning: dropWarning});
  }

  toCamelCase(str) {
    // lowercase the str
    // replace whitespace with _
    // remove all non-alphanumeric (except _)
    // remove all repeated _ with single _
    // remove all _ and change next character to Uppercase
    const result = str.toLowerCase().replace(/ /g, '_').replace(/\W/g, '').replace(/_+/g, '_').replace(/_([a-z])/g,function(m){return m.toUpperCase();}).replace(/_/g,'');
    return result;
  }

  makeHeaderUnique(existing, original, val = original, count = 0) {
    if (existing.includes(val)) {
      count++;
      return this.makeHeaderUnique(existing, original, `${original}${count}`, count);
    } else {
      return val;
    }
  }

  sanitizeHeaders(headers) {
    let result = [];
    headers.forEach(c => {
      let h = this.makeHeaderUnique(result, this.toCamelCase(c));
      result.push(h);
    });
    return result;
  }

  onExcelFileDrop(acceptedFiles) {

    const make_cols = refstr => {
      let o = [], C = XLSX.utils.decode_range(refstr).e.c + 1;
      for(var i = 0; i < C; ++i) o[i] = {name: XLSX.utils.encode_col(i), key:i};
      return o;
    };

    if (acceptedFiles.length === 1) {
      try {
        const file = acceptedFiles[0];
        const reader = new FileReader();
        const rABS = !!reader.readAsBinaryString;
        reader.onload = (e) => {
          /* Parse data */
          const bstr = e.target.result;
          const wb = XLSX.read(bstr, {type:rABS ? 'binary' : 'array'});
          /* Get first worksheet */
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          /* Convert array of arrays */
          const data = XLSX.utils.sheet_to_json(ws, {header:1});

          /* Update state */
          let excel = this.state.excel;
          excel.cols = make_cols(ws['!ref']);

          const headers = this.sanitizeHeaders(data[0]);
          excel.variables = headers.map(x => `{{${x}}}`); //just show as nunjucks syntax for now...
          excel.headers = [headers];
          // actual data is rows 2 onward
          excel.data = data.slice(1);

          let form = this.state.form;
          let contexts = [];
          excel.data.forEach(d => {
            let r = {to:[], cc:[], bcc:[], context: {}};
            let fields = excel.cols;
            fields.forEach(f => {
              let fieldName = excel.headers[0][f.key];
              switch(fieldName) {
              case 'to':
                r.to = this.getAddresses(d[f.key]);
                r.context.to = r.to;
                break;
              case 'cc':
                r.cc = this.getAddresses(d[f.key]);
                r.context.cc = r.cc;
                break;
              case 'bcc':
                r.bcc = this.getAddresses(d[f.key]);
                r.context.bcc = r.bcc;
                break;
              default:
                r.context[fieldName] = d[f.key];
              }
            });
            if (this.validateContext(r)) contexts.push(r);
          });
          form.contexts = JSON.stringify(contexts, null, 2);
          this.setState({excel: excel, form: form });
        };
        if(rABS) reader.readAsBinaryString(file); else reader.readAsArrayBuffer(file);
      } catch (e) {
        let form = this.state.form;
        form.contexts = '';
        this.setState({excel: {cols: [], headers: [], data: [], variables: []}, form: form, error: 'Error parsing the Contexts file, please check the structure and format of the file.' });
      }
    }
  }

  removeFile(filename) {
    let form = this.state.form;
    let files = form.files.filter((f) => { return f.name !== filename; });
    form.files = files;
    this.setState({form: form, dropWarning: ''});
  }

  render() {

    // set styles and classes here...
    const displayBusy = this.state.busy ? {} : {display: 'none'};
    const displayNotBusy = this.state.busy ? {display: 'none'} : {};

    const successDisplay = (this.state.info && this.state.info.length > 0) ? {} : {display: 'none'};
    const errorDisplay = (this.state.error && this.state.error.length > 0) ? {} : {display: 'none'};
    const plainTextDisplay = this.state.form.bodyType === BODY_TYPES[0] ? {} : {display: 'none'};
    const plainTextButton = this.state.form.bodyType === BODY_TYPES[0] ? 'btn btn-sm btn-outline-secondary active' : 'btn btn-sm btn-outline-secondary';
    const htmlTextDisplay = this.state.form.bodyType === BODY_TYPES[1] ? {} : {display: 'none'};
    const htmlTextButton = this.state.form.bodyType === BODY_TYPES[1] ? 'btn btn-sm btn-outline-secondary active' : 'btn btn-sm btn-outline-secondary';
    const {wasValidated} = this.state.form;
    const bodyErrorDisplay = (this.state.form.wasValidated && !this.hasMessageBody()) ? {} : {display: 'none'};
    const dropWarningDisplay = (this.state.dropWarning && this.state.dropWarning.length > 0) ? {} : {display: 'none'};

    const emailTabClass = this.state.tab === 'email' ? 'nav-link active' : 'nav-link';
    const aboutTabClass = this.state.tab === 'about' ? 'nav-link active' : 'nav-link';
    const emailTabDisplay = this.state.tab === 'email' ? {} : {display: 'none'};
    const aboutTabDisplay = this.state.tab === 'about' ? {} : {display: 'none'};

    const contextsExcelDisplay = this.state.form.contextsType === CONTEXTS_TYPES[0] ? {} : {display: 'none'};
    const contextsExcelButton = this.state.form.contextsType === CONTEXTS_TYPES[0] ? 'btn btn-sm btn-outline-secondary active' : 'btn btn-sm btn-outline-secondary';
    const contextsJsonDisplay = this.state.form.contextsType === CONTEXTS_TYPES[1] ? {} : {display: 'none'};
    const contextsJsonButton = this.state.form.contextsType === CONTEXTS_TYPES[1] ? 'btn btn-sm btn-outline-secondary active' : 'btn btn-sm btn-outline-secondary';

    return (
      <div className="container-fluid" id="maincontainer" >

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
              <div className="alert alert-success" style={successDisplay}>
                {this.state.info}
              </div>
              <div className="alert alert-danger" style={errorDisplay}>
                {this.state.error}
              </div>

              <ul className="nav nav-tabs">
                <li className="nav-item">
                  <button className={emailTabClass} id='email' onClick={this.onSelectTab}>CHES Mail Merge</button>
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
                        <div className="mb-3">
                          <label htmlFor="sender">Sender</label>
                          <input type="text" className="form-control" name="sender" placeholder={this.state.config.sender}
                            readOnly={!this.state.hasSenderEditor} required value={this.state.form.sender} onChange={this.onChangeSender}/>
                          <div className="invalid-feedback">
                            Email sender is required.
                          </div>
                        </div>

                        <div className="mt-3 mb-3">
                          <label htmlFor="subject">Subject</label>
                          <input type="text" className="form-control" name="subject" required value={this.state.form.subject}
                            onChange={this.onChangeSubject}/>
                          <div className="invalid-feedback">
                            Subject is required.
                          </div>
                        </div>

                        <div className="mb-3">
                          <label htmlFor="priority">Priority</label>
                          <select className="form-control col-sm-3" value={this.state.form.priority} onChange={this.onChangePriority}>
                            {PRIORITIES.map(p => {
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
                              <input type="radio" defaultChecked={this.state.form.contextsType === CONTEXTS_TYPES[0]} value={CONTEXTS_TYPES[0]} name="contextsType" onClick={this.onChangeContextsType} /> Excel
                            </label>
                            <label className={contextsJsonButton}>
                              <input type="radio" defaultChecked={this.state.form.contextsType === CONTEXTS_TYPES[1]} value={CONTEXTS_TYPES[1]} name="contextsType" onClick={this.onChangeContextsType} /> JSON
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
                                  <i className="m-sm-auto fas fa-2x  fa-file-excel upload-icon" alt="upload xlsx"></i>
                                </div>
                              )}
                            </Dropzone>
                          </div>
                          <div className="col-sm-10">
                            <div className="table-responsive contexts-table">
                              <table className="table table-striped table-ellipsis">
                                {this.state.excel.headers.map((r,i) => <thead key={i}>{this.state.excel.cols.map(c => <th key={c.key}>{ r[c.key] }</th>)}</thead>)}
                                <tbody>
                                  {this.state.excel.data.map((r,i) => <tr key={i}>{this.state.excel.cols.map(c => <td key={c.key}>{ r[c.key] }</td>)}</tr>)}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                        <div style={contextsJsonDisplay} >
                          <textarea id="contextsText" name="contextsText" className="form-control"
                            value={this.state.form.contexts} onChange={this.onChangeContexts}></textarea>
                        </div>

                        <div className="mt-3 mb-3 row">
                          <div className="col-sm-4">
                            <label className="mt-1">Body</label>
                          </div>
                          <div className="col-sm-4 offset-sm-4 btn-group btn-group-toggle">
                            <label className={plainTextButton}>
                              <input type="radio" defaultChecked={this.state.form.bodyType === BODY_TYPES[0]} value={BODY_TYPES[0]} name="bodyType" onClick={this.onChangeBodyType} /> Plain Text
                            </label>
                            <label className={htmlTextButton}>
                              <input type="radio" defaultChecked={this.state.form.bodyType === BODY_TYPES[1]} value={BODY_TYPES[1]} name="bodyType" onClick={this.onChangeBodyType} /> HTML
                            </label>
                          </div>
                        </div>
                        <div className="row" style={plainTextDisplay}>
                          <div className="col-sm-2 variables-sidebar">
                            <div className="table-responsive">
                              <table className="table">
                                <thead><th>Variables</th></thead>
                                <tbody>
                                  {this.state.excel.variables.map((r,i) => <tr key={i}><td key={i}>{ r }</td></tr>)}
                                </tbody>
                              </table>
                            </div>
                          </div>
                          <div className="col-sm-10">
                            <textarea id="messageText" name="plainText" className="form-control" required={this.state.form.bodyType === BODY_TYPES[0]}
                              value={this.state.form.plainText} onChange={this.onChangePlainText}></textarea>
                          </div>
                          <div className="invalid-feedback" style={bodyErrorDisplay}>
                            Body is required.
                          </div>
                        </div>
                        <div className="row" style={htmlTextDisplay} >
                          <div className="col-sm-2 variables-sidebar">
                            <div className="table-responsive">
                              <table className="table">
                                <thead><th>Variables</th></thead>
                                <tbody>
                                  {this.state.excel.variables.map((r,i) => <tr key={i}><td key={i}>{ r }</td></tr>)}
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
                                  <i className="m-sm-auto fas fa-2x fa-file-pdf upload-icon" alt="upload files"></i>
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
                        <div className="row">
                          <div className="col-sm-6">
                            <button type="button" className="btn btn-secondary btn-lg btn-block" data-toggle="modal" data-target="#previewModal" disabled={!this.state.preview.allowed} onClick={this.loadPreview} >
                              Preview
                            </button>
                          </div>
                          <div className="col-sm-6">
                            <button className="btn btn-primary btn-lg btn-block" type="submit">Send Message</button>
                          </div>
                        </div>
                        <div className="modal fade" id="previewModal" tabIndex="-1" role="dialog" aria-labelledby="previewModalLabel" aria-hidden="true">
                          <div className="modal-dialog" role="document">
                            <div className="modal-content">
                              <div className="modal-header">
                                <h5 className="modal-title" id="previewModalLabel">Email Merge Preview</h5>
                                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                  <span aria-hidden="true">&times;</span>
                                </button>
                              </div>
                              <div className="modal-body">
                                <div>

                                  <div className="mb-3">
                                    <label htmlFor="sender">Sender</label>
                                    <input type="text" className="form-control" value={this.state.preview.email.from} readOnly={true}/>
                                  </div>

                                  <div className="mb-3">
                                    <label htmlFor="recipients">Recipients</label>
                                    <input type="text" className="form-control" value={this.state.preview.email.to.join(',')} readOnly={true}/>
                                  </div>

                                  <div className="mb-3">
                                    <label htmlFor="subject">Subject</label>
                                    <input type="text" className="form-control" required value={this.state.preview.email.subject} readOnly={true}/>
                                  </div>

                                  <div className="mb-3" style={plainTextDisplay}>
                                    <label className="mt-1">Body</label>
                                    <textarea id="previewBodyText" className="form-control" value={this.state.preview.email.body} readOnly={true}></textarea>
                                  </div>

                                  <div className="mb-3" style={htmlTextDisplay}>
                                    <label className="mt-1">Body</label>
                                    <div id="previewBodyHtml" dangerouslySetInnerHTML={{ __html: `${this.state.preview.email.body}` }}></div>
                                  </div>
                                  <hr className="mb-4"/>
                                  <div className="row">
                                    <div className="col-sm-3">
                                      <button type="button" className="btn btn-secondary btn-lg btn-block" disabled={this.state.preview.index === -1 || (this.state.preview.index <=  0)} onClick={this.onPreviewPrevious}>Previous</button>
                                    </div>
                                    <div className="col-sm-3">
                                      <button type="button" className="btn btn-secondary btn-lg btn-block" disabled={this.state.preview.index === -1 || (this.state.preview.index >= this.state.preview.length-1)} onClick={this.onPreviewNext}>Next</button>
                                    </div>
                                    <div className="offset-sm-3 col-sm-3">
                                      <button type="button" className="btn btn-primary btn-lg btn-block" data-dismiss="modal">Close</button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="modal-footer">
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
                <div className="mb-4"></div>
                <h3>CHES Showcase - the Common Hosted Email Service Showcase Page</h3>
                <br/>
                <p>MSSC demonstrates how an application can leverage the Common Hosted Email Service&#39;s (CHES) ability to deliver emails by calling <a href="https://github.com/bcgov/common-hosted-email-service.git">common-hosted-email-service</a>.</p>
                <p>The common-hosted-email-service requires a Service Client that has previously been created in the environment with appropriate CHES scopes; see <a href="https://github.com/bcgov/nr-get-token">Get OK</a> for more on how to get access to CHES.</p>

              </div>

            </div>

          </div>

        </div>

      </div>

    );
  }
}
export default MergeForm;
