// ==========================================
// RECHARGEABLE BATTERY
// Prosta ładowalna bateria do Sandboxels
// Bez Logic Gates
// ==========================================

const RB_MAX_CHARGE = 100;

// Ile baterii rozładowuje się na tick
const RB_DISCHARGE_SPEED = 0.02;

// Ile baterii ładuje się na tick
const RB_CHARGE_SPEED = 0.5;


// ==========================================
// 🔋 NAŁADOWANA BATERIA
// ==========================================

elements.rechargeable_battery = {
    color: ["#555555", "#777777", "#999999"],
    category: "machines",
    state: "solid",
    density: 5000,

    desc: "Ładowalna bateria. Zaczyna na 100% i powoli się rozładowuje.",

    tick: function(pixel) {

        if (pixel.batteryCharge === undefined) {
            pixel.batteryCharge = RB_MAX_CHARGE;
        }

        // Bateria powoli traci energię
        pixel.batteryCharge -= RB_DISCHARGE_SPEED;

        // Jeśli całkowicie się rozładowała
        if (pixel.batteryCharge <= 0) {
            pixel.batteryCharge = 0;
            changePixel(pixel, "dead_rechargeable_battery");
        }
    }
};


// ==========================================
// 🪫 ROZŁADOWANA BATERIA
// ==========================================

elements.dead_rechargeable_battery = {
    color: ["#222222", "#303030", "#181818"],
    category: "machines",
    state: "solid",
    density: 5000,

    desc: "Rozładowana bateria. Można ją naładować w ładowarce.",

    tick: function(pixel) {

        if (pixel.batteryCharge === undefined) {
            pixel.batteryCharge = 0;
        }

        // Sprawdzamy sąsiadujące piksele
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {

                if (dx === 0 && dy === 0) continue;

                let x = pixel.x + dx;
                let y = pixel.y + dy;

                if (outOfBounds(x, y)) continue;

                let other = pixelMap[x][y];

                if (!other) continue;

                // Ładowarka musi być naładowana
                if (
                    other.element === "battery_charger" &&
                    other.chargerPower > 0
                ) {

                    changePixel(pixel, "recharging_battery");

                    pixel.batteryCharge = 0;

                    return;
                }
            }
        }
    }
};


// ==========================================
// 🔄 ŁADOWANIE
// ==========================================

elements.recharging_battery = {
    color: ["#777777", "#999999", "#bbbbbb"],
    category: "machines",
    state: "solid",
    density: 5000,

    desc: "Bateria podczas ładowania.",

    tick: function(pixel) {

        if (pixel.batteryCharge === undefined) {
            pixel.batteryCharge = 0;
        }

        let chargerFound = false;

        // Szukamy ładowarki
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {

                if (dx === 0 && dy === 0) continue;

                let x = pixel.x + dx;
                let y = pixel.y + dy;

                if (outOfBounds(x, y)) continue;

                let other = pixelMap[x][y];

                if (!other) continue;

                if (
                    other.element === "battery_charger" &&
                    other.chargerPower > 0
                ) {

                    chargerFound = true;

                    // Ładowarka zużywa swoją energię
                    other.chargerPower -= RB_CHARGE_SPEED;

                    if (other.chargerPower < 0) {
                        other.chargerPower = 0;
                    }

                    // Bateria dostaje energię
                    pixel.batteryCharge += RB_CHARGE_SPEED;

                    break;
                }
            }
        }

        // Bez ładowarki bateria nie ładuje się
        if (!chargerFound) {
            changePixel(pixel, "dead_rechargeable_battery");
            return;
        }

        // 100% = gotowa bateria
        if (pixel.batteryCharge >= RB_MAX_CHARGE) {

            pixel.batteryCharge = RB_MAX_CHARGE;

            changePixel(pixel, "rechargeable_battery");
        }
    }
};


// ==========================================
// 🔌 ŁADOWARKA
// ==========================================

elements.battery_charger = {
    color: ["#333333", "#555555", "#888888"],
    category: "machines",
    state: "solid",
    density: 4000,

    desc: "Ładowarka. Musi otrzymać energię elektryczną, aby ładować baterię.",

    tick: function(pixel) {

        if (pixel.chargerPower === undefined) {
            pixel.chargerPower = 0;
        }

        // Sprawdzamy, czy ładowarka otrzymała prąd
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {

                if (dx === 0 && dy === 0) continue;

                let x = pixel.x + dx;
                let y = pixel.y + dy;

                if (outOfBounds(x, y)) continue;

                let other = pixelMap[x][y];

                if (!other) continue;

                // Jeśli sąsiad jest naładowany
                if (other.charge > 0) {

                    // Pobieramy część energii
                    pixel.chargerPower += 1;

                    // Zużywamy otrzymany ładunek
                    other.charge = 0;

                    if (pixel.chargerPower > 100) {
                        pixel.chargerPower = 100;
                    }

                    return;
                }
            }
        }

        // Ładowarka powoli traci zgromadzoną energię
        if (pixel.chargerPower > 0) {
            pixel.chargerPower -= 0.01;

            if (pixel.chargerPower < 0) {
                pixel.chargerPower = 0;
            }
        }
    }
};