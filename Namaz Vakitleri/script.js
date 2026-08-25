let prayerTimes = {};

let currentLocation = {
    city: "Antalya",
    country: "Türkiye"
};


/* =========================
   SAAT
========================= */

function updateClock() {

    const now = new Date();

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    document.getElementById("clock").textContent =
        `${hours}:${minutes}:${seconds}`;


    const date = now.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    document.getElementById("dateText").textContent = date;

    updateCountdown();
}

setInterval(updateClock, 1000);

updateClock();



/* =========================
   KONUM
========================= */

function getLocation() {

    if (!navigator.geolocation) {

        alert("Tarayıcınız konum özelliğini desteklemiyor.");

        return;
    }


    navigator.geolocation.getCurrentPosition(

        async function(position) {

            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;


            try {

                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                );

                const data = await response.json();


                const address = data.address;

                const city =
                    address.city ||
                    address.town ||
                    address.province ||
                    "Bilinmeyen konum";

                const country =
                    address.country ||
                    "Türkiye";


                currentLocation.city = city;
                currentLocation.country = country;


                document.getElementById("locationText").textContent =
                    `${city}, ${country}`;


                getPrayerTimes(city, country);

            } catch (error) {

                console.error(error);

                alert("Konum bilgisi alınamadı.");

            }

        },

        function(error) {

            console.error(error);

            alert(
                "Konumunuza erişebilmek için izin vermeniz gerekiyor."
            );

        }

    );
}


document
    .getElementById("locationButton")
    .addEventListener("click", getLocation);



/* =========================
   NAMAZ VAKİTLERİ
========================= */

async function getPrayerTimes(city, country) {

    try {

        document.getElementById("prayerList").innerHTML =
            `<div class="loading">
                Namaz vakitleri yükleniyor...
             </div>`;


        const url =
            `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=13`;


        const response = await fetch(url);

        const data = await response.json();


        if (data.code !== 200) {

            throw new Error(
                "Namaz vakitleri alınamadı."
            );
        }


        prayerTimes = data.data.timings;


        displayPrayerTimes();

        updateCountdown();


    } catch (error) {

        console.error(error);

        document.getElementById("prayerList").innerHTML =
            `<div class="loading">
                Namaz vakitleri alınamadı.
             </div>`;
    }
}



/* =========================
   NAMAZLARI EKRANA YAZ
========================= */

function displayPrayerTimes() {

    const prayers = [

        {
            name: "İmsak",
            key: "Fajr",
            icon: "🌙"
        },

        {
            name: "Güneş",
            key: "Sunrise",
            icon: "☀️"
        },

        {
            name: "Öğle",
            key: "Dhuhr",
            icon: "🕌"
        },

        {
            name: "İkindi",
            key: "Asr",
            icon: "🌤️"
        },

        {
            name: "Akşam",
            key: "Maghrib",
            icon: "🌇"
        },

        {
            name: "Yatsı",
            key: "Isha",
            icon: "🌙"
        }

    ];


    const container =
        document.getElementById("prayerList");


    container.innerHTML = "";


    prayers.forEach(prayer => {

        const card =
            document.createElement("div");


        card.className =
            "prayer-card";


        card.dataset.key =
            prayer.key;


        card.innerHTML = `

            <div class="prayer-info">

                <span class="prayer-icon">
                    ${prayer.icon}
                </span>

                <span class="prayer-name">
                    ${prayer.name}
                </span>

            </div>

            <span class="prayer-time">
                ${formatPrayerTime(prayerTimes[prayer.key])}
            </span>

        `;


        container.appendChild(card);

    });

}



/* =========================
   SAAT FORMATLA
========================= */

function formatPrayerTime(time) {

    if (!time) {
        return "--:--";
    }

    return time.substring(0, 5);
}



/* =========================
   SIRADAKİ NAMAZ
========================= */

function updateCountdown() {

    if (!prayerTimes.Fajr) {
        return;
    }


    const now = new Date();


    const prayers = [

        {
            name: "İmsak",
            key: "Fajr"
        },

        {
            name: "Güneş",
            key: "Sunrise"
        },

        {
            name: "Öğle",
            key: "Dhuhr"
        },

        {
            name: "İkindi",
            key: "Asr"
        },

        {
            name: "Akşam",
            key: "Maghrib"
        },

        {
            name: "Yatsı",
            key: "Isha"
        }

    ];


    let nextPrayer = null;
    let nextDate = null;


    for (const prayer of prayers) {

        const time =
            formatPrayerTime(
                prayerTimes[prayer.key]
            );


        const [hours, minutes] =
            time.split(":").map(Number);


        const prayerDate =
            new Date(now);


        prayerDate.setHours(
            hours,
            minutes,
            0,
            0
        );


        if (prayerDate > now) {

            nextPrayer = prayer;

            nextDate = prayerDate;

            break;
        }
    }


    /* GECE YARISINDAN SONRA İMSAK */

    if (!nextPrayer) {

        nextPrayer = prayers[0];

        const [hours, minutes] =
            formatPrayerTime(
                prayerTimes.Fajr
            )
            .split(":")
            .map(Number);


        nextDate = new Date(now);

        nextDate.setDate(
            nextDate.getDate() + 1
        );

        nextDate.setHours(
            hours,
            minutes,
            0,
            0
        );
    }


    const difference =
        nextDate.getTime() - now.getTime();


    const totalSeconds =
        Math.floor(difference / 1000);


    const hours =
        Math.floor(totalSeconds / 3600);


    const minutes =
        Math.floor(
            (totalSeconds % 3600) / 60
        );


    const seconds =
        totalSeconds % 60;


    document.getElementById(
        "nextPrayerName"
    ).textContent =
        nextPrayer.name;


    document.getElementById(
        "nextPrayerTime"
    ).textContent =
        formatPrayerTime(
            prayerTimes[nextPrayer.key]
        );


    document.getElementById(
        "remainingTime"
    ).textContent =
        `${String(hours).padStart(2, "0")}:` +
        `${String(minutes).padStart(2, "0")}:` +
        `${String(seconds).padStart(2, "0")}`;


    highlightNextPrayer(
        nextPrayer.key
    );
}



/* =========================
   SIRADAKİ NAMAZI VURGULA
========================= */

function highlightNextPrayer(key) {

    const cards =
        document.querySelectorAll(
            ".prayer-card"
        );


    cards.forEach(card => {

        card.classList.remove("next");


        if (card.dataset.key === key) {

            card.classList.add("next");

        }

    });

}



/* =========================
   ZİKİRMATİK
========================= */

let counter =
    Number(
        localStorage.getItem(
            "zikirmatikCounter"
        )
    ) || 0;


const counterElement =
    document.getElementById("counter");


function updateCounter() {

    counterElement.textContent =
        counter;


    localStorage.setItem(
        "zikirmatikCounter",
        counter
    );
}


updateCounter();


document
    .getElementById("counterButton")
    .addEventListener(
        "click",
        function() {

            counter++;

            updateCounter();

        }
    );


document
    .getElementById("resetButton")
    .addEventListener(
        "click",
        function() {

            const confirmReset =
                confirm(
                    "Zikir sayacını sıfırlamak istediğine emin misin?"
                );


            if (confirmReset) {

                counter = 0;

                updateCounter();

            }

        }
    );



/* =========================
   SAYFA GEÇİŞLERİ
========================= */

const navButtons =
    document.querySelectorAll(
        ".nav-button"
    );


navButtons.forEach(button => {

    button.addEventListener(
        "click",
        function() {

            const pageId =
                button.dataset.page;


            document
                .querySelectorAll(".page")
                .forEach(page => {

                    page.classList.remove(
                        "active"
                    );

                });


            document
                .getElementById(pageId)
                .classList.add(
                    "active"
                );


            navButtons.forEach(btn => {

                btn.classList.remove(
                    "active"
                );

            });


            button.classList.add(
                "active"
            );

        }
    );

});



/* =========================
   UYGULAMA BAŞLANGICI
========================= */

document.getElementById(
    "locationText"
).textContent =
    `${currentLocation.city}, ${currentLocation.country}`;


getPrayerTimes(
    currentLocation.city,
    currentLocation.country
);