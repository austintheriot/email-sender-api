import * as functions from 'firebase-functions';
import { db } from '../config';

//This function ensures that each task is idempotent
export const executeOnce = (
	change: functions.Change<functions.firestore.DocumentSnapshot>,
	context: functions.EventContext,
	task: { (transaction: FirebaseFirestore.Transaction): void }
) => {
	//before executing transaction, check database to make sure that the event has not already been processed
	const eventRef = db.collection('events').doc(context.eventId);

	return db.runTransaction(async (transaction) => {
		try {
			const documentSnapshot = await transaction.get(eventRef);
			if (documentSnapshot?.exists) task(transaction);
			transaction.set(eventRef, { processed: true });
		} catch (err) {
			console.log(err);
		}
	});
};
