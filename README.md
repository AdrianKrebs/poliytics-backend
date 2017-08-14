## Swiss Poliytics Backend

A Node Express Mongoose application collecting tweets about swiss politicians.

Read the [wiki](https://github.com/madhums/node-express-mongoose/wiki) to understand how the application is structured.

## Usage

You need [MongoDB](https://www.mongodb.com) installed and running (mongod.exe)

    $ git clone https://github.com/madhums/node-express-mongoose.git
    $ cd node-express-mongoose
    $ npm install
    $ cp .env.example .env
    $ npm start
    
### API

Get tweets for a specific user id: <br>
`GET http://localhost:3000/tweets/user/id/168234077`

Get the 30 newest tweets (pagination) <br>
`GET http://localhost:3000/tweets` <br>

next page <br>
`http://localhost:3000/tweets?page=1`<br>

load by name <br>
`http://localhost:3000/tweets/user/name/Roger+Nordmann`<br>


load by party name <br>
`http://localhost:3000/tweets/user/SVP`<br>


### Debugging

`nodemon --inspect server.js` <br>
navigate to `chrome://inspect` and click `Open dedicated DevTools for Node` (Chrome 60)


## Deploy on Heroku



## License

MIT
