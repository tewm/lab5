const map = L.map('map').setView([20, 0], 2);

// Basemap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Fetch polygon data (e.g., countries or states)
fetch('tl_2020_us_aitsn1.json') // Replace with actual path
    .then(response => response.json())
    .then(polygonsData => {
    fetch('airports.geojson') // Replace with actual path
        .then(response => response.json())
        .then(pointsData => {

                polygonsData.features.forEach(polygon => {
                    let count = 0;
                    pointsData.features.forEach(point => {
                        if (turf.booleanPointInPolygon(point, polygon)) {
                            count++;
                        }
                    });

                    polygon.properties.pointCount = count;
                    polygon.properties.area = turf.area(polygon) / 1e6; // Convert to sq km
                    polygon.properties.normalizedRate = polygon.properties.pointCount / polygon.properties.area;
                });

                // Color scale for raw count
                function getColorRaw(count) {
                    return count > 100 ? '#800026' :
                           count > 50  ? '#BD0026' :
                           count > 20  ? '#E31A1C' :
                           count > 10  ? '#FC4E2A' :
                           count > 5   ? '#FD8D3C' :
                           count > 0   ? '#FEB24C' :
                                        '#FFEDA0';
                }

                // Color scale for normalized rate
                function getColorNormalized(rate) {
                    return rate > 5 ? '#54278F' :
                           rate > 2 ? '#756BB1' :
                           rate > 1 ? '#9E9AC8' :
                           rate > 0.5 ? '#CBC9E2' :
                                        '#F2F0F7';
                }

                // Style for raw count layer
                function styleRaw(feature) {
                    return {
                        fillColor: getColorRaw(feature.properties.pointCount),
                        weight: 1,
                        color: 'white',
                        fillOpacity: 0.7
                    };
                }

                // Style for normalized rate layer
                function styleNormalized(feature) {
                    return {
                        fillColor: getColorNormalized(feature.properties.normalizedRate),
                        weight: 1,
                        color: 'white',
                        fillOpacity: 0.7
                    };
                }

                // Create GeoJSON layers
                let rawLayer = L.geoJson(polygonsData, {
                    style: styleRaw,
                    onEachFeature: (feature, layer) => {
                        layer.bindPopup(`<b>Region:</b> ${feature.properties.name}<br>
                                         <b>Point Count:</b> ${feature.properties.pointCount}`);
                    }
                });

                let normalizedLayer = L.geoJson(polygonsData, {
                    style: styleNormalized,
                    onEachFeature: (feature, layer) => {
                        layer.bindPopup(`<b>Region:</b> ${feature.properties.name}<br>
                                         <b>Normalized Rate:</b> ${feature.properties.normalizedRate.toFixed(2)} points/sq km`);
                    }
                });

                // Add raw count layer by default
                rawLayer.addTo(map);

                // Layer control
                L.control.layers({
                    "Point Count": rawLayer,
                    "Normalized (per sq km)": normalizedLayer
                }).addTo(map);

                // Legend
                let legend = L.control({ position: "bottomright" });
                legend.onAdd = function () {
                    let div = L.DomUtil.create("div", "legend");
                    div.innerHTML = `<b>Point Count Legend</b><br>
                                     <i style="background:#800026"></i> > 100<br>
                                     <i style="background:#BD0026"></i> 51-100<br>
                                     <i style="background:#E31A1C"></i> 21-50<br>
                                     <i style="background:#FC4E2A"></i> 11-20<br>
                                     <i style="background:#FD8D3C"></i> 6-10<br>
                                     <i style="background:#FEB24C"></i> 1-5<br>
                                     <i style="background:#FFEDA0"></i> 0<br>`;
                    return div;
                };
                legend.addTo(map);

                // Scale bar
                L.control.scale().addTo(map);
            });
    });
