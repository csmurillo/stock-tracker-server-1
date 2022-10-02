const fetch = require('node-fetch');
const { WatchList } = require('../models/watchList');

exports.watchlistTrackSingleStock= (socket,stockSymbol,stockPrice)=>{   
    console.log(socket.userID+'stockSymbol:'+stockSymbol+'Stock Price:'+stockPrice);

    WatchList.findOne({ owner: socket.userID}, async (err, watchList) => {
        const stocks=watchList.stocks;

        const date = new Date();
        const [month, day, year] = [date.getMonth(), date.getDate(), date.getFullYear()];

        for(let i =0; i<stocks.length;i++){  
            const alertPrice=stocks[i].alertPrice;    
            if(stockSymbol==stocks[i].tickerSymbol){
                console.log('insideStockSymbol'+stockSymbol+'Ticker Symbol'+stocks[i].tickerSymbol);
                if(stocks[i].alertDirection==='above'){
                    if(parseFloat(stockPrice)>parseFloat(alertPrice)){
                        stocks[i].priceTargetReached=true;
                        stocks[i].datePriceTargetReached=(month+1)+'/'+day+'/'+year;
                        
                        const stock={
                            tickerName:stocks[i].tickerName,
                            tickerSymbol:stocks[i].tickerSymbol,
                            priceAlert:stocks[i].alertPrice,
                            alertDirection:stocks[i].alertDirection,
                            datePriceTargetReached:stocks[i].datePriceTargetReached
                        };
                        // 
                        const stockHistoryRes=fetch(`http://localhost:3003/api/add/to/stock/history?owner=${watchList.owner}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                Accept: 'application/json',
                            },
                            body: JSON.stringify(stock)
                        })
                        .then(response => {
                            return response.json();
                        })
                        .catch(err =>{ return err;});
                        watchList.stocks=watchList.stocks.filter(stock=>stock.tickerSymbol!=stocks[i].tickerSymbol);
                        watchList.save((err,watchlist)=>{
                            if(err){
                                console.log('error'+err);
                            }
                            console.log(watchlist);
                        });
                        socket.emit('stockAlertPriceReached',{reached:true});
                    }
                }
                else if(stocks[i].alertDirection==='below'){
                    if(parseFloat(stockPrice)<parseFloat(alertPrice)){
                        stocks[i].priceTargetReached=true;
                        stocks[i].datePriceTargetReached=(month+1)+'/'+day+'/'+year;


                        const stock={
                            tickerName:stocks[i].tickerName,
                            tickerSymbol:stocks[i].tickerSymbol,
                            priceAlert:stocks[i].alertPrice,
                            alertDirection:stocks[i].alertDirection,
                            datePriceTargetReached:stocks[i].datePriceTargetReached
                        };
                        // 
                        const stockHistoryRes=fetch(`http://localhost:3003/api/add/to/stock/history?owner=${watchList.owner}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                Accept: 'application/json',
                            },
                            body: JSON.stringify(stock)
                        })
                        .then(response => {
                            return response.json();
                        })
                        .catch(err =>{ return err;});

                        watchList.stocks=watchList.stocks.filter(stock=>stock.tickerSymbol!=stocks[i].tickerSymbol);
                        watchList.save((err,watchlist)=>{
                            if(err){
                                console.log('error'+err);
                            }
                            console.log(watchlist);
                        });
                        socket.emit('stockAlertPriceReached',{reached:true});
                    }
                }
            }
        }

    });
    return;
}; 