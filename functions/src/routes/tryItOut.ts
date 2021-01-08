// initialize firebase app
import { config, db, transporter } from "../config";
import { sendSupportEmail } from "../helpers/sendSupportEmail";
import { Request, Response } from "express";

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

export const tryItOut = async (req: MyRequest, res: Response) => {
	try {
		// first see if API key exists in database
		const APIDoc = await db.collection("keys").doc(req.body._private.key).get();
		// retrieve data from returned document (name, website, redirect, etc.)
		const APIData = APIDoc.data();

		// must match a key in the database
		if (!APIDoc.exists) {
			const error = {
				error: "Invalid API key.",
			};
			await sendSupportEmail(error, req);
			res.status(403).send(error);
		}

		// must match correct TYPE of key (contactForm, tryItOut, etc.)
		else if (APIData?.type !== "tryItOut") {
			const error = {
				error: "Invalid API key.",
			};
			await sendSupportEmail(error, req);
			res.status(403).send(error);
		}

		// else if all is well:
		else {
			// generate message based on request body
			// filter out private API data
			const messageList = `
			<p>Name: ${req.body.name}</p>
			<p>Email: ${req.body.email}</p>
			<p>Message: ${req.body.message}</p>
			`;

			// create email body based on information received from the database
			// and information received from the website sending the request
			const emailBody = `
			<p>Hi there,</p>
			<p>Thanks for trying out my Email API service.</p>
			<p>Here's the information you put into the form at austintheriot.com:</p>
			${messageList}
			<br/>
			<hr/>
			<p>Notice: Please do not reply directly to this email. This email address is not monitored for new messages.</p>
	`;

			const emailBodyPlainText = `
			Hi there,
			Thanks for trying out my Email API service.
			Here's the information you put into the form at austintheriot.com:
			${messageList}
			Notice: Please do not reply directly to this email. This email address is not monitored for new messages.
	`;

			// configure information about who the email is going to, who its from,
			// as well as its subject and contents
			const mailOptions = {
				from: config.email.fromEmail, // Example: Jane Doe <janedoe@gmail.com>
				to: req.body.email, // send to the address listed on the contact form
				bcc: [config.email.fromEmail, config.email.supportEmail].join(", "), // foo@gmail.com, bar@gmail.com
				subject: `New Form Submission (${new Date().toLocaleDateString(
					"en-US"
				)}, ${new Date().toLocaleTimeString("en-US")})`, // email subject
				html: emailBody, // email content in HTML
				text: emailBodyPlainText,
			};

			// send the email
			transporter.sendMail(mailOptions, async (error) => {
				if (error) {
					await sendSupportEmail(error, req);
					// if failure to send mail
					res.status(500).send(error);
				} else {
					// if success to send mail
					res.status(200).send({
						message: "Your form was successfully submitted!",
					});
				}
			});
		}
	} catch (error) {
		await sendSupportEmail({ message: "Server error: ", error }, req);
		// else, catch any other errors
		res.status(500).send({
			error,
			message: "There was a server error. Sorry for any inconvenience.",
		});
	}
};
