import './MergeForm.css';
import axios from 'axios';
import bytes from 'bytes';
import React, {Component} from 'react';
import Dropzone from 'react-dropzone';
import TinyMceEditor from '../htmlText/TinyMceEditor';
import {AuthConsumer} from '../auth/AuthProvider';
import XLSX from 'xlsx';

const CHES_ROOT = process.env.REACT_APP_CHES_ROOT || '';
const CHES_PATH = `${CHES_ROOT}/ches/v1`;
const EMAIL_MERGE_URL = `${CHES_PATH}/email/merge`;
const BODY_TYPES = ['text', 'html'];
const PRIORITIES = ['normal', 'low', 'high'];
const BODY_ENCODING = ['utf-8', 'base64', 'binary', 'hex'];
const ATTACHMENT_ENCODING = ['base64', 'binary', 'hex'];

// setting the front end to less than the backend payload, just to ensure delivery.
const SERVER_BODYLIMIT = '20mb';

class MergeForm extends Component {

  constructor(props) {
    super(props);

    this.state = {
      busy: false,
      tab: 'about',
      info: '',
      error: '',
      dropWarning: '',
      excel: {
        cols: [],
        data: [],
        headers: []
      },
      form: {
        wasValidated: false,
        contexts: '',
        subject: '',
        plainText: '',
        priority: PRIORITIES[0],
        htmlText: '',
        files: [],
        reset: false,
        bodyType: BODY_TYPES[0]
      },
      config: {
        attachmentsMaxSize: bytes.parse(SERVER_BODYLIMIT),
        sender: 'NR.CommonServiceShowcase@gov.bc.ca'
      }
    };

    this.formSubmit = this.formSubmit.bind(this);
    this.onChangeSubject = this.onChangeSubject.bind(this);
    this.onChangePlainText = this.onChangePlainText.bind(this);
    this.onChangeBodyType = this.onChangeBodyType.bind(this);
    this.onChangePriority = this.onChangePriority.bind(this);

    this.onEditorChange = this.onEditorChange.bind(this);

    this.onFileDrop = this.onFileDrop.bind(this);
    this.removeFile = this.removeFile.bind(this);
    this.onSelectTab = this.onSelectTab.bind(this);
    this.onExcelFileDrop = this.onExcelFileDrop.bind(this);
  }

  onSelectTab(event) {
    event.preventDefault();
    if (this.state.tab !== event.target.id) {
      this.setState({tab: event.target.id, info: '', error: ''});
    }
  }

  onChangeSubject(event) {
    let form = this.state.form;
    form.subject = event.target.value;
    this.setState({form: form, info: ''});
  }

  onChangePlainText(event) {
    let form = this.state.form;
    form.plainText = event.target.value;
    this.setState({form: form, info: ''});
  }

  onChangeBodyType(event) {
    let form = this.state.form;
    form.bodyType = event.target.value;
    this.setState({form: form, info: ''});
  }

  onChangePriority(event) {
    let form = this.state.form;
    form.priority = event.target.value;
    this.setState({form: form, info: ''});
  }

  onEditorChange(content) {
    let form = this.state.form;
    form.htmlText = content;
    this.setState({form: form, info: ''});
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

  async componentDidMount() {
  }

  componentWillUnmount() {
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

    let messageIds = [];
    try {

      this.setState({busy: true});

      let postMergeData = await this.postEmailMerge();
      messageIds = postMergeData.map(d => d.messageId);

      let form = this.state.form;
      form.wasValidated = false;
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
          headers: []
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
    let attachments = await Promise.all(this.state.form.files.map(file => this.convertFileToAttachment(file)));

    const email = {
      contexts: JSON.parse(this.state.form.contexts),
      attachments: attachments,
      bodyType: this.state.form.bodyType,
      body: this.getMessageBody(),
      encoding: BODY_ENCODING[0],
      from: this.state.config.sender,
      priority: this.state.form.priority,
      subject: this.state.form.subject
    };

    const response = await axios.post(
      EMAIL_MERGE_URL,
      JSON.stringify(email),
      {
        headers: {
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

  onExcelFileDrop(acceptedFiles) {

    const make_cols = refstr => {
      let o = [], C = XLSX.utils.decode_range(refstr).e.c + 1;
      for(var i = 0; i < C; ++i) o[i] = {name:XLSX.utils.encode_col(i), key:i};
      return o;
    };

    if (acceptedFiles.length === 1) {
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
        excel.headers = [data[0]];
        excel.data = data.slice(1);

        let form = this.state.form;
        let contexts = [];
        excel.data.forEach(d => {
          let r = {to:[], context: {}};
          r.to = [d[0]];
          // get the other fields...
          let fields = excel.cols.slice(1);
          fields.forEach(f => {
            r.context[excel.headers[0][f.key]] = d[f.key];
          });
          contexts.push(r);
        });
        form.contexts = JSON.stringify(contexts);
        this.setState({excel: excel, form: form });
      };
      if(rABS) reader.readAsBinaryString(file); else reader.readAsArrayBuffer(file);
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
                  <button className={emailTabClass} id='email' onClick={this.onSelectTab}>Email</button>
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
                          <input type="text" className="form-control" name="sender"
                            readOnly required value={this.state.config.sender}/>
                          <div className="invalid-feedback">
                            Email sender is required.
                          </div>
                        </div>

                        <div className="mt-3 mb-3">
                          <label>Excel / Contexts</label>
                        </div>
                        <div className="row">
                          <div className="col-sm-3">
                            <Dropzone
                              onDrop={this.onExcelFileDrop}>
                              {({getRootProps, getInputProps}) => (
                                <div {...getRootProps({className: 'dropzone'})}>
                                  <input type="file" {...getInputProps({className: 'dropzone-fileinput'})} />
                                  <i className="m-sm-auto fas fa-2x fa-file-excel upload-icon" alt="upload file"></i>
                                </div>
                              )}
                            </Dropzone>
                          </div>
                          <div className="col-sm-9">
                            <div className="table-responsive">
                              <table className="table table-striped">
                                {this.state.excel.headers.map((r,i) => <thead key={i}>{this.state.excel.cols.map(c => <th key={c.key}>{ r[c.key] }</th>)}</thead>)}
                                <tbody>
                                  {this.state.excel.data.map((r,i) => <tr key={i}>{this.state.excel.cols.map(c => <td key={c.key}>{ r[c.key] }</td>)}</tr>)}
                                </tbody>
                              </table>
                            </div>
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
                        <div style={plainTextDisplay} >
                          <textarea id="messageText" name="plainText" className="form-control" required={this.state.form.mediaType === BODY_TYPES[0]}
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
                              onDrop={this.onFileDrop}>
                              {({getRootProps, getInputProps}) => (
                                <div {...getRootProps({className: 'dropzone'})}>
                                  <input type="file" multiple {...getInputProps({className: 'dropzone-fileinput'})} />
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
