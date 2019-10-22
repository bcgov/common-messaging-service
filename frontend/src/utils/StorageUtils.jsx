export function transactionToStorage(obj) {
  let transactionIds = getTransactionIds();
  let messageIds = getMessageIds();

  if (!transactionIds.includes(obj.txId)) {
    transactionIds.push(obj.txId);
  }

  obj.messages.forEach(m => {
    messageIds.push(m.msgId);
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

