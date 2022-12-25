import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    status: String, 
    seats: [{
        row: Number,
        col: Number
    }],
    price: Number,
    
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedOn: { type: Date, default: Date.now },
    createdOn: { type: Date, default: Date.now }
});

export default mongoose.model('Ticket', ticketSchema);
