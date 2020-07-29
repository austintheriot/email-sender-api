/* eslint-disable consistent-return */
/* eslint-disable promise/always-return */
const firebase = require('firebase');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
require('firebase/firestore');

const nodemailer = require('nodemailer');

//initialize Express and allow cross-origin requests
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors({ origin: true }));

admin.initializeApp();
const config = require('./config');
firebase.initializeApp(config.firebase);
const db = admin.firestore();

app.post('/', (req, res) => {
	//first retrieve available API keys from Firebase database
	return db
		.collection('keys')
		.doc(req.body._private.key)
		.get()
		.then((doc) => {
			let database = doc.data();
			if (doc.exists) {
				//generate message based on request body
				//filter out private API data
				let messageList = [...Object.keys(req.body)]
					.filter((key) => !key.match(/_private/gi))
					.map((key) => {
						return `<p>${key}: ${req.body[key]}</p>`;
					})
					.join(' ');

				let emailBody = `
				Hi ${database.name || 'there'},
				<br/>
				<br/>
				You have received a new form submission for ${
					database.website || 'your website'
				}:
				<br/>
				${messageList}
				<br/>
				<br/>
				<br/>
				Notice: Please do not reply directly to this email.
		`;

				let transporter = nodemailer.createTransport({
					host: 'smtp.gmail.com',
					auth: {
						type: 'login', // default
						user: config.email.username,
						pass: config.email.password,
					},
				});

				const mailOptions = {
					from: config.email.fromEmail, // Something like: Jane Doe <janedoe@gmail.com>
					to: database.destination,
					subject: `New Form Submission (${new Date().toLocaleDateString()}, ${new Date().toLocaleTimeString()})`, // email subject
					html: emailBody, // email content in HTML
				};

				// returning result
				transporter.sendMail(mailOptions, (error, data) => {
					if (error) {
						//failed to send mail
						return res.status(500).send(error.toString());
					}
					data = JSON.stringify(data);
					//succeeded at sending mail
					return res.status(200).send({
						message: `Your form was successfully submitted!`,
						redirect: database.redirect,
					});
				});
			} else {
				//bad request (wrong key)
				return res.status(400).send({
					error: `Unauthorized Request. Please use the correct key to send an email through this service.`,
				});
			}
		})
		.catch((error) => {
			//else, catch any other errors
			return res.status(500).send({ message: error });
		});
});

exports.sendEmail = functions.https.onRequest(app);
