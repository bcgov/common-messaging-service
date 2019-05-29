const config = require('config');
const path = require('path');

// we will create these files so we can test delete...
const file1 = path.join(config.get('server.uploads.path'), 'file_1');
const file2 = path.join(config.get('server.uploads.path'), 'file_1');

// these pdfs should exist to test upload (pdfs, under 5M)
const pdf1 = path.join(__dirname, 'files', 'Kubernetes_OpenShift.pdf');
const pdf2 = path.join(__dirname, 'files', 'Microservices_vs_SOA_OpenShift.pdf');

const bigPdf = path.join(__dirname, 'files', 'DevOps_with_OpenShift.pdf');

module.exports = {
  FILE_1: file1.toString(),
  FILE_2: file2.toString(),
  PDF_1: pdf1.toString(),
  PDF_2: pdf2.toString(),
  PDF_TOO_BIG: bigPdf.toString()
};
