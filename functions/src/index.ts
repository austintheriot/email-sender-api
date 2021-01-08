import * as functions from "firebase-functions";
import * as cors from "cors";
import {body} from "express-validator";
import {app} from "./config";
import {contactForm} from "./routes/contactForm";
import {tryItOut} from "./routes/tryItOut";

app.use(cors({origin: true}));

app.post(
    "/contactForm",
    [body("Email").escape(), body("Name").escape(), body("Message").escape()],
    contactForm
);

app.post(
    "/tryItOut",
    [body("Email").escape(), body("Name").escape(), body("Message").escape()],
    tryItOut
);

export const sendEmail = functions.https.onRequest(app);
