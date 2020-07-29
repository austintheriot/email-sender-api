/* eslint-disable consistent-return */
/* eslint-disable promise/always-return */
const firebase = require('firebase');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
require('firebase/firestore');

//initialize Express and cors to allow cross-origin requests
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors({ origin: true }));

//initialize node mailing system
const nodemailer = require('nodemailer');

//initialize firebase app
admin.initializeApp();
const config = require('./config');
firebase.initializeApp(config.firebase);
const db = admin.firestore();

app.post('/', (req, res) => {
	//first see if API key exists in database
	return db
		.collection('keys')
		.doc(req.body._private.key)
		.get()
		.then((doc) => {
			//retrieve data from returned document (name, website, redirect, etc.)
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

				//create email body based on information received from the database
				//and information received from the website sending the request
				let emailBody = `
				<p>Hi ${database.name || 'there'},</p>
				<p>You have received a new form submission for ${
					database.website || 'your website'
				}:</p>
				${messageList}
				<br/>
				<hr/>
				<p>Notice: You may respond by replying directly to this email.</p>
		`;

				let emailBodyPlainText = `
				Hi ${database.name || 'there'},
				You have received a new form submission for ${
					database.website || 'your website'
				}:
				${messageList}
				Notice: You may respond by replying directly to this email.
		`;

				//configure transporter with gmail login info
				let transporter = nodemailer.createTransport({
					host: 'smtp.gmail.com',
					auth: {
						type: 'login', // default
						user: config.email.username,
						pass: config.email.password,
					},
				});

				//configure information about who the email is going to, who its from,
				//as well as its subject and contents
				const mailOptions = {
					from: config.email.fromEmail, // Example: Jane Doe <janedoe@gmail.com>
					to: database.destination,
					bcc: config.email.fromEmail, // foo@gmail.com, bar@gmail.com
					subject: `New Form Submission (${new Date().toLocaleDateString()}, ${new Date().toLocaleTimeString()})`, // email subject
					html: emailBody, // email content in HTML
					text: emailBodyPlainText,
					replyTo: req.body.email || req.body.Email || req.body.EMAIL, //allows replying directly to the email
				};
				console.log('mailto: ', mailOptions.to);

				//send the email
				transporter.sendMail(mailOptions, (error, data) => {
					if (error) {
						//if failure to send mail
						return res.status(500).send(error.toString());
					}
					data = JSON.stringify(data);
					//if success to send mail
					return res.status(200).send({
						message: `Your form was successfully submitted!`,
						redirect: database.redirect, //send back redirect url (optional and suppplied by database)
					});
				});
			} else {
				//bad request (wrong key)
				return res.status(400).send({
					error: `Bad Request.`,
					message: `Please use the correct key to send an email through this service.`,
				});
			}
		})
		.catch((error) => {
			//else, catch any other errors
			return res.status(500).send({
				error,
				message: 'There was a server-side error. Sorry for any inconvenience.',
			});
		});
});

exports.sendEmail = functions.https.onRequest(app);
