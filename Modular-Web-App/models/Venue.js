import mongoose from 'mongoose';
const venueSchema = new mongoose.Schema({
    name: String,
    address: String,
    phone: String,
    seats: {
        rows: Number,
        cols: Number,
        total: Number
    },
    bookedDates: [{
        startTime: Date,
        endTime: Date,
        event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
        bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    isActive: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedOn: { type: Date, default: Date.now },
    createdOn: { type: Date, default: Date.now }
});
export default mongoose.model('Venue', venueSchema);
