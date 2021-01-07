//initialize firebase app
import { config, db, transporter } from '../config';
import { sendSupportEmail } from '../helpers/sendSupportEmail';
import { Request, Response } from 'express';

interface MyRequest extends Request {
	body: {
		name: string;
		email: string;
		message: string;

		_private: {
			key: string;
		};
	};
}

export const contactForm = async (req: MyRequest, res: Response) => {
	try {
		//first see if API key exists in database
		const APIDoc = await db.collection('keys').doc(req.body._private.key).get();
		//retrieve data from returned document (name, website, redirect, etc.)
		const APIData = APIDoc.data();

		//must match a key in the database
		if (!APIDoc.exists) {
			const error = {
				error: 'Invalid API key.',
			};
			await sendSupportEmail(error, req);
			res.status(403).send(error);
		}

		//must match correct TYPE of key (contactForm, tryItOut, etc.)
		else if (APIData?.type !== 'contactForm') {
			const error = {
				error: 'Unauthorized API key',
			};
			await sendSupportEmail(error, req);
			res.status(500).send(error);
		}

		//else if all is well:
		else {
			//Limit this API end point to Name, Email, and Message alon
			const messageList = `
			<p>Name: ${req.body.name}</p>
			<p>Email: ${req.body.email}</p>
			<p>Message: ${req.body.message}</p>
			`;

			//create email body based on information received from the database
			//and information received from the website sending the request
			const emailBody = `
			<p>Hi ${APIData.name || 'there'},</p>
			<p>You have received a new form submission for ${
				APIData.website || 'your website'
			}:</p>
			${messageList}
			<br/>
			<hr/>
			<p>Notice: You may respond by replying directly to this email.</p>
			<p>To opt out of future emails, please contact the developer of this service at <a href=${
				config.email.contactForm
			}>austintheriot.com/contact</a>.</p>
	`;

			const emailBodyPlainText = `
			Hi ${APIData.name || 'there'},
			You have received a new form submission for ${
				APIData.website || 'your website'
			}:
			${messageList}
			Notice: You may respond by replying directly to this email.
			To opt out of future emails, please contact the developer of this service directly by emailing him at ${
				config.email.contactForm
			}.
	`;

			//configure information about who the email is going to, who its from,
			//as well as its subject and contents
			const mailOptions = {
				from: config.email.fromEmail, // Example: Jane Doe <janedoe@gmail.com>
				to: APIData.toEmail,
				bcc: config.email.fromEmail, // foo@gmail.com, bar@gmail.com
				subject: `New Form Submission (${new Date().toLocaleDateString(
					'en-US'
				)}, ${new Date().toLocaleTimeString('en-US')})`, // email subject
				html: emailBody, // email content in HTML
				text: emailBodyPlainText,
				replyTo: req.body.email, //allows replying directly to the email
			};

			//send the email
			transporter.sendMail(mailOptions, async (error) => {
				if (error) {
					await sendSupportEmail(error, req);
					//if failure to send mail
					res.status(500).send(error);
				} else {
					//if success to send mail
					res.status(200).send({
						message: `Your form was successfully submitted!`,
					});
				}
			});
		}
	} catch (error) {
		await sendSupportEmail({ message: 'Server error: ', error }, req);

		//else, catch any other errors
		res.status(500).send({
			error,
			message: 'There was a server error. Sorry for any inconvenience.',
		});
	}
};
