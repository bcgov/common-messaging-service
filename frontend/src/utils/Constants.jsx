// MSSC related
export const SENDER_EDITOR_ROLE = 'mssc:sender_editor';
export const DEFAULT_SENDER = 'NR.CommonServiceShowcase@gov.bc.ca';

// CMSG related
export const CMSG_MEDIA_TYPES_HTML = 'text/html';
export const CMSG_MEDIA_TYPES_TEXT = 'text/plain';

// CHES related...
export const CHES_BODY_TYPES_HTML = 'html';
export const CHES_BODY_TYPES_TEXT = 'text';

export const CHES_PRIORITIES_HIGH = 'high';
export const CHES_PRIORITIES_LOW = 'low';
export const CHES_PRIORITIES_NORMAL = 'normal';
export const CHES_PRIORITIES = [CHES_PRIORITIES_NORMAL, CHES_PRIORITIES_HIGH, CHES_PRIORITIES_LOW];

export const CHES_BODY_ENCODING_BASE64 = 'base64';
export const CHES_BODY_ENCODING_BIN = 'binary';
export const CHES_BODY_ENCODING_HEX = 'hex';
export const CHES_BODY_ENCODING_UTF8 = 'utf-8';

export const CHES_ATTACHMENT_ENCODING_BASE64 = 'base64';
export const CHES_ATTACHMENT_ENCODING_BIN = 'binary';
export const CHES_ATTACHMENT_ENCODING_HEX = 'hex';
// not really a CHES limit, but a MSSC limit to ensure we can showcase CHES attachments without failing.
export const CHES_SERVER_BODYLIMIT = '20mb';

export const CONTEXTS_TYPES_JSON = 'json';
export const CONTEXTS_TYPES_XLSX = 'xlsx';
