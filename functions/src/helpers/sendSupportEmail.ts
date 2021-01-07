import { config, transporter } from '../config';

export const sendSupportEmail = async (
	message: { [key: string]: string } | Error,
	req: any
) => {
	try {
		//Get as much information as possible
		const emailHtml = `
		<p>Error Message from Function:</p>
		<p>${JSON.stringify(message)}</p>
		<p>Req Body Information:</p>
		<p>${JSON.stringify(req.body)}</p>
		`;

		const emailText = `
		Error Message from Function: 
		${JSON.stringify(message)}
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
			)}, ${new Date().toLocaleTimeString('en-US')})`, // email subject
			html: emailHtml, // email content in HTML
			text: emailText,
		};

		//send the email
		return transporter.sendMail(mailOptions);
	} catch (err) {
		console.error(err);
	}
};
