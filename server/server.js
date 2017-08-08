var express = require('express')
var app = express()

const Keys = {
    MAPS: `AIzaSyBFZNJmIdgEElmzrhmjnILE1hwqmeoZAkA`,
    NEXT_BUS: `KUWzeVOvsUqr4i8TY_CTOw`
};


// Call the traffic API on behalf of our own webpage to get around cross origin limitations
app.get('/traffic', function (req, res) {
    getTrafficTime(res)
})

app.listen(80, function () {
  console.log('Example app listening on port 80!')
})

function getTrafficTime(res) {
    let q = {
        origin: `394+Mt+Auburn+St+Watertown+MA`,
        dest: `115+Mt+Auburn+St+Cambridge+MA`,
        depart: `now`,
    }
    var request = require('request')
    const options = {
        url: `https://maps.googleapis.com/maps/api/directions/json?origin=${q.origin}&destination=${q.dest}&departure_time=${q.depart}&key=${Keys.MAPS}`,
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Accept-Charset': 'utf-8',
            'User-Agent': 'my-maps-client'
        }
    };
    request(options, function(err, _, body) {
        let json = JSON.parse(body);
        //console.log( JSON.stringify(json,null, "  ") );

        res.set('Access-Control-Allow-Origin', '*');
        res.json(json);
    });

}

setInterval(()=>{
    console.log('hi');
},1000);
