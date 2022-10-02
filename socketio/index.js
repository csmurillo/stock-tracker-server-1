const fetch = require('node-fetch');
const { WatchList } = require('../models/watchList');

const {watchlistTrackSingleStock}=require('../helpers/watchlistFunctions.js');

exports = module.exports = function(io){
    // middleware 
    io.use((socket, next) => {
        const userID = socket.handshake.auth.id;
        socket.userID = userID;
        next();
    });
    // set socketio stream
    io.on('connection', async(socket) => {

        let timer=null;
        let stopTimer=false;

        // return a promise of a particluar stock price
        const getStockPricePromise = async(stockSymbol)=>{
            // mock data
            const finnhub=`https://mockstockapi.herokuapp.com/api/stockLivePrice?stock=${stockSymbol}`;
            // live data
            // const finnhub=`https://finnhub.io/api/v1/quote?symbol=${stockSymbol}&token=${process.env.STOCK_INFO_FINNHUB_API_KEY}`;
            const finnhubRes=await fetch(finnhub);
            const pricePromise=await finnhubRes.json();
            return pricePromise;
        };

        // setTimer is a recursive function that each time 5 minutes in an hour
        // it sends the current stock price of a particular stock 
        const setTimer= (stockSymbol)=>{
            return setTimeout(async() => {
                if(!stopTimer){
                    console.log('timer set');
                    const newYorkDate = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
                    // const newYorkDate = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
                    const newYorkTime = new Date(newYorkDate);
                    // for debugging purposes
                    // const newYorkTime = new Date();
                    const hour = newYorkTime.getHours();
                    const minutes = newYorkTime.getMinutes();
                    console.log(hour+':'+minutes);
                    const time = hour+':'+minutes;
                    const pricePromise = await getStockPricePromise(stockSymbol);

                    // mock data
                    const stockPrice = pricePromise.price;
                    const stockChangePrice = pricePromise.changePrice;
                    const stockChangePricePercentage = pricePromise.changePricePercentage;

                    watchlistTrackSingleStock(socket,stockSymbol,stockPrice);

                    // live data
                    // const stockPrice = pricePromise.c;
                    if(minutes%5==0){
                        socket.emit('streamMod5LivePrice',{price:stockPrice,time});
                        // console.log('sent streamstockpricetime');
                    }
                    else{
                        socket.emit('streamStockLivePrice',{price:stockPrice,changePrice:stockChangePrice,changePricePercentage:stockChangePricePercentage,time});
                        // console.log('sent streamStockLivePrice');
                    }

                    setTimer(stockSymbol);
                }
            },2000);
        };
        // server listens on socket line startStreamServerStockPrice and establishes a recurrent connection
        // that sends the current stock price of a particular stock and the time of each price concurrently
        // each 5 minutes in an hour
        socket.on('startStreamServerStockPrice',({stockSymbol})=>{
            console.log('this is the stock symbol'+stockSymbol);
            const newYorkDate = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
            // New York Time
            // const newYorkDate = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
            const newYorkTime = new Date(newYorkDate);
            let hour = newYorkTime.getHours();
            let minutes = newYorkTime.getMinutes();

            // if(newYorkTime.getDate()!=0||newYorkTime.getDate()!=6){
                // for debuggin purposes
                // timer = setTimer(stockSymbol);
                if(hour >= 9 && hour <= 16 ){
                    // special case under 9:30 o'clock & everything over 4pm
                    if((hour==9&&minutes<30)||(hour==16&&minutes>=0)){
                        // console.log('not valid');
                    }
                    else{
                        timer = setTimer(stockSymbol);
                    }
                }
                else{
                    // console.log('too late');
                }
            // }
        });

        let watchListTimer = null;
        let stopWatchListPriceConnection=false;

        const setWatchListPriceConnection = (socket,stocks) => {
            console.log('Watchlist:');
            console.log(stocks);
            return setTimeout(async() => {
                if(!stopWatchListPriceConnection){

                    const newYorkDate = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
                    // const newYorkDate = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
                    const newYorkTime = new Date(newYorkDate);
                    // const newYorkTime = new Date();
                    const hour = newYorkTime.getHours();
                    const minutes = newYorkTime.getMinutes();
                    // console.log(hour+':'+minutes);
                    const time = hour+':'+minutes;
                    // const pricePromise = await getStockPricePromise(stockSymbol);
                    // mock data
                    // const stockPrice = pricePromise.price;
                    // live data
                    // const stockPrice = pricePromise.c;
                    if(minutes%1==0){
                        console.log('1 min have passed')
                        for(let i=0; i<stocks.length;i++){
                            let stockSymbol=stocks[i].stockSymbol;
                            // mock data
                            const finnhub=`https://mockstockapi.herokuapp.com/api/stockLivePrice?stock=${stockSymbol}`;
                            // live data
                            // const finnhub=`https://finnhub.io/api/v1/quote?symbol=${stockSymbol}&token=${process.env.STOCK_INFO_FINNHUB_API_KEY}`;
                            const finnhubRes=await fetch(finnhub);
                            const finnStockPriceData=await finnhubRes.json();
                            // mock data
                            let stockLivePrice = finnStockPriceData.price;
                            // live data
                            // let stockLivePrice=finnStockPriceData.c;
                            stocks[i].livePrice=stockLivePrice;
                            watchlistTrackSingleStock(socket,stockSymbol,stockLivePrice);
                        }
                        socket.emit('serverWatchlistLivePriceStream',{stocks});
                    }
                    setWatchListPriceConnection(socket,stocks);
                }
            },2000);
        };

        // server listens on socket line serverWatchlistPriceSteam and returns stocks liveprices
        socket.on('serverWatchlistPriceSteam',async ({stocks})=>{
             // New York Time
             const newYorkDate = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
            //  const newYorkDate = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
             const newYorkTime = new Date(newYorkDate);
             let hour = newYorkTime.getHours();
             let minutes = newYorkTime.getMinutes();
            console.log('time'+hour+':'+minutes);
             if(newYorkTime.getDate()!=0||newYorkTime.getDate()!=6){
                 // for debuggin purposes
                 // timer = setTimer(stockSymbol);
                 if(hour >= 9 && hour <= 16 ){
                     // special case under 9:30 o'clock & everything over 4pm
                     if((hour==9&&minutes<30)||(hour==16&&minutes>=0)){
                            // console.log('not valid');
                            for(let i=0; i<stocks.length;i++){
                                let stockSymbol=stocks[i].stockSymbol;
                                // mock data
                                const finnhub=`https://mockstockapi.herokuapp.com/api/stockLivePrice?stock=${stockSymbol}`;
                                // live data
                                // const finnhub=`https://finnhub.io/api/v1/quote?symbol=${stockSymbol}&token=${process.env.STOCK_INFO_FINNHUB_API_KEY}`;
                                const finnhubRes=await fetch(finnhub);
                                const finnStockPriceData=await finnhubRes.json();
                                // mock data
                                let stockLivePrice = finnStockPriceData.price;
                                // live data
                                // let stockLivePrice=finnStockPriceData.c;
                                stocks[i].livePrice=stockLivePrice;
                                watchlistTrackSingleStock(socket,stockSymbol,stockLivePrice);
                            }
                            socket.emit('serverWatchlistLivePriceStream',{stocks});
                     }
                     else{
                        watchListTimer = setWatchListPriceConnection(socket,stocks);
                     }
                 }
                 else{
                     console.log('too late');
                     for(let i=0; i<stocks.length;i++){
                        let stockSymbol=stocks[i].stockSymbol;
                        // mock data
                        const finnhub=`https://mockstockapi.herokuapp.com/api/stockLivePrice?stock=${stockSymbol}`;
                        // live data
                        // const finnhub=`https://finnhub.io/api/v1/quote?symbol=${stockSymbol}&token=${process.env.STOCK_INFO_FINNHUB_API_KEY}`;
                        const finnhubRes=await fetch(finnhub);
                        const finnStockPriceData=await finnhubRes.json();
                        // mock data
                        let stockLivePrice = finnStockPriceData.price;
                        // live data
                        // let stockLivePrice=finnStockPriceData.c;
                        stocks[i].livePrice=stockLivePrice;
                    }
                    console.log('stocks');
                    console.log(JSON.stringify(stocks));
                    socket.emit('serverWatchlistLivePriceStream',{stocks});
                 }
             }
            
        });

        // server listens on socket line serverStockPrice and returns stock, stockPrice
        socket.on('serverStockPrice',async ({stockSymbol})=>{
            console.log('serverStockPrice~!');
            // mock data
            const finnhub=`https://mockstockapi.herokuapp.com/api/stockLivePrice?stock=${stockSymbol}`;
            // live data
            // const finnhub=`https://finnhub.io/api/v1/quote?symbol=${stockSymbol}&token=${process.env.STOCK_INFO_FINNHUB_API_KEY}`;
            const finnhubRes=await fetch(finnhub);
            const finnStockPriceData=await finnhubRes.json();
            // console.log('price'+finnStockPriceData.c);
            // mock data
            socket.emit('clientStockPrice',{stockSymbol, stockPrice:finnStockPriceData.price});
            // live data
            // socket.emit('clientStockPrice',{stockSymbol, stockPrice:finnStockPriceData.c});
        });

        // once user socket connection requesting live price ends, stop recursive function setTimer() 
        socket.on("disconnect", () => {
            stopWatchListPriceConnection=true;
            stopTimer=true;
            clearTimeout(timer);
            clearTimeout(watchListTimer);
        });

    });

}


