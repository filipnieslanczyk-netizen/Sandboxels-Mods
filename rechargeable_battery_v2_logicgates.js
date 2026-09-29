/*
 * Rechargeable Battery V2 — Logic Gates edition
 * For Sandboxels + logicgates.js
 *
 * IMPORTANT:
 * Load logicgates.js BEFORE this mod.
 *
 * Battery behavior:
 * - stores 0..100 energy units
 * - charges from adjacent powered logic_wire pixels
 * - outputs ONLY through the selected side
 * - output is a real logic_wire signal (lstate = 2)
 * - when the battery is empty, output turns off
 * - selecting the battery lets you choose the output direction
 *
 * Directions:
 *   up / right / down / left
 */

(function () {
    const BATTERY = "rechargeable_battery_v2";
    const MAX_ENERGY = 100;
    const CHARGE_RATE = 1;
    const OUTPUT_RATE = 1;

    const DIRS = {
        up:    [0, -1],
        right: [1, 0],
        down:  [0, 1],
        left:  [-1, 0]
    };

    function getNeighbor(x, y, dx, dy) {
        if (typeof pixelMap === "undefined") return null;
        if (outOfBounds(x + dx, y + dy)) return null;
        return pixelMap[x + dx]?.[y + dy] || null;
    }

    function setColor(pixel) {
        const e = Math.max(0, Math.min(MAX_ENERGY, pixel.energy || 0));
        const r = Math.round(25 + e * 0.35);
        const g = Math.round(65 + e * 1.55);
        const b = Math.round(85 + e * 1.70);
        pixel.color = `rgb(${r},${g},${b})`;
    }

    function directionFor(pixel) {
        if (!DIRS[pixel.outputDirection]) {
            pixel.outputDirection = "right";
        }
        return pixel.outputDirection;
    }

    function chooseDirection(pixel) {
        const current = directionFor(pixel);

        const answer = prompt(
            "Rechargeable Battery V2\n\n" +
            "Wybierz kierunek OUTPUT:\n" +
            "up = góra\n" +
            "right = prawo\n" +
            "down = dół\n" +
            "left = lewo",
            current
        );

        if (answer && DIRS[answer.toLowerCase()]) {
            pixel.outputDirection = answer.toLowerCase();
        }
    }

    function chargeBattery(pixel) {
        if ((pixel.energy || 0) >= MAX_ENERGY) return;

        const outputDir = directionFor(pixel);

        // Any adjacent powered logic wire can charge the battery.
        // The selected OUTPUT side is excluded so the battery does not
        // immediately take back the signal it is producing.
        for (const name in DIRS) {
            if (name === outputDir) continue;

            const [dx, dy] = DIRS[name];
            const other = getNeighbor(pixel.x, pixel.y, dx, dy);

            if (
                other &&
                other.element === "logic_wire" &&
                other.lstate > 0
            ) {
                pixel.energy = Math.min(
                    MAX_ENERGY,
                    (pixel.energy || 0) + CHARGE_RATE
                );
                return;
            }
        }
    }

    function outputBattery(pixel) {
        if ((pixel.energy || 0) <= 0) return;

        const [dx, dy] = DIRS[directionFor(pixel)];
        const target = getNeighbor(pixel.x, pixel.y, dx, dy);

        if (!target || target.element !== "logic_wire") return;

        // This is the same signal state used by logicgates.js.
        target.lstate = 2;

        pixel.energy = Math.max(
            0,
            (pixel.energy || 0) - OUTPUT_RATE
        );
    }

    elements[BATTERY] = {
        color: "#24586c",
        behavior: behaviors.WALL,
        state: "solid",
        category: "logic",

        desc:
            "Ładowalna bateria dla logicgates.js. " +
            "Magazynuje energię z logic_wire i wysyła ją tylko wybraną stroną. " +
            "Kliknij baterię, aby ustawić OUTPUT.",

        // Prevent normal Sandboxels electricity from changing the battery.
        conduct: 0,

        tick: function (pixel) {
            if (typeof pixel.energy !== "number") {
                pixel.energy = 0;
            }

            directionFor(pixel);

            // Input first, then output.
            chargeBattery(pixel);
            outputBattery(pixel);

            setColor(pixel);
        },

        onSelect: function () {
            // The currently selected pixel is not passed by Sandboxels
            // onSelect, so direction selection is stored globally for
            // newly placed batteries.
            const answer = prompt(
                "Rechargeable Battery V2\n\n" +
                "Domyślny kierunek OUTPUT:\n" +
                "up / right / down / left",
                rechargeableBatteryDefaultDirection
            );

            if (answer && DIRS[answer.toLowerCase()]) {
                rechargeableBatteryDefaultDirection =
                    answer.toLowerCase();
            }
        },

        onPlace: function (pixel) {
            pixel.energy = 0;
            pixel.outputDirection =
                rechargeableBatteryDefaultDirection;
            setColor(pixel);
        }
    };

    /*
     * Default direction for newly placed batteries.
     * Use the battery's selection prompt to change this.
     */
    var rechargeableBatteryDefaultDirection = "right";

    /*
     * Small tool: clicking an existing battery with the battery selected
     * opens its direction menu.
     */
    elements[BATTERY].tool = function (pixel) {
        if (pixel.element !== BATTERY) return;

        const answer = prompt(
            "Rechargeable Battery V2\n\n" +
            "Kierunek OUTPUT:\n" +
            "up / right / down / left",
            directionFor(pixel)
        );

        if (answer && DIRS[answer.toLowerCase()]) {
            pixel.outputDirection = answer.toLowerCase();
        }
    };

    /*
     * Display a small charge indicator using the normal Sandboxels
     * pixel renderer if available.
     */
    elements[BATTERY].renderer = function (pixel, ctx) {
        const energy = Math.max(
            0,
            Math.min(MAX_ENERGY, pixel.energy || 0)
        );
        const ratio = energy / MAX_ENERGY;

        // Battery body
        ctx.fillStyle = "#18262d";
        ctx.fillRect(pixel.x, pixel.y, pixelSize, pixelSize);

        // Charge bar
        ctx.fillStyle = "#48c8e8";
        ctx.fillRect(
            pixel.x,
            pixel.y + pixelSize * (1 - ratio),
            pixelSize,
            pixelSize * ratio
        );
    };

    // Helpful console message when the mod loads.
    console.log(
        "[Rechargeable Battery V2] Loaded. " +
        "Requires logicgates.js. Element: " + BATTERY
    );
})();
