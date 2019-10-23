export function transactionToStorage(obj) {
  let transactionIds = getTransactionIds();
  let messageIds = getMessageIds();

  if (!transactionIds.includes(obj.txId)) {
    transactionIds.unshift(obj.txId);
  }

  obj.messages.forEach(m => {
    messageIds.unshift(m.msgId);
  });

  localStorage.setItem('transactionIds', JSON.stringify(transactionIds));
  localStorage.setItem('messageIds', JSON.stringify(messageIds));
}

export function getTransactionIds() {
  if (localStorage.getItem('transactionIds')) {
    return JSON.parse(localStorage.getItem('transactionIds'));
  }
  return [];
}

export function getTransactionIdOptions() {
  return getTransactionIds().map((t) => {
    return {value: t, label: t};
  });
}

export function getMessageIds() {
  if (localStorage.getItem('messageIds')) {
    return JSON.parse(localStorage.getItem('messageIds'));
  }
  return [];
}

export function getMessageIdOptions() {
  return getMessageIds().map((t) => {
    return {value: t, label: t};
  });
}

const cmsgStatusExists = (status, statuses) => {
  let result = false;
  for(let s of statuses) {
    result = s.messageId === status.messageId && s.type === status.type && s.recipient === status.recipient;
    if (result) break;
  }
  return result;
};

export function cmsgToStorage(status) {
  let statuses = getCommonMsgStatuses();
  let messageIds = getCommonMsgIds();


  if (!cmsgStatusExists(status, statuses)) {
    statuses.unshift(status);
  }

  if (!messageIds.includes(status.messageId)) {
    messageIds.unshift(status.messageId);
  }

  localStorage.setItem('cmsgStatuses', JSON.stringify(statuses));
  localStorage.setItem('cmsgIds', JSON.stringify(messageIds));
}

export function getCommonMsgIds() {
  if (localStorage.getItem('cmsgIds')) {
    return JSON.parse(localStorage.getItem('cmsgIds'));
  }
  return [];
}

export function getCommonMsgStatuses() {
  if (localStorage.getItem('cmsgStatuses')) {
    return JSON.parse(localStorage.getItem('cmsgStatuses'));
  }
  return [];
}

