const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const cors = require('cors')({ origin: true });
const config = require('./config');

admin.initializeApp();

exports.sendEmail = functions.https.onRequest((req, res) => {
	if (req.body.key === config.key) {
		return cors(req, res, () => {
			// getting dest email by query string
			// const dest = req.query.dest;

			//generate message based on request body
			//DO NOT include meessage if the message is the key or website source
			let messageList = [...Object.keys(req.body)]
				.filter((key) => !key.match(/key/gi) && key !== 'source')
				.map((key) => {
					console.log(key, req.body[key]);
					return `<p>${key}: ${req.body[key]}</p>`;
				})
				.join(' ');

			let emailBody = `
        <p>You have received a new form submission for your website, ${req.body.Source}:</p>
        ${messageList}
        <br/>
        <br/>
        <br/>
        <p>Notice: Please do not reply directly to this email.</p>
      `;

			let transporter = nodemailer.createTransport({
				host: 'smtp.gmail.com',
				auth: {
					type: 'login', // default
					user: config.username,
					pass: config.password,
				},
			});

			const mailOptions = {
				from: config.fromEmail, // Something like: Jane Doe <janedoe@gmail.com>
				to: config.toEmail,
				subject: `New Form Submission (${new Date().toLocaleDateString()}, ${new Date().toLocaleTimeString()})`, // email subject
				html: emailBody, // email content in HTML
			};

			// returning result
			transporter.sendMail(mailOptions, (error, data) => {
				if (error) {
					return res.send(error.toString());
				}
				data = JSON.stringify(data);
				return res.status(200).send({ message: `Sent!`, email: emailBody });
			});
		});
	} else {
		return res.status(400).send({
			error: `Unauthorized Request. Please use the correct key to send an email through this service.`,
		});
	}
});
