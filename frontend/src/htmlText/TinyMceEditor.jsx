import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './TinyMceEditor.css';

import tinymce from 'tinymce';
import 'tinymce/themes/silver';
import 'tinymce/skins/ui/oxide/skin.min.css';
import 'tinymce/skins/ui/oxide/content.min.css';
import 'tinymce/plugins/wordcount';
import 'tinymce/plugins/table';

class TinyMceEditor extends Component {
  constructor() {
    super();
    this.state = { editor: null, reset: false };
  }

  componentDidMount() {
    tinymce.init({
      selector: `#${this.props.id}`,
      skin: false,
      content_css: false,
      plugins: 'wordcount table',
      height : '480px',
      setup: editor => {
        this.setState({ editor });
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
