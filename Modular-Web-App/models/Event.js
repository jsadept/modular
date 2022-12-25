import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    name: String,
    description: String,

    venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue' },
    startTime: Date,
    endTime: Date,
    seats: {
        rows: Number,
        cols: Number,
        ticketCategories: [{
           price: Number, 
           row: Number
        }],
        available: [Boolean] 
    },
    
    maximumTickets: Number,
    ticketsSoldCount: {type: Number, default: 0},
    ticketsSold: [{
        name: String,
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' }
    }],
    isSoldOut: { type: Boolean, default: false },
    
    isActive: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedOn: { type: Date, default: Date.now },
    createdOn: { type: Date, default: Date.now }
});

eventSchema.methods.isSeatAvailable = function(row, col){
    const maxRows = this.seats.rows;
    const maxCols = this.seats.cols;
    
    if (maxRows < row || maxCols < col) {
        return false; 
    }

    const index = row * maxCols + col;
    if( this.seats.available[index] == false ) {
        return false;
    }
    return true;
};

eventSchema.methods.getPrice = function(row, col){
    for(let i=0; i < this.seats.ticketCategories; i++) {
        const tickCat = this.seats.ticketCategories[i];
        if(tickCat.row == row) {
            return tickCat.price;
        }
    }
    return 0;
};

export default mongoose.model('Event', eventSchema);
