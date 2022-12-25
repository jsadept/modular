import mongoose from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose';

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String,
    email: { type: String, unique: true },
    fullname: String,
    
    tickets: [{
        ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
        event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' }
    }],

    eventMgr: [{
        event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
        startTime: Date,
        endTime: Date
    }],

    resetPasswordToken: String,
    resetPasswordExpires: Date,
    updatedOn: { type: Date, default: Date.now },
    createdOn: { type: Date, default: Date.now }
});

userSchema.plugin(passportLocalMongoose);
export default mongoose.model('User', userSchema);
