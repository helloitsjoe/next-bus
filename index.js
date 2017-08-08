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

harvardButton.addEventListener('click', async () => {
    // nowjs reference: https://zeit.co/docs/features/now-cli
    // now deploy [path]
    // now ls|list [app]
    // now rm|remove [id]
    const url = `https://server-rthfsibjjo.now.sh/traffic`;
    const json = await fetch(url).then(res => res.json());
    const trafficTime = json.routes[0].legs[0].duration_in_traffic.text
    trafficText.text = trafficTime;
    run(harvard);
});
centralButton.addEventListener('click', () => {
    run(central);
});
southStationButton.addEventListener('click', () => {
    run(southStation);
});

run(southStation);


async function run(route) {
    clearTimeout(timeout);
    const destUrl = `https://realtime.mbta.com/developer/api/v2/predictionsbystop?api_key=${Keys.NEXT_BUS}&stop=${route.code}&format=json`;
    const routeJSON = await fetch(destUrl).then(res => res.json());
    predict(routeJSON, route.name);

    timeout = setTimeout(() => {
        run(route);
    }, 5000);
}

function predict(data, dest) {
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

    document.getElementById('location').innerHTML = stopName;
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

    function isWalkable(el) {
        return el > 3 && el < 9;
    }

    if (nextArr.some(isWalkable)) {
        document.getElementById('body').style.backgroundColor = 'green';
    } else {
        document.getElementById('body').style.backgroundColor = 'red';
    }
}
