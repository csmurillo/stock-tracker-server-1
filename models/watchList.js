const mongoose = require('mongoose');

const StockSchema = mongoose.Schema({
    tickerName:{type:String, required:true},
    tickerSymbol:{type:String, required:true},
    alertDirection:{type:String, enum:['above','below'], required:true},
    alertPrice:{type:Number},
    priceTargetReached:{type:Boolean},
    datePriceTargetReached:{type:String}
});

const Stock = mongoose.model("Stock", StockSchema);

const WatchListSchema = mongoose.Schema({
    owner:{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    stocks:{
        type: [StockSchema]
    }
},{ timestamps: true });

const WatchList = mongoose.model('WatchList', WatchListSchema);

module.exports = { Stock, WatchList,StockSchema };
