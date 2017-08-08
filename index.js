const nb = new XMLHttpRequest();
const mapsRequest = new XMLHttpRequest();
const Keys = {
    MAPS: `AIzaSyBFZNJmIdgEElmzrhmjnILE1hwqmeoZAkA`,
    NEXT_BUS: `KUWzeVOvsUqr4i8TY_CTOw`
};
const harvard = { name: `Harvard`, code: `2056` };
const central = { name: `Central`, code: `1436` };
const southStation = { name: `South Station`, code: `70080`}
const harvardButton = document.getElementById('harvardButton');
const centralButton = document.getElementById('centralButton');
const southStationButton = document.getElementById('southStationButton');
const nextList = document.getElementById('nextList');
const trafficText = document.getElementById('trafficTime');

let timeout = null;

harvardButton.addEventListener('click', () => {
    traffic((err, json)=>{
        const trafficTime = json.routes[0].legs[0].duration_in_traffic.text;
        trafficText.text = trafficTime;
        run(harvard);
    });
});
centralButton.addEventListener('click', () => {
    run(central);
});
southStationButton.addEventListener('click', () => {
    run(southStation);
});

run(southStation);

// traffic((trafficResponse) => {
//     console.log(trafficResponse);
//     run(harvard);
// });

function traffic(callback) {
    get( `https://server-rthfsibjjo.now.sh/traffic`, callback );
    // nowjs reference: https://zeit.co/docs/features/now-cli
    // now deploy [path]
    // now ls|list [app]
    // now rm|remove [id]
}

function get(url, cb){
    var request = new XMLHttpRequest();
    request.onreadystatechange = function(){
        if (request.readyState === XMLHttpRequest.DONE) {
            if (request.status === 200) {
                cb(null, JSON.parse(request.responseText));
            } else {
                cb( new Error('GET error. URL: ' + url) );
            }
        }
    }
    request.open('GET', url);
    request.send();
}

function run(route) {
    clearTimeout(timeout);
    nextList.innerHTML = '';
    nb.addEventListener('load', (res) => {
        predict(res, route.name);
    });
    nb.open("GET", getRoute(route.code));
    nb.send();

    timeout = setTimeout(() => {
        run(route);
    }, 5000);
}

function getRoute(dest) {
    return `https://realtime.mbta.com/developer/api/v2/predictionsbystop?api_key=${Keys.NEXT_BUS}&stop=${dest}&format=json`;
}
//https://realtime.mbta.com/developer/api/v2/predictionsbystop?api_key=KUWzeVOvsUqr4i8TY_CTOw&stop=${dest}&format=json

function predict(res, dest) {
    // console.log(JSON.parse(res.target.response).mode[0].route[0].direction[0].trip[0].pre_away);
    const data = JSON.parse(res.target.response);
    if (!data.mode) {
        nextList.innerHTML = `<h1>No available data</h1>`;
        return;
    }
    const stopName = data.stop_name;
    const stop = data.mode[0].route[0].direction[0];
    const len = stop.trip.length;
    const secondsAway = (num) => {
        return stop.trip[num].pre_away;
    };
    const minutesAway = (num) => {
        return Math.floor(secondsAway(num) / 60);
    }

    nextList.innerHTML = `<h2>The next bus to ${dest} will arrive at</h2>\n<h1 id='location'></h1><h2>in</h2>`;
    trafficText.innerHTML = `<h4>Time in traffic: ${trafficText.text}</h4>`

    const location = document.getElementById('location');
    location.innerHTML = stopName;
    const nextArr = [];

    for (let i = 0; i < len; i++) {
        nextArr.push(minutesAway(i));

        const next = document.createElement('H1');
        nextList.appendChild(next);
        next.innerHTML = minutesAway(i) + (minutesAway(i) > 1 ? ' minutes' : ' minute');
        if (i !== len - 1) {
            const and = document.createElement('H2');
            nextList.appendChild(and);
            and.innerHTML = 'and';
        }
    }

    // let nearest = Math.min.apply(null, nextArr);
    // console.log(nearest);

    // function getTrafficTime() {
    //     // let q = {
    //     //     origin: `394+Mt+Auburn+St+Watertown+MA`,
    //     //     dest: `115+Mt+Auburn+St+Cambridge+MA`,
    //     //     depart: `now`,
    //     // }
    //     // return `localhost:80/traffic`;
    //     return `https://server-rthfsibjjo.now.sh/traffic`;
    // }

    function isWalkable(el, idx, arr) {
        return el > 3 && el < 9;
    }

    if (nextArr.some(isWalkable)) {
        document.getElementById('body').style.backgroundColor = 'green';
    } else {
        document.getElementById('body').style.backgroundColor = 'red';
    }
}
