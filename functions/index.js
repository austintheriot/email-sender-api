const functions = require('firebase-functions');
const { contactForm, tryItOut } = require('./sendEmails');

//initialize Express and cors to allow cross-origin requests
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors({ origin: true }));

app.post('/contactForm', contactForm);
app.post('/tryItOut', tryItOut);

exports.sendEmail = functions.https.onRequest(app);
