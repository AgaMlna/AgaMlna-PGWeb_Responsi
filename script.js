/* ============ Inisialisasi Peta ============ */
// Inisialisasi peta dengan pusat Kecamatan Karanganyar
if (map) {
    map.remove();
}
var map = L.map("map").setView([-7.656880565490917, 110.9644352175589], 11);

// Tile Layer Base Map
var basemap = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
});

// Basemap 1: OpenStreetMap
var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// Basemap 2: Esri WorldImagery
var esriImageryLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '&copy; <a href="https://www.esri.com/en-us/arcgis/about-arcgis">Esri</a>'
});

// Tile Layer Base Map - CartoDB Dark Matter
var darkMatterLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://carto.com/attributions">CartoDB</a> contributors'
});

// Menambahkan layer pertama (OpenStreetMap) ke peta
darkMatterLayer.addTo(map);

// Menambahkan basemap ke dalam peta
basemap.addTo(map);

/* ============ GeoJSON Point Fasilitas Umum ============ */
// GeoJSON Point fasum KRA
var fasum_kra = L.geoJSON(null, {
    // Style
    pointToLayer: function (feature, latlng) {
        return L.marker(latlng, {
            icon: L.icon({
                iconUrl: "icon/pin.png",
                iconSize: [27, 27], // Ukuran ikon
                iconAnchor: [24, 48], // Posisi ikon terhadap titik 
                popupAnchor: [0, -48], // Posisi popup terhadap ikon
                tooltipAnchor: [-16, -30], // Posisi tooltip terhadap ikon
            }),
        });
    },

    // onEachFeature
    onEachFeature: function (feature, layer) {
        // Mengambil data nama objek dari kolom Desa
        var popup_content = "Jenis Bangunan: " + feature.properties.fclass + "<br>" +
            "Nama Bangunan: " + feature.properties.name;

        layer.on({
            click: function (e) {
                // Menampilkan modal dengan informasi
                $("#featureModalTitle").html("Informasi fasum KRA");
                $("#featureModalBody").html(popup_content);
                $("#featureModal").modal("show");
            },
            mouseover: function (e) {
                // Menampilkan tooltip saat mouseover
                layer.bindTooltip(feature.properties.NAMOBJ, {
                    direction: "top",
                    sticky: true,
                });
            },
        });
    },
});

// Mengambil dan menambahkan data GeoJSON dari file fasum_kra.geojson
$.getJSON("data/fasum_kra.geojson", function (data) {
    fasum_kra.addData(data); // Menambahkan data GeoJSON ke dalam layer fasum_kra
});

/* ============ GeoJSON Polyline Jalan ============ */
map.createPane('panejalan');
map.getPane('panejalan').style.zIndex = 401;

var jalan = L.geoJSON(null, {
    pane: 'panejalan',
    style: function (feature) {
        return {
            color: 'red',
            opacity: 1,
            weight: 3,
        };
    },
    onEachFeature: function (feature, layer) {
        var popup_content = `
            Fungsi Jalan: ${feature.properties.REMARK}<br>
            Panjang (m): ${feature.properties.SHAPE_Leng}
        `;

        layer.on({
            click: function () {
                $("#featureModalTitle").html("Informasi Jalan");
                $("#featureModalBody").html(popup_content);
                $("#featureModal").modal("show");
            },
            mouseover: function () {
                layer.bindTooltip(feature.properties.REMARK, {
                    direction: "auto",
                    sticky: true,
                });
            },
        });
    },
});

$.getJSON("data/jalan_kra.geojson", function (data) {
    jalan.addData(data); // Add GeoJSON data to the jalan layer
});

/* ============ Simbolisasi Berdasarkan Kategori ============ */
var symbologyCategorized = {
    "Jalan Arteri": { color: "#660000", weight: 3 },
    "Jalan Kolektor": { color: "#990000", weight: 2.5 },
    "Jalan Lokal": { color: "#cc0000", weight: 2 },
    "Jalan Setapak": { color: "#FF0000", weight: 1.5 },
    "Jalan Lain": { color: "#CC3333", weight: 1 }
};

function getStyle(feature) {
    var fungsi = feature.properties.REMARK;
    var style = symbologyCategorized[fungsi];
    if (style) {
        return {
            color: style.color,
            opacity: 1,
            weight: style.weight,
        };
    } else {
        return {
            color: "red",
            opacity: 1,
            weight: 2,
        };
    }
}

var jalanCategorized = L.geoJSON(null, {
    style: getStyle,
    onEachFeature: function (feature, layer) {
        var popup_content = `
            Fungsi Jalan: ${feature.properties.REMARK}<br>
            Panjang: ${feature.properties.SHAPE_Leng}
        `;
        layer.on({
            click: function () {
                $("#featureModalTitle").html("Informasi Jalan");
                $("#featureModalBody").html(popup_content);
                $("#featureModal").modal("show");
            },
            mouseover: function () {
                layer.bindTooltip(feature.properties.REMARK, {
                    direction: "auto",
                    sticky: true,
                });
            },
        });
    },
});

$.getJSON("data/jalan_kra.geojson", function (data) {
    jalanCategorized.addData(data); // Add categorized GeoJSON data to the layer
});

/* ============ GeoJSON Polygon Administrasi ============ */
map.createPane('paneAdminKRA');
map.getPane('paneAdminKRA').style.zIndex = 301;

function generateColorFromString(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    var color = '#';
    for (var i = 0; i < 3; i++) {
        var value = (hash >> (i * 8)) & 0xFF;
        color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
}

var admin_kra = L.geoJSON(null, {
    pane: 'paneAdminKRA',
    style: function (feature) {
        var namaDesa = feature.properties.NAMOBJ;
        var warnaDesa = generateColorFromString(namaDesa);
        return {
            color: "black",
            opacity: 1,
            weight: 1,
            fillColor: warnaDesa,
            fillOpacity: 1,
        };
    },
    onEachFeature: function (feature, layer) {
        var popup_content = `
            Desa: ${feature.properties.NAMOBJ}<br>
            Kecamatan: ${feature.properties.WADMKC}<br>
            Kabupaten: ${feature.properties.WADMKK}<br>
            Provinsi: ${feature.properties.WADMPR}<br>
            Luas: ${feature.properties.SHAPE_Leng} Ha
        `;

        layer.on({
            click: function () {
                $("#featureModalTitle").html("Informasi Desa");
                $("#featureModalBody").html(popup_content);
                $("#featureModal").modal("show");
            },
            mouseover: function () {
                layer.bindTooltip(feature.properties.NAMOBJ, {
                    direction: "auto",
                    sticky: true,
                });
            },
        });
    },
});

$.getJSON("data/admin_kra.geojson", function (data) {
    admin_kra.addData(data); // Add admin GeoJSON data to the admin layer
});

/* ============ GeoJSON Polygon Populasi ============ */
map.createPane('panePopulasiKRA');
map.getPane('panePopulasiKRA').style.zIndex = 302;

function getColor(populasi) {
    return populasi > 15280 ? '#996515' :
        populasi > 8511 ? '#b78727' :
            populasi > 5906 ? '#cba135' :
                populasi > 4067 ? '#c5b358' :
                    '#ffebcd';
}

var populasi_kra = L.geoJSON(null, {
    pane: 'panePopulasiKRA',
    style: function (feature) {
        var populasi = feature.properties.Populasi;
        return {
            color: "black",
            opacity: 1,
            weight: 1,
            fillColor: getColor(populasi),
            fillOpacity: 1,
        };
    },
    onEachFeature: function (feature, layer) {
        var popup_content = `
            Desa: ${feature.properties.NAMOBJ}<br>
            Populasi: ${feature.properties.Populasi}
        `;
        layer.on({
            click: function () {
                $("#featureModalTitle").html("Informasi Populasi");
                $("#featureModalBody").html(popup_content);
                $("#featureModal").modal("show");
            },
            mouseover: function () {
                layer.bindTooltip(feature.properties.NAMOBJ, {
                    direction: "auto",
                    sticky: true,
                });
            },
        });
    },
});

// Membuat layer GeoJSON dengan gradasi warna berdasarkan populasi
var populasi_kra = L.geoJSON(null, {
    pane: 'panePopulasiKRA',
    style: function (feature) {
        var Populasi = feature.properties.Populasi;
        return {
            color: "black", // Warna garis batas polygon
            opacity: 1,
            weight: 1,
            fillColor: getColor(Populasi), // Warna berdasarkan jumlah populasi
            fillOpacity: 1.0, // Transparansi 
        };
    },

    onEachFeature: function (feature, layer) {
        var popup_content =
            "Desa: " + feature.properties.NAMOBJ + "<br>" +
            "Kecamatan: " + feature.properties.WADMKC + "<br>" +
            "Populasi: " + feature.properties.Populasi + " Jiwa" + "<br>" +
            "<canvas id='populationChart' style='width:300px; height:200px; display:block; margin:0 auto;'></canvas>" +
            "<br><small><em>Data diambil dari BPS Kabupaten Karanganyar tahun 2023!</em></small>";

        layer.on({
            click: function (e) {
                // Menampilkan popup dalam modal
                $("#featureModalTitle").html("Informasi Desa");
                $("#featureModalBody").html(popup_content);
                $("#featureModal").modal("show");

                // Membuat diagram untuk perbandingan populasi
                setTimeout(() => {
                    var ctx = document.getElementById("populationChart").getContext("2d");
                    new Chart(ctx, {
                        type: "pie",
                        data: {
                            labels: ["Laki-laki", "Perempuan"], // Label untuk data
                            datasets: [{
                                data: [
                                    feature.properties.Pria,  // Populasi Laki-laki
                                    feature.properties.Wanita || 1, // Populasi Perempuan
                                ],
                                backgroundColor: ["#5e88c9", "#ff6f61"],  // Warna untuk tiap segmen
                            }],
                        },
                        options: {
                            responsive: true,
                            plugins: {
                                legend: {
                                    position: "bottom",
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function (tooltipItem) {
                                            // Menambahkan keterangan rasio di tooltip
                                            var total = tooltipItem.dataset.data.reduce((sum, value) => sum + value, 0);
                                            var value = tooltipItem.raw;
                                            var percentage = ((value / total) * 100).toFixed(2);
                                            return tooltipItem.label + ": " + value + " (" + percentage + "%)";
                                        }
                                    }
                                }
                            }
                        },
                    });
                }, 100);

            },
            mouseover: function (e) {
                layer.bindTooltip(feature.properties.NAMOBJ, {
                    direction: "auto",
                    sticky: true,
                });
            },
        });
    }
});

// Mengambil dan menambahkan data GeoJSON dari data populasi
$.getJSON("data/populasi_kra.geojson", function (data) {
    populasi_kra.addData(data); // Menambahkan data GeoJSON ke dalam layer populasi_kra
    map.addLayer(populasi_kra); // Menambahkan layer populasi_kra ke peta
});

// Menambahkan legenda gradasi warna ke peta
var legend = L.control({ position: "bottomright" });
legend.onAdd = function (map) {
    var div = L.DomUtil.create("div", "info legend"),
        grades = [0, 1000, 5000, 10000],
        labels = [];

    // Menambahkan setiap rentang dengan warna
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }

    return div;
};
legend.addTo(map);

/* ===== Pengaturan Base Maps dan Overlay Maps ===== */
var baseMaps = {
    "OpenStreetMap": osmLayer,
    "Esri World Imagery": esriImageryLayer,
    "Dark Matter": darkMatterLayer,
};

var overlayMaps = {
    "Fasilitas Umum": fasum_kra,
    "Jalan": jalanCategorized,
    "Populasi": populasi_kra,
    "Administrasi": admin_kra
};

// Menambahkan layer Populasi secara default
map.addLayer(populasi_kra);

// Menambahkan kontrol untuk hanya menampilkan salah satu antara admin_kra dan populasi_kra
map.on("overlayadd", function (e) {
    if (e.layer === admin_kra) {
        // Jika admin_kra ditambahkan, sembunyikan populasi_kra
        if (map.hasLayer(populasi_kra)) {
            populasi_kra.setOpacity(0); // Sembunyikan populasi_kra
        }
    }

    if (e.layer === populasi_kra) {
        // Jika populasi_kra ditambahkan, sembunyikan admin_kra
        if (map.hasLayer(admin_kra)) {
            admin_kra.setOpacity(0); // Sembunyikan admin_kra
        }
    }
});

// Event ketika layer dihapus
map.on("overlayremove", function (e) {
    if (e.layer === admin_kra) {
        // Jika admin_kra dihapus, tampilkan populasi_kra
        populasi_kra.setOpacity(1);
    }

    if (e.layer === populasi_kra) {
        // Jika populasi_kra dihapus, tampilkan admin_kra
        admin_kra.setOpacity(1);
    }
});
// Menambahkan kontrol layer untuk memilih basemap dan overlay map
L.control.layers(baseMaps, overlayMaps).addTo(map);

/* ===== Menambahkan Kontrol Pencarian Lokasi ===== */
var searchControl = new L.Control.Search({
    layer: populasi_kra, // Layer yang akan dicari
    propertyName: "NAMOBJ", // Nama atribut yang akan digunakan untuk pencarian
    marker: false, // Nonaktifkan marker otomatis
    moveToLocation: function (latlng, title, map) {
        map.setView(latlng, 15); // Zoom ke lokasi
    },
});

// Event pencarian
searchControl.on("search:locationfound", function (e) {
    // Menyoroti fitur yang ditemukan
    e.layer.setStyle({ fillColor: "#03a3ff", color: "blue" });
    if (e.layer._popup) e.layer.openPopup();
}).on("search:collapsed", function (e) {
    admin_kra.eachLayer(function (layer) {
        admin_kra.resetStyle(layer);
    });
});

// Menambahkan kontrol pencarian ke peta
map.addControl(searchControl);

/* ===== Menggabungkan Semua Legenda ===== */
var combinedLegend = L.control({ position: "topright" });

combinedLegend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend');

    // Legenda Lokasi Bangunan
    div.innerHTML += "<strong>LEGENDA</strong><br>" +
        "<strong>Bangunan</strong><br>" +
        "<img src='icon/pin.png' style='width: 30px; height: 30px;' alt='fasum KRA Icon'> Fasilitas Umum<br><br>";

    // Legenda Jaringan Jalan
    var gradesJalan = ["Jalan Arteri", "Jalan Kolektor", "Jalan Lokal", "Jalan Setapak", "Jalan Lain"];
    var colorsJalan = ["#660000", "#990000", "#cc0000", "#FF0000", "#CC3333"];
    var jalanLabels = [];

    for (var i = 0; i < gradesJalan.length; i++) {
        jalanLabels.push(
            '<div style="display: flex; align-items: center; margin-bottom: 5px;">' +
            '<span style="display: inline-block; width: 30px; height: 3px; background-color:' + colorsJalan[i] + '; margin-right: 10px;"></span>' +
            '<span>' + gradesJalan[i] + '</span>' +
            '</div>'
        );
    }

    div.innerHTML += "<strong>Jaringan Jalan</strong><br>" + jalanLabels.join("") + "<br><br>";

    // Legenda Populasi
    var gradesPopulasi = [1949, 4067, 5906, 8511, 15280];
    var labelsPopulasi = [];
    for (var i = 0; i < gradesPopulasi.length; i++) {
        var from = gradesPopulasi[i];
        var to = gradesPopulasi[i + 1];

        labelsPopulasi.push(
            '<i style="background:' + getColor(from + 1) + '; width: 20px; height: 20px; display: inline-block;"></i> ' +
            from + (to ? '&ndash;' + to : '+') + ' Jiwa'
        );
    }

    div.innerHTML += "<strong>Populasi</strong><br>" + labelsPopulasi.join("<br>") + "<br><br>";
    return div;
};

combinedLegend.addTo(map);

/* ===== Pembaruan Legenda Berdasarkan Layer Aktif ===== */
function updateCombinedLegend() {
    var div = document.querySelector('.info.legend');

    div.innerHTML = "<strong>LEGENDA</strong><br>";

    // Menambahkan legenda sesuai dengan layer aktif
    if (map.hasLayer(fasum_kra)) {
        div.innerHTML += "<strong>Bangunan</strong><br>" +
            "<img src='icon/pin.png' style='width: 30px; height: 30px;' alt='fasum KRA Icon'> Fasilitas Umum<br><br>";
    }

    if (map.hasLayer(jalanCategorized)) {
        var gradesJalan = ["Jalan Arteri", "Jalan Kolektor", "Jalan Lokal", "Jalan Setapak", "Jalan Lain"];
        var colorsJalan = ["#660000", "#990000", "#cc0000", "#FF0000", "#CC3333"];
        var jalanLabels = [];

        for (var i = 0; i < gradesJalan.length; i++) {
            jalanLabels.push(
                '<div style="display: flex; align-items: center; margin-bottom: 5px;">' +
                '<span style="display: inline-block; width: 30px; height: 3px; background-color:' + colorsJalan[i] + '; margin-right: 10px;"></span>' +
                '<span>' + gradesJalan[i] + '</span>' +
                '</div>'
            );
        }

        div.innerHTML += "<strong>Jaringan Jalan</strong><br>" + jalanLabels.join("") + "<br><br>";
    }

    if (map.hasLayer(populasi_kra)) {
        var gradesPopulasi = [1949, 4067, 5906, 8511, 15280];
        var labelsPopulasi = [];
        for (var i = 0; i < gradesPopulasi.length; i++) {
            var from = gradesPopulasi[i];
            var to = gradesPopulasi[i + 1];

            labelsPopulasi.push(
                '<i style="background:' + getColor(from + 1) + '; width: 20px; height: 20px; display: inline-block;"></i> ' +
                from + (to ? '&ndash;' + to : '+') + ' Jiwa'
            );
        }

        div.innerHTML += "<strong>Populasi</strong><br>" + labelsPopulasi.join("<br>") + "<br><br>";
    }

    if (map.hasLayer(admin_kra)) {
        div.innerHTML += "<strong>Administrasi</strong><br>" +
            "___<i style='width: 20px; height: 20px; display: inline-block;'></i> Batas Administrasi<br><br>";
    }
}

// Mengupdate legenda saat layer overlay ditambahkan atau dihapus
map.on('overlayadd', updateCombinedLegend);
map.on('overlayremove', updateCombinedLegend);

// Memanggil fungsi untuk pertama kali agar legenda sesuai dengan layer aktif awal
updateCombinedLegend();

// Memperbarui warna teks legenda berdasarkan peta dasar
function updateLegendTextColor(currentBaseMap) {
    var legend = document.querySelector('.legend'); // Cari container legenda
    if (!legend) return;
    if (currentBaseMap === "OpenStreetMap") {
        legend.style.color = "black"; // Warna hitam untuk latar terang
    } else if (currentBaseMap === "Esri World Imagery" || currentBaseMap === "Dark Matter") {
        legend.style.color = "white"; // Warna putih untuk latar gelap
    }
}

// Memperbarui warna teks legenda saat peta dasar berubah
map.on('baselayerchange', function (event) {
    updateLegendTextColor(event.name);
});

// Setel warna awal teks legenda berdasarkan peta dasar default
updateLegendTextColor("darkMatterLayer"); // Ganti dengan nama peta dasar default

/* ===== Landing Page ===== */
document.addEventListener("DOMContentLoaded", function () {
    const landingPage = document.getElementById("landing-page");
    const mapContainer = document.getElementById("map");
    const enterMapButton = document.getElementById("enter-map");

    // Event Listener untuk tombol Enter Map
    enterMapButton.addEventListener("click", function () {
        // Sembunyikan Landing Page
        landingPage.style.display = "none";

        // Tampilkan Map Container
        mapContainer.classList.remove("hidden");

        // Inisialisasi peta
        const map = L.map("map").setView([-7.6088822592081256, 110.98070839318441], 11);

        // Tambahkan layer basemap
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);
    });
});

/* ===== Menambahkan Spinner dan Delay Sebelum Menampilkan Peta ===== */
document.addEventListener("DOMContentLoaded", function () {
    const landingPage = document.getElementById("landing-page");
    const spinner = document.getElementById("spinner");
    const mapContainer = document.getElementById("map");
    const enterMapButton = document.getElementById("enter-map");

    enterMapButton.addEventListener("click", function () {
        // Sembunyikan Landing Page
        landingPage.style.display = "none";

        // Tampilkan Spinner
        spinner.classList.remove("hidden");

        // Tambahkan delay sebelum menampilkan peta
        setTimeout(function () {
            // Sembunyikan Spinner
            spinner.classList.add("hidden");

            // Tampilkan Map Container
            mapContainer.classList.remove("hidden");

            // Inisialisasi Peta
            const map = L.map("map").setView([-7.6088822592081256, 110.98070839318441], 11);

            // Tambahkan layer basemap
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }).addTo(map);

            // Tambahkan Plugin Leaflet.Measure
            const measureControl = new L.Control.Measure({
                primaryLengthUnit: "meters",
                secondaryLengthUnit: "kilometers",
                primaryAreaUnit: "sqmeters",
                secondaryAreaUnit: "hectares",
                activeColor: "#e81d1d",
                completedColor: "#1de81d",
            });

            // Tambahkan kontrol pengukuran ke peta
            map.addControl(measureControl);
        }, 2000); // Delay 2 detik
    });
});

/* ===== Menambahkan Layer untuk Hasil Pengukuran ===== */
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

// Inisialisasi kontrol pengukuran
var drawControl = new L.Control.Draw({
    draw: {
        polyline: {
            metric: true, // Pengukuran dalam meter
            shapeOptions: {
                color: "blue",
                weight: 3,
            },
        },
        polygon: {
            metric: true,
            showArea: true, // Aktifkan pengukuran area
            shapeOptions: {
                color: "green",
                weight: 2,
            },
        },
        rectangle: false,
        circle: false,
        marker: true,
    },
    edit: {
        featureGroup: drawnItems,
    },
});
map.addControl(drawControl);

/* ===== Event Listener untuk Menghitung Jarak atau Area ===== */
map.on(L.Draw.Event.CREATED, function (e) {
    var layer = e.layer;
    drawnItems.addLayer(layer);

    // Jika polygon, tampilkan area
    if (e.layerType === "polygon") {
        var latlngs = layer.getLatLngs()[0];
        var area = L.GeometryUtil.geodesicArea(latlngs); // Hitung area
        layer.bindPopup("Area: " + (area / 1000000).toFixed(2) + " km²").openPopup();
    }

    // Jika polyline, tampilkan jarak
    if (e.layerType === "polyline") {
        var latlngs = layer.getLatLngs();
        var totalDistance = 0;

        for (var i = 0; i < latlngs.length - 1; i++) {
            totalDistance += latlngs[i].distanceTo(latlngs[i + 1]);
        }

        layer.bindPopup("Jarak: " + totalDistance.toFixed(2) + " meter").openPopup();
    }
});


/* ===== Fungsi untuk Modal Feedback ===== */
function openFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    modal.style.display = 'block';
    setTimeout(() => {
        modal.style.opacity = '1'; // Efek transisi saat modal muncul
    }, 10);
}

function closeFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    modal.style.opacity = '0'; // Efek transisi saat modal menghilang
    setTimeout(() => {
        modal.style.display = 'none'; // Sembunyikan setelah transisi selesai
    }, 300); // Waktu transisi
}

/* ===== Fungsi untuk Modal Feedback ===== */
function openFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    modal.style.display = 'block';
    setTimeout(() => {
        modal.style.opacity = '1'; // Efek transisi saat modal muncul
    }, 10);
}

function closeFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    modal.style.opacity = '0'; // Efek transisi saat modal menghilang
    setTimeout(() => {
        modal.style.display = 'none'; // Sembunyikan setelah transisi selesai
    }, 300); // Waktu transisi
}

/* ===== Kirim Feedback ke Google Apps Script ===== */
document.getElementById('feedbackForm').onsubmit = async function (event) {
    event.preventDefault();

    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        feedback: document.getElementById('feedback').value
    };

    const statusDiv = document.getElementById('feedbackStatus');
    statusDiv.textContent = "Sending feedback...";

    try {
        const response = await fetch('https://script.google.com/macros/s/AKfycbzr1W1cDaEmaa8XiHExW6QBKgsnZeUhSIhk2ltuKKeP/exec', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData),
            mode: 'no-cors' // Menonaktifkan CORS (respons tidak bisa dibaca)
        });

        // Since mode is 'no-cors', you can't directly check the response here. Just show a success message.
        statusDiv.textContent = "Thank you for your feedback!";
        statusDiv.style.color = "green"; // Warna hijau untuk sukses

    } catch (error) {
        console.error("Error:", error);
        statusDiv.textContent = "Failed to send feedback. Please try again later.";
        statusDiv.style.color = "red"; // Warna merah jika terjadi kesalahan
    }
};


/* ===== Search untuk Profil ===== */
function searchProfile() {
    // Ambil nilai input pencarian
    var input = document.getElementById("searchInput").value.toLowerCase();

    // Daftar id untuk setiap kecamatan dalam accordion
    var kecamatanList = [
        "collapseColomadu",     // ID div untuk Kecamatan Colomadu
        "collapseGondangrejo",  // ID div untuk Kecamatan Gondangrejo
        "collapseJaten",        // ID div untuk Kecamatan Jaten
        "collapseJatipuro",      // ID div untuk Kecamatan Jatipuro
        "collapseJatiyoso",     // ID div untuk Kecamatan Jatiyoso
        "collapseJenawi",       // ID div untuk Kecamatan Jenawi
        "collapseJumantono",    // ID div untuk Kecamatan Jumantono
        "collapseJumapolo",     // ID div untuk Kecamatan Jumapolo
        "collapseKaranganyar",  // ID div untuk Kecamatan Karanganyar
        "collapseKarangpandan", // ID div untuk Kecamatan Karangpandan
        "collapseKebakkramat", // ID div untuk Kecamatan Kebakkramat
        "collapseKerjo",        // ID div untuk Kecamatan Kerjo
        "collapseMatesih",      // ID div untuk Kecamatan Matesih
        "collapseMojogedang",   // ID div untuk Kecamatan Mojogedang
        "collapseNgargoyoso",   // ID div untuk Kecamatan Ngargoyoso
        "collapseTasikmadu",    // ID div untuk Kecamatan Tasikmadu
        "collapseTawangmangu"   // ID div untuk Kecamatan Tawangmangu
    ];

    // Sembunyikan semua accordion collapse terlebih dahulu
    kecamatanList.forEach(function(kecamatan) {
        var accordionItem = document.getElementById(kecamatan);
        accordionItem.classList.remove('show'); // Menyembunyikan konten accordion
    });

    // Periksa apakah input pencarian cocok dengan nama kecamatan
    if (input === "colomadu") {
        var element = document.getElementById("collapseColomadu");
        element.classList.add('show'); // Tampilkan konten Kecamatan Colomadu
        element.scrollIntoView({ behavior: 'smooth' }); // Scroll ke konten Kecamatan Colomadu
    } else if (input === "gondangrejo") {
        var element = document.getElementById("collapseGondangrejo");
        element.classList.add('show'); // Tampilkan konten Kecamatan Gondangrejo
        element.scrollIntoView({ behavior: 'smooth' }); // Scroll ke konten Kecamatan Gondangrejo
    } else if (input === "jaten") {
        var element = document.getElementById("collapseJaten");
        element.classList.add('show'); // Tampilkan konten Kecamatan Jaten
        element.scrollIntoView({ behavior: 'smooth' }); // Scroll ke konten Kecamatan Jaten
    } else if (input === "jatipuro") {
        var element = document.getElementById("collapseJatipuro");
        element.classList.add('show'); // Tampilkan konten Kecamatan Jatipuro
        element.scrollIntoView({ behavior: 'smooth' }); // Scroll ke konten Kecamatan Jatipuro
    } else if (input === "jatiyoso") {
        var element = document.getElementById("collapseJatiyoso");
        element.classList.add('show'); // Tampilkan konten Kecamatan Jatiyoso
        element.scrollIntoView({ behavior: 'smooth' }); // Scroll ke konten Kecamatan Jatiyoso
    } else if (input === "jenawi") {
        var element = document.getElementById("collapseJenawi");
        element.classList.add('show'); // Tampilkan konten Kecamatan Jenawi
        element.scrollIntoView({ behavior: 'smooth' }); // Scroll ke konten Kecamatan Jenawi
    } else if (input === "jumantono") {
        var element = document.getElementById("collapseJumantono");
        element.classList.add('show'); // Tampilkan konten Kecamatan Jumantono
        element.scrollIntoView({ behavior: 'smooth' }); // Scroll ke konten Kecamatan Jumantono
    } else if (input === "jumapolo") {
        var element = document.getElementById("collapseJumapolo");
        element.classList.add('show'); // Tampilkan konten Kecamatan Jumapolo
        element.scrollIntoView({ behavior: 'smooth' }); // Scroll ke konten Kecamatan Jumapolo
    } else if (input === "karanganyar") {
        var element = document.getElementById("collapseKaranganyar");
        element.classList.add('show'); // Tampilkan konten Kecamatan Karanganyar
        element.scrollIntoView({ behavior: 'smooth' }); // Scroll ke konten Kecamatan Karanganyar
    } else if (input === "karangpandan") {
        var element = document.getElementById("collapseKarangpandan");
        element.classList.add('show'); // Tampilkan konten Kecamatan Karangpandan
        element.scrollIntoView({ behavior: 'smooth' }); // Scroll ke konten Kecamatan Karangpandan
    } else if (input === "kebakkramat") {
        var element = document.getElementById("collapseKebakkramat");
        element.classList.add('show'); // Tampilkan konten Kecamatan Kebakkramat
        element.scrollIntoView({ behavior: 'smooth' }); // Scroll ke konten Kecamatan Kebakkramat
    } else if (input === "kerjo") {
        var element = document.getElementById("collapseKerjo");
        element.classList.add('show'); // Tampilkan konten Kecamatan Kerjo
        element.scrollIntoView({ behavior: 'smooth' }); // Scroll ke konten Kecamatan Kerjo
    } else if (input === "matesih") {
        var element = document.getElementById("collapseMatesih");
        element.classList.add('show'); // Tampilkan konten Kecamatan Matesih
        element.scrollIntoView({ behavior: 'smooth' }); // Scroll ke konten Kecamatan Matesih
    } else if (input === "mojogedang") {
        var element = document.getElementById("collapseMojogedang");
        element.classList.add('show'); // Tampilkan konten Kecamatan Mojogedang
        element.scrollIntoView({ behavior: 'smooth' }); // Scroll ke konten Kecamatan Mojogedang
    } else if (input === "ngargoyoso") {
        var element = document.getElementById("collapseNgargoyoso");
        element.classList.add('show'); // Tampilkan konten Kecamatan Ngargoyoso
        element.scrollIntoView({ behavior: 'smooth' }); // Scroll ke konten Kecamatan Ngargoyoso
    } else if (input === "tasikmadu") {
        var element = document.getElementById("collapseTasikmadu");
        element.classList.add('show'); // Tampilkan konten Kecamatan Tasikmadu
        element.scrollIntoView({ behavior: 'smooth' }); // Scroll ke konten Kecamatan Tasikmadu
    } else if (input === "tawangmangu") {
        var element = document.getElementById("collapseTawangmangu");
        element.classList.add('show'); // Tampilkan konten Kecamatan Tawangmangu
        element.scrollIntoView({ behavior: 'smooth' }); // Scroll ke konten Kecamatan Tawangmangu
    }
}




