// MSSC related
export const SENDER_EDITOR_ROLE = 'mssc:sender_editor';
export const DEFAULT_SENDER = 'NR.CommonServiceShowcase@gov.bc.ca';

// CMSG related
export const CMSG_MEDIA_TYPES = ['text/plain', 'text/html'];

// CHES related...
export const CHES_BODY_TYPES = ['text', 'html'];
export const CHES_PRIORITIES = ['normal', 'low', 'high'];
export const CHES_BODY_ENCODING = ['utf-8', 'base64', 'binary', 'hex'];
export const CHES_ATTACHMENT_ENCODING = ['base64', 'binary', 'hex'];
// not really a CHES limit, but a MSSC limit to ensure we can showcase CHES attachments without failing.
export const CHES_SERVER_BODYLIMIT = '20mb';

export const CONTEXTS_TYPES = ['xlsx', 'json'];
