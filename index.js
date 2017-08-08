const Keys = {
    MAPS: `AIzaSyBFZNJmIdgEElmzrhmjnILE1hwqmeoZAkA`,
    NEXT_BUS: `KUWzeVOvsUqr4i8TY_CTOw`
};

const harvard = { name: `Harvard`, code: `2056`, trafficUrl: `https://server-rthfsibjjo.now.sh/traffic` };
const central = { name: `Central`, code: `1436` };
const southStation = { name: `South Station`, code: `70080`}

const nextList = document.getElementById('nextList');
const trafficText = document.getElementById('trafficTime');

let timeout = null;

run(southStation);

async function run(route) {
    // TODO: Turn on loader
    clearTimeout(timeout);

    const destUrl = `https://realtime.mbta.com/developer/api/v2/predictionsbystop?api_key=${Keys.NEXT_BUS}&stop=${route.code}&format=json`;
    const routeJSON = await fetch(destUrl).then(res => res.json());

    if (route.trafficUrl) {
        const json = await fetch(route.trafficUrl).then(res => res.json());
        const trafficTime = json.routes[0].legs[0].duration_in_traffic.text
        trafficText.text = trafficTime;
    }
    if (!routeJSON.mode) {
        nextList.innerHTML = `<h1>No available data</h1>`;
        return;
    }

    const nextArr = [];
    const stopName = routeJSON.stop_name;
    const stop = routeJSON.mode[0].route[0].direction[0];
    const len = stop.trip.length;
    const minutesAway = (num) => {
        return Math.floor(stop.trip[num].pre_away / 60);
    }

    displayPrediction(route.name, stopName);

    // TODO: Turn off loader

    for (let i = 0; i < len; i++) {
        nextArr.push(minutesAway(i));
        const next = newElement('H1', nextList);
        const and = newElement('H2', nextList);
        next.innerHTML = minutesAway(i) + (minutesAway(i) > 1 ? ' minutes' : ' minute');
        and.innerHTML = i !== len - 1 ? 'and' : null;
    }

    const isWalkable = (el) => el > 3 && el < 9;
    const color = nextArr.some(isWalkable) ? 'green' : 'red';
    document.getElementById('body').style.backgroundColor = color;

    timeout = setTimeout(() => {
        run(route);
    }, 5000);
}

function displayPrediction(dest, stopName) {
    nextList.innerHTML = `<h2>The next bus to ${dest} will arrive at</h2>\n<h1 id='location'></h1><h2>in</h2>`;
    trafficText.innerHTML = `<h4>Time in traffic: ${trafficText.text}</h4>`;
    document.getElementById('location').innerHTML = stopName;
}

function newElement(tag, parent, classes = [], id = '') {
    let el = document.createElement(tag);
    parent.appendChild(el);
    for (let i = 0, len = classes.length; i < len; i++) {
        el.classList.add(classes[i]);
    }
    el.id = id;
    return el;
}
