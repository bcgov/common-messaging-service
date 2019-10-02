import React, {Component} from 'react';
import PropTypes from 'prop-types';
import './TinyMceEditor.css';

import tinymce from 'tinymce';
import 'tinymce/themes/silver';
import 'tinymce/skins/ui/oxide/skin.min.css';
import 'tinymce/skins/ui/oxide/content.min.css';
import 'tinymce/plugins/wordcount';
import 'tinymce/plugins/table';
import 'tinymce/plugins/image';
import 'tinymce/plugins/link';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/print';
import 'tinymce/plugins/preview';
import 'tinymce/plugins/paste';
import 'tinymce/plugins/help';
import 'tinymce/plugins/fullscreen';
import 'tinymce/plugins/code';
import 'tinymce/plugins/charmap';

class TinyMceEditor extends Component {
  constructor() {
    super();
    this.state = {editor: null, reset: false};
  }

  componentDidMount() {
    tinymce.init({
      selector: `#${this.props.id}`,
      skin: false,
      content_css: false,
      plugins: 'wordcount table print preview paste help fullscreen image link code charmap',
      height: '480px',
      menubar: 'file view edit insert format table help',
      menu: {
        file: { title: 'File', items: 'newdocument restoredraft | print' },
        edit: { title: 'Edit', items: 'undo redo | cut copy paste | selectall' },
        view: { title: 'View', items: 'code | preview fullscreen' },
        insert: { title: 'Insert', items: 'image link inserttable | charmap' },
        format: { title: 'Format', items: 'bold italic underline strikethrough superscript subscript codeformat | formats blockformats fontformats fontsizes align | forecolor backcolor | removeformat' },
        table: { title: 'Table', items: 'inserttable tableprops deletetable row column cell' },
        help: { title: 'Help', items: 'help' }
      },
      setup: editor => {
        this.setState({editor});
        editor.on('keyup change', () => {
          const content = editor.getContent();
          this.props.onEditorChange(content);
        });
      }
    });
  }



  componentWillUnmount() {
    tinymce.remove(this.state.editor);
  }

  UNSAFE_componentWillReceiveProps(props) {
    if (props.reset) {
      // ok, we want to reset the content of this tinymce editor
      // new document will start us fresh...
      this.state.editor.execCommand('mceNewDocument');
      this.state.editor.setContent('');
    }
  }

  render() {
    return (
      <textarea
        id={this.props.id}
        initialvalue={this.props.content}
      />
    );
  }
}

TinyMceEditor.propTypes = {
  id: PropTypes.string,
  content: PropTypes.string,
  reset: PropTypes.bool,
  onEditorChange: PropTypes.func
};

export default TinyMceEditor;
