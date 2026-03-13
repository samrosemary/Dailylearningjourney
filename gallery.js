const timeline = document.getElementById("timeline");

function loadTimeline() {
    timeline.innerHTML = "";

    const keys = Object.keys(localStorage)
        .filter(k => k.startsWith("entry-"))
        .sort(); // chronological order

    keys.forEach(key => {
        const date = key.replace("entry-", "");
        const entry = JSON.parse(localStorage.getItem(key));

        const div = document.createElement("div");
        div.className = "timeline-entry";

        div.innerHTML = `
            <h3>${date}</h3>
            <p>${entry.notes.substring(0, 150)}...</p>
        `;

        entry.images.forEach(src => {
            const img = document.createElement("img");
            img.src = src;
            div.appendChild(img);
        });

        timeline.appendChild(div);
    });
}

loadTimeline();