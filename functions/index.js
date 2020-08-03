const functions = require('firebase-functions');
const { contactForm, tryItOut } = require('./sendEmails');

//initialize Express and cors to allow cross-origin requests
const express = require('express');
//Express functions for sanitizing input
const { body } = require('express-validator');

const cors = require('cors');
const app = express();
const { originsList } = require('./config');

app.use(
	cors({
		origin: (origin, callback) => {
			console.log({ origin });
			//allow requests with no origin
			if (!origin) return callback(null, true);
			if (originsList.indexOf(origin) === -1) {
				let message = 'Unauthorized origin.';
				return callback(new Error(message), false);
			}
			return callback(null, true);
		},
	})
);

app.post(
	'/contactForm',
	[body('Email').escape(), body('Name').escape(), body('Message').escape()],
	contactForm
);
app.post(
	'/tryItOut',
	[body('Email').escape(), body('Name').escape(), body('Message').escape()],
	tryItOut
);

exports.sendEmail = functions.https.onRequest(app);
