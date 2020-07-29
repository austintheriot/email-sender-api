# ✉️ Email Sender API

## About This Project
As a freelance web developer, I was tired of trying to set up services for clients that would send emails after a form submission: there was never a guarantee that whatever hosting service they were using would support a server-side script, and trying to set up an economical 3rd-party emailing service was a nightmare for overhead costs. There was also never a guarantee of privacy when outsourcing email services. So instead, I set up my own Email Sender API using Firebase Cloud Functions to allow all of my static sites to send emails upon form submission (or for whatever other reasons) for free.

## Behind the scenes: 
This project uses Node.js, Express.js, the Express CORS middleware (to allow cross-origin scripting), and the Nodemailer module to send the emails. 

I chose to use Firebase cloud functions (to send emails via HTTP request) because of their generous free tier and ease of set up--unless I'm calling the service over 2,000,000 times a month, it's free. I also chose to use the Firebase Firestore to store my own, personally generated API keys and verify the API key of whatever website is requesting access (to limit unathorized access to the service).

## Cost: 
Although Firebase Cloud functions require a the Blaze, pay-as-you-go plan, their free tier is more than generous. Check out their pricing [here](https://firebase.google.com/pricing/).


## How to Use
If you're interested in using this project, clone or donwload the repsository and run $ npm install to install the dependencies for the project. 

You will also need to [set up your own Firebase project](https://firebase.google.com/). Once you've set up your own project, enable Firebase Firestore in the console. For more information, I recommend checking out the Firebase documentation, and especially their guide to [getting started with Cloud Functions](https://firebase.google.com/docs/functions/get-started?authuser=0).

This repo includes examples of everything you need in your own javascript file, except for the config.js information. You will need to create your own config.js file using your email and firebase information.

Example: 

    module.exports = {
        //Log in information for the email you would like to use:
        email: {
            username: 'Enter Your Email Here',
            password: 'Enter Your Password Here',
            fromEmail: 'Enter Whatever Email You Plan to Send From',
        },
        //Enter your firebaseConfig data here (you can copy and paste it from your project settings in the Firebase console):
        firebase: {
            apiKey: '..........',
            authDomain: '..........',
            databaseURL: '..........',
            projectId: '..........',
            storageBucket: '..........',
            messagingSenderId: '..........',
            appId: '..........',
            measurementId: '..........',
        },
      };
      
## Contact
Please feel free to reach out to me if you have any comments, suggestions, or requests. 
