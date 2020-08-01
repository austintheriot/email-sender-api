/* eslint-disable consistent-return */
/* eslint-disable promise/always-return */
const firebase = require('firebase');
const admin = require('firebase-admin');
require('firebase/firestore');

//initialize node mailing system
const nodemailer = require('nodemailer');

//initialize firebase app
admin.initializeApp();
const config = require('./config');
firebase.initializeApp(config.firebase);
const db = admin.firestore();

//configure transporter with gmail login info
const transporter = nodemailer.createTransport({
	host: 'smtp.gmail.com',
	auth: {
		type: 'login', // default
		user: config.email.username,
		pass: config.email.password,
	},
});

const sendSupportEmail = (error, req) => {
	try {
		//Get as much information as possible
		let emailHtml = `
		<p>Error Message from Function:</p>
		<p>${JSON.stringify(error)}</p>
		<p>Req Body Information:</p>
		<p>${JSON.stringify(req.body)}</p>
		`;

		let emailText = `
		Error Message from Function: 
		${JSON.stringify(error)}
		Req Body Information: 
		${JSON.stringify(req.body)}
		`;

		//configure information about who the email is going to, who its from,
		//as well as its subject and contents
		const mailOptions = {
			from: config.email.fromEmail, // Example: Jane Doe <janedoe@gmail.com>
			to: config.email.supportEmail,
			bcc: config.email.fromEmail, // foo@gmail.com, bar@gmail.com
			subject: `Error Reported for Email API (${new Date().toLocaleDateString(
				'en-US'
			)}, ${new Date().toLocaleTimeString()})`, // email subject
			html: emailHtml, // email content in HTML
			text: emailText,
		};

		//send the email
		transporter.sendMail(mailOptions);
	} catch (err) {
		console.error(err);
	}
};

exports.contactForm = (req, res) => {
	//first see if API key exists in database
	return db
		.collection('keys')
		.doc(req.body._private.key)
		.get()
		.then((doc) => {
			//retrieve data from returned document (name, website, redirect, etc.)
			let database = doc.data();
			if (doc.exists && database.type === 'contactForm') {
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
				<p>To opt out of future emails, please let the developer of this service know directly by emailing him at ${
					config.email.supportEmail
				}</p>
		`;

				let emailBodyPlainText = `
				Hi ${database.name || 'there'},
				You have received a new form submission for ${
					database.website || 'your website'
				}:
				${messageList}
				Notice: You may respond by replying directly to this email.
				To opt out of future emails, please let the developer of this service know directly by emailing him at ${
					config.email.supportEmail
				}
		`;

				//configure information about who the email is going to, who its from,
				//as well as its subject and contents
				const mailOptions = {
					from: config.email.fromEmail, // Example: Jane Doe <janedoe@gmail.com>
					to: database.destination,
					bcc: config.email.fromEmail, // foo@gmail.com, bar@gmail.com
					subject: `New Form Submission (${new Date().toLocaleDateString(
						'en-US'
					)}, ${new Date().toLocaleTimeString()})`, // email subject
					html: emailBody, // email content in HTML
					text: emailBodyPlainText,
					replyTo: req.body.email || req.body.Email || req.body.EMAIL, //allows replying directly to the email
				};

				//send the email
				transporter.sendMail(mailOptions, (error, data) => {
					if (error) {
						sendSupportEmail(error, req);
						//if failure to send mail
						return res.status(500).send(error.toString());
					}
					data = JSON.stringify(data);
					//if success to send mail
					return res.status(200).send({
						message: `Your form was successfully submitted!`,
					});
				});
			} else {
				sendSupportEmail({ error: 'Bad request. Incorrect key' }, req);
				//bad request (wrong key)
				return res.status(400).send({
					error: `Bad Request.`,
					message: `Please use the correct key to send an email through this service.`,
				});
			}
		})
		.catch((error) => {
			sendSupportEmail({ message: 'Server-side error: ', error }, req);
			//else, catch any other errors
			return res.status(500).send({
				error,
				message: 'There was a server-side error. Sorry for any inconvenience.',
			});
		});
};

exports.tryItOut = (req, res) => {
	//first see if API key exists in database
	return db
		.collection('keys')
		.doc(req.body._private.key)
		.get()
		.then((doc) => {
			//retrieve data from returned document (name, website, redirect, etc.)
			let database = doc.data();
			if (doc.exists && database.type === 'tryItOut') {
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
				<p>Hi there,</p>
				<p>Thanks for trying out my Email API service.</p>
				<p>Here's the information you put into the form at austintheriot.com:</p>
				${messageList}
				<br/>
				<hr/>
				<p>Notice: If you're interested in hiring me, please don't hesitate to contact me using my <a href="https://austintheriot.com/contact">real contact form</a>.</p>
				<p>Thanks!</p>
				<p>Notice: Please do not reply directly to this email. This email is not monitored for new messages.</p>
		`;

				let emailBodyPlainText = `
				Hi there,
				Thanks for trying out my Email API service.
				Here's the information you put into the form at austintheriot.com:
				${messageList}
				Notice: If you're interested in hiring me, please don't hesitate to contact me using my real contact form (https://austintheriot.com/contact).
				Thanks!
				Notice: Please do not reply directly to this email. This email is not monitored for new messages.
		`;

				//configure information about who the email is going to, who its from,
				//as well as its subject and contents
				const mailOptions = {
					from: config.email.fromEmail, // Example: Jane Doe <janedoe@gmail.com>
					to: req.body.email || req.body.Email || req.body.EMAIL, //send to the address listed on the contact form
					bcc: [config.email.fromEmail, config.email.supportEmail].join(', '), // foo@gmail.com, bar@gmail.com
					subject: `New Form Submission (${new Date().toLocaleDateString(
						'en-US'
					)}, ${new Date().toLocaleTimeString()})`, // email subject
					html: emailBody, // email content in HTML
					text: emailBodyPlainText,
					replyTo: req.body.email || req.body.Email || req.body.EMAIL, //allows replying directly to the email
				};

				//send the email
				transporter.sendMail(mailOptions, (error, data) => {
					if (error) {
						sendSupportEmail(error, req);
						//if failure to send mail
						return res.status(500).send(error.toString());
					}
					data = JSON.stringify(data);
					//if success to send mail
					return res.status(200).send({
						message: `Your form was successfully submitted!`,
					});
				});
			} else {
				sendSupportEmail({ error: 'Bad Request: Incorrect key' }, req);
				//bad request (wrong key)
				return res.status(400).send({
					error: `Bad Request.`,
					message: `Please use the correct key to send an email through this service.`,
				});
			}
		})
		.catch((error) => {
			sendSupportEmail({ message: 'Server-side error: ', error }, req);
			//else, catch any other errors
			return res.status(500).send({
				error,
				message: 'There was a server-side error. Sorry for any inconvenience.',
			});
		});
};
