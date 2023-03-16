mapboxgl.accessToken = 'pk.eyJ1IjoiZGF1ZGk5NyIsImEiOiJjanJtY3B1bjYwZ3F2NGFvOXZ1a29iMmp6In0.9ZdvuGInodgDk7cv-KlujA';
        
        // colors
        let colors = [
            '#88CCEE', '#CC6677', '#DDCC77', '#117733', '#332288', '#AA4499', 
            '#44AA99', '#999933', '#882255', '#661100', '#6699CC', '#888888', '#f6edbd'
        ];

        // let colors = ['#3d5941', '#778868', '#b5b991', '#f6edbd', '#edbb8a', '#de8a5a', '#ca562c', '#008080', '#70a494', '#b4c8a8', '#f6edbd', '#edbb8a', '#de8a5a', '#ca562c'];
        
        let places = [
            {"Id":0,"Name":"Miami","Lat":25.7824664,"Lon":-80.5000894 }, {"Id":1,"Name":"Atlanta","Lat":33.7675738,"Lon":-84.5602184},
            {"Id":2,"Name":"Chicago","Lat":41.8339042,"Lon":-88.0121592}, {"Id":3,"Name":"New York","Lat":40.6976701,"Lon":-74.259877},
            {"Id":4,"Name":"Dallas","Lat":32.8209296,"Lon":-97.0117533}, {"Id":5,"Name":"Los Angeles","Lat":34.0207305,"Lon":-118.6919326},
            {"Id":6,"Name":"San Francisco","Lat":37.757815,"Lon":-122.5076408}, {"Id":7,"Name":"Seattle","Lat":47.6131746,"Lon":-122.4821502},
            {"Id":8,"Name":"Portland","Lat":45.5428688,"Lon":-122.7944872}, {"Id":9,"Name":"Pheonix","Lat":33.470882,"Lon":-112.3561069},
            {"Id":10,"Name":"Denver","Lat":39.7254496,"Lon":-105.0583699}, {"Id":11,"Name":"Nashville","Lat":36.15650908,"Lon":-86.77887538},
            {"Id":12,"Name":"Charlotte","Lat":35.225353,"Lon":-80.89115}
        ];
        
        let routingInstance, popupItem;
        let originMarkers = [], destinationMarkers = [], statesMarkers, statesEntries;

        const map = new mapboxgl.Map({
            container: 'map', // container ID
            style: 'mapbox://styles/mapbox/streets-v11', // style URL
            center: [-99.16265728992448, 39.073482949062736], // starting position [lng, lat]
            projection:'mercator',
            zoom: 3.2 // starting zoom
        });

        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        map.on("load", () => {
            let lineColors = getRouteExpression();

            map.addSource("states", {
                type:"geojson",
                data:"states.geojson"
            });

            map.addLayer({
                id:"states",
                source:"states",
                type:"line",
                paint:{
                    "line-color":"#222",
                    // "line-outline-color":"#fff",
                    "line-opacity":0.3
                }
            }, "");

            // all the routes: 
            map.addSource("route", {
                type:'geojson',
                data:'https://davincikab.github.io/movers-routes/data.json'
            });

            map.addLayer({
                id:'route-line-case',
                source:'route',
                type:'line',
                paint:{
                    "line-color":"#fff",
                    // "line-color":[
                    //     'match',
                    //     ['get','selected'],
                    //     'true',
                    //     'gold',
                    //     'false',
                    //     '#555',
                    //     '#555'
                    // ],
                    "line-width":2.2
                }
            });

            // 
            map.addLayer({
                id:'route-line',
                source:'route',
                type:'line',
                paint:{
                    "line-color":'#088faa',
                    // ['get', 'color'],
                    "line-width":1
                }
            });

            // sources
            map.addSource("mover-locations", {
                type:'geojson',
                data:{ "type":"FeatureCollection", "features":[] }
            });

            map.addLayer({
                id:'mover-locations',
                type:'circle',
                source:'mover-locations',
                layout:{'visibility':'none'},
                paint:{
                    'circle-color':'#314356',
                    'circle-stroke-color':'#666',
                    'circle-stroke-width':1,
                    'circle-opacity':0.6,
                    'circle-radius':[
                        'interpolate',
                        ['linear'],
                        ['get', 'count'],
                        0,
                        5,
                        20,
                        10
                    ]
                }
            });

            map.on("mouseover", "mover-locations", (e) => {

                if(e.features[0]) {
                    let place = e.features[0];

                    
                    popupItem = new mapboxgl.Popup({ focusAfterOpen:false });
                    popupItem
                        .setLngLat(e.lngLat)
                        .setHTML(`<div class="popup-content">
                            <div class="popup-title">${place.properties.origin_address }</div>
                        </div>`)
                        .addTo(map);
                }
                
                handelMouseover();
            });
            map.on("mouseleave",  "mover-locations", handelMouseleave);

            map.on("mouseover", "states", handelMouseover);
            map.on("mouseleave",  "mover-locations", handelMouseleave);

            function handelMouseover() {  map.getCanvas().style.cursor= "pointer"; }
            function handelMouseleave() {  map.getCanvas().style.cursor= ""; popupItem.remove(); }
            
            // user routes
            map.addSource('user-route', {
                type:'geojson',
                // data:'./data.json'
                data:{"type":"FeatureCollection", "features":[]}
            });

            map.addLayer({
                id:'user-route-case',
                source:'user-route',
                type:"line",
                paint:{
                    "line-color":"#7C7D7E",
                    "line-width":4
                }
            });

            map.addLayer({
                id:'user-route',
                source:'user-route',
                type:"line",
                paint:{
                    "line-color":"#333",
                    "line-width":2.5
                }
            });

            // read the csv file
            let docUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTiOE5yJooDmMEiZdmUoVM0PQxv7dRnpyLBHNQGlAFOIyY8wODOGlPM7KzR5EN9NkShAAvH1_Mig9HL/pub?output=xlsx";
            
            fetch(docUrl)
                .then(res => res.arrayBuffer())
                .then(arrBuf => {
                    var workbook = XLSX.read(arrBuf, {type:"binary", cellDates: true, dateNF:"dd/mm/yy"});
                    
                    console.log(workbook);
                    let sheets = processWorkbook(workbook);

                    console.log(sheets);

                    // renderListingViewSection(sheets);
                    // fireSortListeners(sheets);

                    spinner.toggle();

                    customSequenceForm.setSheets(sheets);
                })
                .catch(console.error)

            d3.csv('https://davincikab.github.io/movers-routes/trucks_locations.csv')
            .then(data => {
                data = data.slice(0, -1).filter(item => item['From'] && item['origin_x']);
                console.log(data);

                let uniqueLocations = getUniqueLocations(data);
                map.getSource('mover-locations').setData(uniqueLocations);

                // route data
                fetch('https://davincikab.github.io/movers-routes/data.json')
                    .then(res => res.json())
                    .then(dataRoute => {

                        dataRoute.features = dataRoute.features.map(ft => {
                            let entry = data.find(item => item.fid == ft.properties.fid);

                            if(entry) {
                                ft.properties = { ...ft.properties, ...entry };
                            }

                            return ft;
                        });

                        routingInstance.places = [ ...data ];
                        routingInstance.routesGeojson = dataRoute;

                        customDirection.triggerGeolocation();

                    })
                    .catch(console.error);

                renderMarkers(data);

                updateSelectionOptions(data);
                // renderListingSections(data);

                updateStatesData(data);

            }).catch(console.error);

        });

        function processWorkbook(workbook) {
            let sheetsNames = [...workbook.SheetNames];
            let sheets = {};
        
            sheetsNames.forEach(sheetName => {
                sheets[sheetName] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {cellDates:true, dateNF:"dd/mm/yy"});
            });
        
            return sheets;
        }


        function renderListingViewSection(sheets) {
            let rateSheet = sheets['Hoja 2'];

            console.log(rateSheet);

            let theads = Object.keys(rateSheet[0]).map(entry => {
                return `<th> <button id="${entry}">${entry}</button></th>`;
            })

           
            document.getElementById("table-head").innerHTML = theads.join("");

            renderTableContent(rateSheet);
        }

        function fireSortListeners(sheets) {
            const tableButtons = document.querySelectorAll("th button");
            let data = sheets['Hoja 2'];

            tableButtons.forEach(button => {

                button.addEventListener("click", (e) => {
                    console.log(e);
        
                    if (e.target.getAttribute("data-dir") == "desc") {
                      sortData(data, e.target.id, "desc");
                      e.target.setAttribute("data-dir", "asc");
                    } else {
                      sortData(data, e.target.id, "asc");
                      e.target.setAttribute("data-dir", "desc");
                    }
                    
                });

            });
            
        }

        const sortData = (data, param, direction = "asc") => {
            // tableContent.innerHTML = '';

            const sortedData =
              direction == "asc"
                ? [...data].sort(function (a, b) {
                    if (a[param] < b[param]) {
                      return -1;
                    }
                    if (a[param] > b[param]) {
                      return 1;
                    }
                    return 0;
                  })
                : [...data].sort(function (a, b) {
                    if (b[param] < a[param]) {
                      return -1;
                    }
                    if (b[param] > a[param]) {
                      return 1;
                    }
                    return 0;
                  });
            
            // 
            // getTableContent(sortedData);
            renderTableContent(sortedData);
        };

        function renderTableContent(data) {
            let rows = data.map(item => {
                let keys = Object.keys(item);

                let tds = keys.map(key => `<td>${item[key]}</td>`).join("")

                return  `<tr>
                    ${tds}
                </tr>`
            });


            document.getElementById("table-body").innerHTML = rows.join("");
        }


        function getUniqueLocations(data) {
            let entries = data.reduce((a, b) => {
                let entry = a.find(item => item['origin_address'] == b['origin_address']);

                if(entry) {
                    entry.count += 1;
                } else {
                    a.push({ ...b, count:1 });
                }

                return a;
            }, []);

            let features = entries.map(item => turf.point([item.origin_x, item.origin_y], {...item}));

            return turf.featureCollection([...features]);
        }


        function renderMarkers(places) {
            console.log(places);

            originMarkers.forEach(mkr => mkr.remove())
            originMarkers = places.map(place => {
                return createMarker(place, 'origin');
            });

           
            // destinationMarkers.forEach(mkr => mkr.remove())
            // destinationMarkers = places.map(place => {
            //     return createMarker(place, 'dest');
            // });
        }


        function createMarker(place, prefix) {
            let markerElement = document.createElement("div");
            markerElement.backgroundColor = place.color;
            markerElement.className = `div-marker ${prefix}-marker`;

            if(prefix == 'origin') { 
                markerElement.innerHTML = `<img src="https://davincikab.github.io/movers-routes/icons/cargo-truck.png" width="20px" height="20px" />`;
            }
            // markerElement.style.backgroundColor = `${routeColor(place)}`;

            let popup = new mapboxgl.Popup({ focusAfterOpen:false });
            popup.setHTML(`<div class="popup-content">
                <div class="popup-title">${prefix == 'origin' ? place.origin_address : place.to_address}</div>
            </div>`);

            let marker = new mapboxgl.Marker({element:markerElement});
            marker.id = place.fid;

            marker
                .setLngLat([parseFloat(place[`${prefix}_x`]), parseFloat(place[`${prefix}_y`])])
                .setPopup(popup)
                .addTo(map)

            return marker;
        }

        function getRouteExpression() {
            let placesCount = places.length;
            
            let stops = places.map((place) => {
                return [place.Id, colors[place.Id]]
            }).reduce((a, b) => [...a, ...b], []);

            // console.log(stops);

            return [
                'interpolate',
                ['linear'],
                ['get', 'route_id'],
                ...stops
            ];
        }

        function routeColor(place) {
            return colors[parseFloat(place.fid)] || "black";
        }


        // update origin destination
        function updateSelectionOptions(data) {
            let originAddresses = [...new Set(data.map(item=> item.origin_address))];

            // let originOptions = originAddresses.map(item => {
            //     return `<option value="origin-${item}">${item}</option>`;
            // });

            document.getElementById("origin").oninput = (e) => {
                let { value } = e.target;

                console.log(value);

                let results = filterRoutesData(data, 'origin', value);
                renderResultListing(results, 'origin');
            }

            let destAddresses = [...new Set(data.map(item=> item.to_address))];
            // let destOptions = destAddresses.map(item => {
            //     return `<option value="dest-${item}">${item}</option>`;
            // });

            document.getElementById("destination").oninput = (e) => {
                let { value } = e.target;

                let results = filterRoutesData(data, 'destination', value);
                renderResultListing(results, 'destination');
            }

        }

        function filterRoutesData(data, type, value) {
            let valueStr = value.toLocaleLowerCase();

            if(!value) return [];

            if(type == "origin") {
                return data.filter(entry => {
                    let address = entry.origin_address.toLocaleLowerCase();

                    if(address.includes(valueStr)) {
                        return entry;
                    } 

                    return false;
                });

            } else {
                return data.filter(entry => {
                    let address = entry.to_address.toLocaleLowerCase();

                    if(address.includes(valueStr)) {
                        return entry;
                    } 

                    return false;
                });
            }
        }

        function renderResultListing(result, elementId) {
            let resultsContainer = document.getElementById(`${elementId}-results`);
            resultsContainer.innerHTML = "";

            let field = elementId == 'origin' ? 'origin_address' : 'to_address';

            // results
            result.slice(0, 10).forEach(item => {
                let card = document.createElement("div");
                card.className = "card-item";
                card.dataset.id = elementId;

                card.innerHTML = `${item[field]}`;

                card.onclick = (e) => {
                    console.log(item);
                    let { dataset : { id } } = e.target;
                    console.log(id);

                    let field = id == 'origin' ? 'origin_address' : 'to_address';

                    let coords = id == 'origin' ? 
                        [parseFloat(item.origin_x), parseFloat(item.origin_y)] : 
                        [parseFloat(item.dest_x), parseFloat(item.dest_y)];

                    // map.flyTo({
                    //     center:[...coords],
                    //     zoom:10
                    // });

                    document.getElementById(id).value = item[field];

                    // close the collapse  section
                    e.target.parentElement.innerHTML = "";

                    let values = id == 'origin' ? 
                        [document.getElementById(id).value, document.getElementById("destination").value] :
                        [document.getElementById("origin").value, document.getElementById(id).value];


                    // filter routes data
                    filterRoutes(
                        [...values], 
                        id
                    );

                    
                };

                // filter routes
                resultsContainer.append(card);

            });

        }

        function renderListingSections(data) {

            let cards = data.map(entry => {
                let textColor = entry.color ? entry.color : "#222";
                console.log(textColor);

                return `<tr id="entry-${entry.fid}" data-fid="${entry.fid}" style="color:${textColor} !important; " class="route-rows" >
                    <td data-fid="${entry.fid}">
                        <span class="">${entry.origin_address}</span>
                    </td>

                    <td data-fid="${entry.fid}">
                        <span class="">${entry.to_address}</span>
                    </td>

                    <td data-fid="${entry.fid}">
                        <div class="map-pin" id="${entry.fid}">
                            <img src="icons/placeholder.svg" alt="location-icon"/>
                        </div>
                    </td>
                </tr>`;
            });


            document.getElementById("listing-table").innerHTML = cards.join("");

            setTimeout(() => {
                document.querySelectorAll(".map-pin").forEach(btn => {
                    btn.onclick = (e) => {
                        console.log(e.target.id);   

                        routingInstance.hightlightRoute()

                        let marker = originMarkers.find(mkr => mkr.id == e.target.id);

                        if(marker) {
                            marker.togglePopup();
                            map.flyTo({center:marker.getLngLat(), zoom:8});
                        }
                        
                    };
                });

                handleTableRowHover();

            }, 3000);
            
        }

        function handleTableRowHover() {
            let rows = document.querySelectorAll(".route-rows");

            console.log(rows);

            rows.forEach(rowElement => {
                rowElement.addEventListener("mouseover", (e) => {

                    console.log(e.target.dataset);
                    let { dataset: { fid } } = e.target;

                    routingInstance.hightlightRoute(fid);

                });

            });

        }

        function changeListeners() {
            document.getElementById("origin").onchange = (e) => {
                console.log(e.target.value);
                let { value } = e.target;

                let fid = value.split("-")[1];
                let destId = document.getElementById("destination").value.split("-")[1];
                filterRoutes(
                    [fid, destId], 
                    'origin'
                );
            };

            document.getElementById("destination").onchange = (e) => {
                console.log(e.target.value);
                let { value } = e.target;

                let fid = value.split("-")[1];
                let originId = document.getElementById("origin").value.split("-")[1];

                filterRoutes(
                    [originId, fid], 
                    'destination'
                );


            };

        }

        changeListeners();

        function filterRoutes(pointIds, type) {
            console.log(pointIds);

            let features = [...routingInstance.routesGeojson.features];

            if(!pointIds[0] && !pointIds[1]) {
                features = [];
            };

            if( pointIds[1]) {
                features = features.filter(feature => {
                    return feature.properties.to_address == pointIds[1];
                });
            }

            if( pointIds[0]) { 
                
                let STUSPS = "78660, TX,United States".split(",")[1].replace(" ", "");
                filterStatesMarkers(STUSPS);

                features = features.filter(feature => {
                    return feature.properties.origin_address == pointIds[0];
                });
            }

            let fc = turf.featureCollection([...features]);
            map.getSource('route').setData(fc);
        }

        function updateStatesData(data) {
            fetch('https://davincikab.github.io/movers-routes/states_centroids.geojson')
                .then(res => res.json())
                .then(statesData => {
                    console.log(statesData);

                    statesEntries = {...statesData};

                    statesData.features = statesData.features.map(state => {
                        let entries = data.filter(item => item.From === state.properties.STUSPS);

                        state.properties.entries = [...entries];

                        return state;
                    });


                    // map.getSource("states").setData(statesData).;
                    console.log(statesData);

                    // renderStatesMarkers(statesData);
                })
                .catch(console.error)
        }

        function renderStatesMarkers(statesFc) {
            statesMarkers = statesFc.features.map(state => {
                let customElement = document.createElement("div");
                customElement.className = "states-marker";

                customElement.innerHTML = `<div>${state.properties.entries.length}</div>`;

                customElement.onclick = (e) => {
                    console.log(e);

                    // display the route and the marker on the given locations
                    let { STUSPS, entries } = state.properties;


                    // renderMarkers([ ...entries ]);
                    routingInstance.places = [...entries];

                    routingInstance.filterRoutes([...entries]);

                    filterStatesMarkers(STUSPS);
                    
                }

                let marker = new mapboxgl.Marker({element:customElement});
                marker.setLngLat(state.geometry.coordinates).addTo(map);
                marker.id = state.properties.STUSPS;


                return marker;
            })
        }

        function filterStatesMarkers(STUSPS) {
            statesMarkers.forEach(marker => {
                if(marker.id == STUSPS) {
                    marker.addTo(map);
                } else {
                    marker.remove();
                }

            });

            let entries = statesEntries.features.find(feature => feature.properties.STUSPS === STUSPS);
            // renderMarkers([...entries.properties.entries]);
        }


        document.getElementById("reset-btn").onclick = (e) => {
            resetVisual();
        }

        function resetVisual() {
            if(statesMarkers) { statesMarkers.forEach(marker => { marker.addTo(map) }); }
            
            routingInstance.places = [];
            routingInstance.createRoutes();

            console.log("Removing markers");
            destinationMarkers.forEach(marker => { marker.remove() });
            originMarkers.forEach(marker => { marker.remove() });

            renderListingSections([]);
            map.getSource("user-route").setData({...turf.featureCollection([])});
        }

        // create a routing class
        class RoutingAlgo {
            constructor(map, places) {
                this.map = map;
                this.places = places;
                this.filteredRoutes;
                this.markerOrigin;
                this.markerDestination;

                this.statesBorder = [];

                d3.csv("https://davincikab.github.io/movers-routes/states.csv")
                    .then(res => {
                        console.log(res);

                        this.statesBorder = [...res.slice(0, -1)]
                    })
            }

            randomRouteEndpoints() {
                let count = this.places.length;

                this.routes = {};

                this.places.forEach(place => {
                    let destinationCount = Math.round(Math.random() * 8 + 1);

                    // console.log(place.Name);
                    this.routes[place.Name] = {...place};
                    this.routes[place.Name].destination = this.places.slice(0, destinationCount).filter(item => item.Name !== place.Name);
                
                }); 
                
                console.log(this.routes);

                return this;
            }

            filterRoutes(items) {
                // console.log(items);
                // console.log(this.routesGeojson);

                let features = this.routesGeojson.features.filter(feature => {
                    let entry = items.find(item => item.fid == feature.properties.fid);

                    if(entry) {
                        return feature;
                    } else {
                        return false;
                    }
                });

                // console.log(features);

                this.map.getSource('route').setData(turf.featureCollection([...features]));
            }

            createRoutes() {
                // this.routesGeojson = turf.featureCollection([]);

                // let features = Object.values(this.places).map(entry => {
                //     let routes =  this.createRoute({...entry})
                    
                //     return routes;
                // });
               

               let fc  = turf.featureCollection([]);
                this.map.getSource("route").setData({...fc});
                // this.iterateRequest([...this.places]);

            }

            createRoute(entry) {
                let origin_coords = [parseFloat(entry.origin_x), parseFloat(entry.origin_y)];
                let dest_coords = [parseFloat(entry.dest_x), parseFloat(entry.dest_y)];

                var start = turf.point([...origin_coords]);
                var end = turf.point([...dest_coords]);

                var greatCircle = turf.greatCircle(start, end, { 
                    properties: { 
                        name: `${entry.origin_address} to ${entry.to_address}`,
                        route_id :parseInt(entry.fid),
                        ...entry
                    }
                });

                return greatCircle;
            }


            renderRoutes() {
                if(this.map.loaded()) {
                    this.map.getSource("route").setData({...this.routesGeojson});
                } else {
                    this.map.once("load", (e) => {
                        this.map.getSource("route").setData({...this.routesGeojson})
                    });
                }
                
            }

            iterateRequest(entries) {
                // console.log(entries);

                let count = entries.length;
                let i = 0;

                let iter = (entry)  => {
                    let destination = [entry.dest_x, entry.dest_y ];
                    let origin =  [entry.origin_x, entry.origin_y ];

                    this.requestRoute(
                        origin, destination, 
                        { ...entry },
                        callbackFn
                    );
                }

                const callbackFn = (result)  => {
                    // console.log(result);

                    this.routesGeojson.features = [...this.routesGeojson.features, ...result];
                    this.renderRoutes();

                    // move to the next origin
                    // console.log("Moving to origin");
                    i++;

                    if(i < count) {
                        iter(entries[i]);
                    } else {
                        this.storeAndDownloadRoutes();
                    }
                    
                }

                iter(entries[0]);

            }


            // request the routes from mapbox routing api;
            requestRoute(origin, destination, originObj, cb) {
               let url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin};${destination}?access_token=${mapboxgl.accessToken}&geometries=geojson`
                
               return fetch(url)
                .then(res => res.json())
                .then(data => {
                    let { routes } = data;
                    let features = routes.map(route => {

                        return {
                            "type":"Feature",
                            "geometry":{...route.geometry},
                            "properties":{...originObj}
                        }

                    });

                    cb(features);

                    // return features;
                })
                .catch(console.error)
            }

            storeAndDownloadRoutes() {
                var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.routesGeojson));

                var dlAnchorElem = document.getElementById('downloadAnchorElem');
                dlAnchorElem.setAttribute("href",     dataStr     );
                dlAnchorElem.setAttribute("download", "data.json");
                dlAnchorElem.click();
            }

            findClosestAvailableRoute(route, destination, origin) {
                let routeBuffer = turf.buffer(route, 0, {units: 'miles'});
                console.log(routeBuffer);

                // check if the route has similar origin and destination as the user route.
                let dest_name = destination.context.find(ctx => ctx.id.includes('region')).text.toLocaleLowerCase() || 
                    destination.place_name.toLocaleLowerCase();

                // destination.place_name.toLocaleLowerCase();
                let origin_name = origin.context.find(ctx => ctx.id.includes('region')).text.toLocaleLowerCase() || 
                    origin.place_name.toLocaleLowerCase();

                // state routes
                let routesFeatures = this.routesGeojson.features.filter(feature => {
                    let destState = feature.properties['To State'].toLocaleLowerCase();
                    let originState = feature.properties['From State'].toLocaleLowerCase();

                    if(dest_name.includes(destState) && origin_name.includes(originState)) {
                        feature.properties.color = "green";

                        return feature;
                    }

                    return false;
                });

                console.log(JSON.parse(JSON.stringify(routesFeatures)));

                // routes with similar destination and direction
                let borderStatesFeatures = this.routesGeojson.features.filter(feature => {
                    let destState = feature.properties['To State'].toLocaleLowerCase();

                    let originState = feature.properties['From State'].toLocaleLowerCase();
                    let borderStates = this.statesBorder.find(item => item.State.trim().toLocaleLowerCase() == originState)|| {Borders:""};
                    let destinationBorderStates = this.statesBorder.find(item => item.State.trim().toLocaleLowerCase() == destState) || {Borders:""};

                    if(!borderStates) {
                        return false;
                    }

                    console.log(borderStates);
                    if(dest_name.includes(destState) && borderStates.Borders.toLocaleLowerCase().includes(origin_name)) {
                        feature.properties.color = "orange";

                        return feature;
                    }

                    if(origin_name.includes(originState) && destinationBorderStates.Borders.toLocaleLowerCase().includes(dest_name)) {
                        feature.properties.color = "orange";

                        return feature;
                    }

                    return false;
                });

                // routes on the same direction
               
                if(routesFeatures) {
                    routesFeatures = [...routesFeatures, ...borderStatesFeatures];

                    console.log(routesFeatures);

                    
                    this.map.getSource('route').setData(turf.featureCollection([...routesFeatures]));
                }
               
            }

            colorRoutesByStates(origin, destination) {
                 // check if the route has similar origin and destination as the user route.
                 let dest_name = destination.context.find(ctx => ctx.id.includes('region')).text.toLocaleLowerCase() || 
                    destination.place_name.toLocaleLowerCase();

                // destination.place_name.toLocaleLowerCase();
                let origin_name = origin.context.find(ctx => ctx.id.includes('region')).text.toLocaleLowerCase() || 
                    origin.place_name.toLocaleLowerCase();

                this.filteredRoutes = this.filteredRoutes.map(feature => {
                    let destState = feature.properties['To State'].toLocaleLowerCase();
                    let originState = feature.properties['From State'].toLocaleLowerCase();

                    if(dest_name.includes(destState) && origin_name.includes(originState)) {
                        feature.properties.color = "green";
                    } else {
                        feature.properties.color = "orange";
                    }

                    return feature;
                }).sort((a, b) => a.properties.color.length - b.properties.color.length);

                // this.map.getSource('route').setData(turf.featureCollection([...this.filteredRoutes]));
            }

            filterRouteByDestination(destination) {
                // destination.place_name.toLocaleLowerCase();
                let destination_name = destination.context.find(ctx => ctx.id.includes('region')).text.toLocaleLowerCase() || 
                    destination.place_name.toLocaleLowerCase();

                console.log(destination_name);
                let fc = this.filterRoutesWithinBuffer(destination, 'dest');

                // this.map.getSource('route').setData(fc);

                // renderMarkers([...fc.features.map(ft => ft.properties)]);
                this.updateMarkerDestination(destination);

                let features = fc.features.map(ft => ({...ft.properties}));
                customSequenceForm.setRoutes([...features]);
            }


            filterRouteByOrigin(origin) {
                // destination.place_name.toLocaleLowerCase();
                let origin_name = origin.context.find(ctx => ctx.id.includes('region'));

                console.log(origin_name);
                origin_name = origin_name ? origin_name.text.toLocaleLowerCase() : 
                    origin.place_name.toLocaleLowerCase();
                
                let fc = this.filterRoutesWithinBuffer(origin, 'origin');
                let features = fc.features.map(ft => ({...ft.properties}));

                console.log(features);
                // this.map.getSource('route').setData(fc);

                renderMarkers([...features]);
                this.map.flyTo({ center:[...origin.center], zoom:9 });

                this.updateMarkerOrigin(origin);
            }

            filterRoutesByDate(dates) {
                let features = this.filteredRoutes ? this.filteredRoutes : this.routesGeojson.features;

                let [ minDate, maxDate ] = dates;

                // features = features.filter(ft => {
                //     if(ft.properties.date > minDate && ft.properties.date < maxDate) {
                //         return ft;
                //     }

                //     return false;
                // });

                // this.map.getSource('route').setData( {...turf.featureCollection([...features]) } );
            }

            renderResultRoutes() {
                renderListingSections([...this.filteredRoutes.map(route => route.properties)]);
            }

            updateMarkerDestination(dest) {
                let icon = document.createElement("div");
                icon.classList = "route-markers";

                icon.innerHTML = `<img src="/icons/pin.png" alt="" />`;
                if(this.markerDestination) { 
                    this.markerDestination.setLngLat([...dest.center])
                }

                this.markerDestination = new mapboxgl.Marker({ element:icon });
                this.markerDestination.setLngLat([...dest.center]).addTo(this.map);
            }

            updateMarkerOrigin(origin) {
                let icon = document.createElement("div");
                icon.classList = "route-markers";

                icon.innerHTML = `<img src="/icons/pin.png" alt="" />`;
                if(this.markerOrigin) { 
                    this.markerOrigin.setLngLat([...origin.center]);

                    return;
                }

                this.markerOrigin = new mapboxgl.Marker({ element:icon });
                this.markerOrigin.setLngLat([...origin.center]).addTo(this.map);
            }

            filterRoutesWithinBuffer(position, prefix) {
                let features = this.filteredRoutes ? this.filteredRoutes : this.routesGeojson.features;
                let bufferPoint = turf.point([...position.center]);
                let buffer = turf.buffer(bufferPoint, 500, { units: 'miles' });

                // state routes
                let routesFeatures = features.filter(feature => {
                    let point = turf.point([ feature.properties[`${prefix}_x`], feature.properties[`${prefix}_y`] ]);
                    let distance = turf.distance(bufferPoint, point);

                    let booleanCrosses = turf.booleanPointInPolygon(point, buffer);

                    if(booleanCrosses) {
                        feature.properties.color = "#333";
                        feature.properties.distance = feature.properties.distance ? feature.properties.distance : distance;

                        return feature;
                    }

                    feature.properties.selected = "false";

                    return false;
                });

                
                this.filteredRoutes = [...routesFeatures];

                return turf.featureCollection([...routesFeatures]);
            }

            hightlightRoute(fid) {
                this.filterRoutes = this.filteredRoutes.map(route => {
                    if(route.properties.fid == fid) {
                        route.properties.selected = "true";
                    } else {
                        route.properties.selected = "false";
                    }

                    return route;
                });

                
                console.log(fid);
                // this.map.getSource('route').setData({ "type":"FeatureCollection", "features": [...this.filteredRoutes] });
            }

            fireEventListers() {
                this.layerTogglers = document.querySelectorAll(".form-check");

                console.log(this.layerTogglers);
                this.layerTogglers.forEach(layerToggler => {
                    layerToggler.onclick = (e) => {

                        let { id, checked } = e.target;
                        console.log(id);

                        this.togglerMapLayers(id, checked);
                    }

                });     
            }

            togglerMapLayers(id, checked) {
                
                if(id == 'trucks') {
                    // console.log("Trucks");

                    if(checked) { originMarkers.forEach(marker => marker.addTo(map) ); }
                    if(!checked) { originMarkers.forEach(marker => marker.remove() ); }

                } else {

                    if(checked) {
                        map.setLayoutProperty('route-line', 'visibility', 'visible');
                        map.setLayoutProperty('route-line-case', 'visibility', 'visible');

                        this.markerOrigin.addTo(map); this.markerDestination.addTo(map);
                    } else {
                        map.setLayoutProperty('route-line', 'visibility', 'none');
                        map.setLayoutProperty('route-line-case', 'visibility', 'none');

                        this.markerOrigin.remove(); this.markerDestination.remove();
                    } 

                }

            }

        }

        routingInstance = new RoutingAlgo(map, []);
        routingInstance.fireEventListers();

        // custom direction api
        class CustomDirectionAPI {
            constructor(map) {

                this.map = map;
                this.destinationResult;
                this.originResult;
                this.submitButton = document.getElementById("submit-button");

                // geocoder
                this.geocoder = new MapboxGeocoder({
                    accessToken: mapboxgl.accessToken,
                    mapboxgl: mapboxgl,
                    countries:'us',
                    types:'postcode,address,place,poi',
                    flyTo:false,
                    marker:false,
                    reverseGeocode:true,
                    placeholder:'Origin ...'
                });
                
                document.getElementById('geocoder').appendChild(this.geocoder.onAdd(this.map));

                // destination class
                this.geocoderDest = new MapboxGeocoder({
                    accessToken: mapboxgl.accessToken,
                    mapboxgl: mapboxgl,
                    countries:'us',
                    types:'postcode,address,place,poi',
                    flyTo:false,
                    marker:false,
                    reverseGeocode:true,
                    placeholder:'Destination ...'
                });

                // geolocation control
                this.geolocateControl = new mapboxgl.GeolocateControl({
                    fitBoundsOptions:{
                        maxZoom:3
                    },
                    showAccuracyCircle:false,
                });

               this.map.addControl(this.geolocateControl, 'top-left');

                // "country", "region", "postcode", "district", "place", "locality", "neighborhood", "address", "poi", or "poi.landmark".
                document.getElementById('geocoder-dest').appendChild(this.geocoderDest.onAdd(this.map));


                // datepicker
                this.picker = new Litepicker({
                    element: document.getElementById('date-range'),
                    singleMode: false,
                    setup:(picker) => {
                        picker.on("selected", (date1, date2) => {
                            // console.log("Updated the files");
                            console.log(date1, date2);

                            // update the date
                            let dates = [date1, date2];

                            if(this.originResult && this.destinationResult) { 
                                this.computeRoutes();

                                
                                routingInstance.colorRoutesByStates(this.originResult, this.destinationResult);
                                routingInstance.renderResultRoutes();
                            }

                            routingInstance.filterRoutesByDate(dates);

                        });
                    }
                });
            }

            fireEventListers() {
                // get the results
                this.geocoder.on("result", ({ result }) => {
                    console.log("origin");
                    console.log(result);

                    this.originResult = {...result};
                    customSequenceForm.setOrigin({...result});

                    routingInstance.filterRouteByOrigin(result);

                    if(this.destinationResult) { this.computeRoutes() }
                });

                this.geocoderDest.on("result", ({ result }) => {
                    console.log("Destination");
                    console.log(result);

                    this.destinationResult = {...result};
                    customSequenceForm.setDestination({...result});

                    if(this.originResult) { this.computeRoutes() }
                    routingInstance.filterRouteByDestination(result)
                });

                this.geocoder.on("clear", (e) => { 
                    this.originResult = undefined;
                    resetVisual(); 

                    routingInstance.filteredRoutes = null;

                    if(this.destinationResult) {
                        routingInstance.filterRouteByDestination(this.destinationResult);
                    }

                });

                this.geocoderDest.on("clear", (e) => { 
                    this.destinationResult = undefined;
                    resetVisual(); 

                    routingInstance.filteredRoutes = null;

                    if(this.originResult) { 
                        routingInstance.filterRouteByOrigin(this.originResult);
                    }

                });

                this.submitButton.onclick = (e) => {
                    console.log("Submit Click");

                    // fire the search aspect
                    if(this.originResult && this.destinationResult) { 
                        this.computeRoutes(); 
                    }

                }

                this.geolocateControl.on('geolocate', (result) => {
                    console.log("Geolocate Result:");
                    console.log(result.coords);

                    let { latitude, longitude } = result.coords;
                    let query = `${latitude},${longitude}`;

                    console.log(query);

                    // if(latitude < 10) {
                    //     this.geocoder.query(`25.774173,-80.19362`);
                    // } else { 
                    //     this.geocoder.query(`${latitude},${longitude}`);
                    // }

                    // document.getElementById("map-wrapper").classList.toggle("open");

                });         

            }

            triggerGeolocation() {
                // this.geolocateControl.trigger(); 
            }

            computeRoutes() {
                console.log('coputeRoutes==============================================================')
                let origin = this.originResult.center.toString();
                let destination = this.destinationResult.center.toString();
                
                let url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin};${destination}?access_token=${mapboxgl.accessToken}&geometries=geojson`
                
                fetch(url)
                    .then(res => res.json())
                    .then(data => {
                        
                        let { routes } = data;  

                        console.log(data);
                        customSequenceForm.setDistance(routes[0].distance);
                        console.log("locations=========>", this.originResult)

                        // JCH330
                        document.getElementById("frm_mcl_origin").innerHTML = `${this.originResult.place_name}`;
                        document.getElementById("frm_mcl_destination").innerHTML = `${this.destinationResult.place_name}`;

                        customSequenceForm.setOrigin({ ...this.originResult });
                        customSequenceForm.setDestination({ ...this.destinationResult });

                        let features = routes.map(route => {

                            return {
                                "type":"Feature",
                                "geometry":{...route.geometry},
                                "properties":{
                                    origin:this.originResult.place_name, 
                                    destination:this.destinationResult.place_name
                                }
                            };

                        });

                        console.log(features);

                        this.userRoute = turf.featureCollection([...features]);

                        map.getSource('user-route').setData({ ...this.userRoute });

                        let bbox = turf.bbox(this.userRoute);
                        map.fitBounds(bbox, { padding:100 });
                        document.getElementById("route").checked = true;

                        // routingInstance.findClosestAvailableRoute(this.userRoute, this.destinationResult, this.originResult);
                        // return features;
                        // JCH330_123321
                        customSequenceForm.handlePricing();
                    })
                    .catch(console.error);
            }
        }

        const customDirection = new CustomDirectionAPI(map);
        customDirection.fireEventListers();


        /* 
        TO DO:
            - Flashing Routes: Change the colors
            - All Routes
            - Registration Sequence
            - Filter the rates
            - Reset button
            - Fit map bounds  to trucks origin Address.
        */ 

        function ModalContainer() {
            // Get the modal
            var modal = document.getElementById("myModal");

            // Get the button that opens the modal
            var btn = document.getElementById("post-button");

            var btnSubmit = document.getElementById("btn-modal");
            btnSubmit.onclick = (e) => {
                // redirect to actual domain
                window.location.assign(window.location.origin);
            }

            // Get the <span> element that closes the modal
            var span = document.getElementsByClassName("close")[0];

            // When the user clicks the button, open the modal 
            btn.onclick = function() {
                modal.style.display = "block";
            }

            // When the user clicks on <span> (x), close the modal
            span.onclick = function() {
                modal.style.display = "none";
            }

            // When the user clicks anywhere outside of the modal, close it
            window.onclick = function(event) {
                if (event.target == modal) {
                    modal.style.display = "none";
                }
            }

            function toggleModal() {
                if(modal.style.display == "block") {
                    modal.style.display = "none";
                } else {
                    modal.style.display = "block";
                }
            }

            return {
                toggleModal:toggleModal
            }
        }

        let modalContainer = ModalContainer();

// custom sequence form
let formDetails = {

}

class CustomSequenceForm {
    constructor() {

        this.phases = ['phase-1', 'phase-2', 'phase-3', 'phase-4'];

        this.activePhase = 'phase-1';
        this.isDisabled = true;
        this.continueButton = document.getElementById("continue-button");

        this.carrierInfo = {
            isCarrier:false,
            origin:null,
            destination:null,
            distance:null,
            cubicFeet: 1000, // JCH330
            rate:null,
            routes:[],
            firstName:null,
            lastName:null,
            phoneNumber:null
        };

        this.fireEventListers();

    }


    fireEventListers() {

        this.continueButton.onclick = (e) => {
            console.log(e);
            let index = this.phases.indexOf(this.activePhase);

            if(!this.validatePhase(this.activePhase)) {
                return;
            }

            if(this.phases[index + 1]) {
                this.activePhase = this.phases[index + 1];
                this.next();
            }
            
        }

        let carrierEl = document.querySelectorAll(".btn-label");

        carrierEl.forEach(el => {
            el.onclick = (e) => {
                console.log(e);

                let { value } = e.target;

                if(value === 'no') {
                    this.carrierInfo.isCarrier = "No";
                    this.toggleCarrierNameForm();
                } else {
                    this.carrierInfo.isCarrier = "Yes";
                    this.toggleCarrierNameForm();
                }
                
            }
        });

        document.getElementById("form-yes").onsubmit = (e) => {
            e.preventDefault();

            alert(`ERROR: we are unable to
            register your move please chat
            with us`);
        }

        document.getElementById("cubic-feet").oninput = (e) => {
            this.carrierInfo.cubicFeet = e.target.value;

            console.log(e.target.value);

            if(parseFloat(e.target.value) > 1000) {
                document.getElementById("bedroom-unknown").classList.add('d-none');
                document.getElementById("bedroom-known").classList.remove('d-none');
            } else {
                document.getElementById("bedroom-unknown").classList.remove('d-none');
                document.getElementById("bedroom-known").classList.add('d-none');
            }
        }

        document.querySelectorAll(".registration-field").forEach(inputEl => {
            inputEl.oninput = (e) => {
                let { id, value } = e.target;

                this.carrierInfo[id] = value;
            };

        })

        document.getElementById("register-button").onclick = (e) => {
            e.preventDefault();

            if(this.handleDetailsSection()) {
                spinner.toggle();

                // proceed to last phase// send the details to google sheet
                this.handleFormSubmit();                

            } else {
                alert("All inputs are required");
            }
        }
    }

    toggleCarrierNameForm() {
        if(this.carrierInfo.isCarrier == "Yes") {
            document.getElementById("form-yes").classList.remove("d-none");
            document.getElementById("continue-button").classList.add("d-none");
        } else {
            document.getElementById("form-yes").classList.add("d-none");
            document.getElementById("continue-button").classList.remove("d-none");
        }
        
    }

    validatePhase(phase) {

        switch (phase) {
            case "phase-1":
                return this.handleCarrier();
            case "phase-2":
                return this.handleOriginDestination();
            case "phase-3":
                return this.handlePricing();
            case "phase-4":
                return this.handleDetailsSection();
            default:
                break;
        };

    }

    next() {
        console.log("Next Phase");

        this.phases.map(phase => {
            if(this.activePhase == phase) {
                document.getElementById(phase).classList.remove('d-none');
            } else {
                document.getElementById(phase).classList.add('d-none')
            }
        });

    }

    handleCarrier() {
        return this.carrierInfo.isCarrier
    }

    handleOriginDestination() {
        if(this.carrierInfo.origin && this.carrierInfo.destination && this.carrierInfo.distance) {
            return true;
        }

        return false;
    }

    setOrigin(origin) {
        this.carrierInfo.origin = origin.place_name;
    }

    setDestination(destination) {
        this.carrierInfo.destination = destination.place_name;
    }

    setDistance(distance) {
        this.carrierInfo.distance = (distance / 1609.34).toFixed(0);
        document.getElementById("distance").innerHTML = `<b>${this.carrierInfo.distance} miles</b>`;
        document.getElementById("frm_mcl_milterange").innerHTML = `${this.carrierInfo.distance}`;
    }

    setRoutes(routes) {
        this.carrierInfo.routes = [ ...routes ].sort((a,b) => a.distance - b.distance);

        this.filterSheetsContentByRoutes();
        this.updatePricingSection();
    }

    setSheets(sheets) {
        this.sheets = sheets;
    }

    filterSheetsContentByRoutes() {
        let columns = this.carrierInfo.routes.map(route => route.To);
        console.log(columns);

        let sheet = this.sheets['Hoja 2'].map(entry => {

            let items = columns.reduce((a,b) => {
                a[b] = entry[b] || "0";

                return a;
            }, {});

            return  { State:entry.State, ...items };

        }).filter(entry => {
            // check origin or destination
            let columns = Object.keys(entry);

            let isState = this.carrierInfo.routes.find(route => route['From'] == entry.State );
            // let isDestination = this.carrierInfo.routes.find(route => columns.includes(route['To']) );

            if(isState) {
                return true;
            }

            return false;
        }); 

        console.log(sheet);

        renderListingViewSection({
            ...this.sheets,
            'Hoja 2':[...sheet]
        });

        fireSortListeners({
            ...this.sheets,
            'Hoja 2':[...sheet]
        });
    }

    updatePricingSection() {
        let { Rate } = this.carrierInfo.routes[0];

        this.carrierInfo.rate = Rate.replace("$", "");

        document.getElementById("rate").innerHTML = Rate;
        document.getElementById("rate-asp").innerHTML = ` ${Rate} `;
    }

    renderRouteCards() {
        /* let cards = this.carrierInfo.routes.slice(0,2).map(route => {
            return `<div class="card-section bg-light text-section" id="${route['Route #']}">
                <div clas="title">USMPO ROUTE: ${route['Route #']}</div>
                <div class="dot-number">DOT #: ${route['DOT #']}</div>

                <div class="distance" >${route.From} TO ${route.To}: ${this.carrierInfo.distance} miles</div>
                <div class="rate">
                    <b>${route.Rate}</b>
                </div>

                <div class="occupied" >${route['% OCCUPIED']} Occupied</div>
                
                <div class="action-section">
                    <b>ExPEDITE..</b>
                </div>
            </div>`;
        }); */

        let cards = this.carrierInfo.routes.slice(0,2).map(route => {
            return `<div class="card-section" id="${route['Route #']}">
                <div class="title">USMPO ROUTE: ${route['Route #']}</div>
                <div class="dot-number">DOT #: ${route['DOT #']}</div>

                <div class="distance" >${route.From} TO ${route.To}: ${this.carrierInfo.distance} miles</div>
                <div class="rate">
                    <b>${route.Rate}</b>
                </div>

                <div class="occupied" >${route['% OCCUPIED']} Occupied</div>
                
                <div class="action-section">
                    <b>ExPEDITE..</b>
                </div>
            </div>`;
        });
        console.log("cards=================>", cards)
        document.getElementById("card-section").innerHTML = cards.join("");
        document.getElementById("frm_mcl_availableoptions").innerHTML = cards.join("");

        var allCardsDoms = document.querySelectorAll("#frm_mcl_availableoptions .card-section");
        if(allCardsDoms)
        for(let cardDom of allCardsDoms) {
            cardDom.addEventListener("click", function(event) {
                // var targetElement = event.target || event.srcElement;
                for(var card of allCardsDoms) {
                    card.classList.remove('active')
                }
                cardDom.classList.add('active')
                // set selected option in the section
                document.querySelector('#frm_mcl_rate').innerHTML = `${cardDom.querySelector('div.rate').innerHTML}`;
                document.querySelector('#frm_mcl_selectedoption').innerHTML = `${cardDom.querySelector('div.title').textContent} ${cardDom.querySelector('div.dot-number').textContent} ${cardDom.querySelector('div.distance').textContent}`
            });
        }
        
    }

    // pricing control
    handlePricing() {
        if(this.carrierInfo.cubicFeet) {

            this.renderRouteCards();
            return true;
        }

        return false;
    }

    handleDetailsSection() {
        let { firstName, lastName, phoneNumber } = this.carrierInfo;
        if(firstName && lastName && phoneNumber) {
            return true;
        }

        return false;
    }

    toggleContinueDisable() {

        this.isDisabled = !this.isDisabled;
        document.getElementById("continue-button").disabled = this.isDisabled;

    }

    handleFormSubmit() {
        let fields = {
            ...this.carrierInfo,
            Id:this.makeId(),
            date:new Date().toLocaleDateString()
        };

        let fieldIds =  ['Id', 'origin', 'destination', 'distance', 'cubicFeet', 'rate', 'firstName', 'lastName', 'phoneNumber', 'routes', 'date'];
        // `Id, origin, destination, distance, cubicFeet, rate, firstName, lastName, phoneNumber, routes, date`
        let details = {};
        fieldIds.forEach(id => {
            if(id == 'routes') {
                details[id] = fields[id].length;
            } else {
                details[id] = fields[id];
            }
            
        });

        console.log(details);

        // send the data to the google sheet: USMPO route details.
        let url = "https://script.google.com/macros/s/AKfycbwwB6ovEmcQRl72IPaNRgcjltF2nv8F-a2Frtwk-MGPCx8N7SjDxNcC7WCIbFgoCG6O/exec";
        
        var formBody = [];
        for (var property in details) {
            var encodedKey = encodeURIComponent(property);
            var encodedValue = encodeURIComponent(details[property]);

            formBody.push(encodedKey + "=" + encodedValue);
        }

        formBody = formBody.join("&");

        // console.log(formBody);
        // this.sendXMLHTTPRequest(url, details);

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
            },
            body:formBody
        })
        .then(res => res.json())
        .then(resData => {
            console.log(resData);

            // toggler spinner
            spinner.toggle();

            // open modal
            modalContainer.toggleModal();
        })
        .catch(error => {
            console.error(error);

            // toggler spinner
            spinner.toggle();

            // open modal
            modalContainer.toggleModal();
        });   

        // {
        //     "Id": "7XtpUmlnN",
        //     "cubicFeet": "1300",
        //     "date": "2/28/2023",
        //     "destination": "Los Angeles, California, United States",
        //     "distance": "2284",
        //     "firstName": "David",
        //     "lastName": "Njeri",
        //     "origin": "Detroit, Michigan, United States",
        //     "phoneNumber": "0745987546",
        //     "rate": "6.00",
        //     "routes": 12
        // }

    }

    sendXMLHTTPRequest(url, data) {
        var xhr = new XMLHttpRequest();

        xhr.open('POST', url);
        // xhr.withCredentials = true;
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
            // form.reset();
            // var formElements = form.querySelector(".form-elements")
            // if (formElements) {
            //   formElements.style.display = "none"; // hide form
            // }
            // var thankYouMessage = form.querySelector(".thankyou_message");
            // if (thankYouMessage) {
            //   thankYouMessage.style.display = "block";
            // }

            // console.log(xhr);
            spinner.toggle();
          }

        };

        // url encode form data for sending as post data
        let keys = ['Id', 'origin', 'destination', 'distance', 'cubicFeet', 'rate', 'firstName', 'lastName', 'phoneNumber', 'routes', 'date'];
        var encoded = keys.map(function(k) {
            return encodeURIComponent(k) + "=" + encodeURIComponent(data[k]);
        }).join('&');
        
        console.log(encoded);
        xhr.send(encoded);
    }

    formatDate() {
        return ``;
    }

    makeId(length=9) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        let counter = 0;
        while (counter < length) {
          result += characters.charAt(Math.floor(Math.random() * charactersLength));
          counter += 1;
        }
        return result;
    }
}

const customSequenceForm = new CustomSequenceForm();
// customSequenceFor

const Spinner = () => {
    let toggleSpinner = () => {
        document.getElementById("spinner").classList.toggle('d-none');
    }

    return {
        toggle:toggleSpinner
    }
}

let spinner = Spinner();