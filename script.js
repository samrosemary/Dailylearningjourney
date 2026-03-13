const dateInput = document.getElementById("entryDate");
const notesInput = document.getElementById("notes");
const imagesInput = document.getElementById("images");
const preview = document.getElementById("imagePreview");
const saveBtn = document.getElementById("saveBtn");
const deleteBtn = document.getElementById("deleteBtn");
const pdfBtn = document.getElementById("pdfBtn");

dateInput.addEventListener("change", loadEntry);
saveBtn.addEventListener("click", saveEntry);
deleteBtn.addEventListener("click", deleteEntry);
pdfBtn.addEventListener("click", generatePDF);

imagesInput.addEventListener("change", () => {
    preview.innerHTML = "";
    [...imagesInput.files].forEach(file => {
        const reader = new FileReader();
        reader.onload = e => {
            const img = document.createElement("img");
            img.src = e.target.result;
            preview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
});

function saveEntry() {
    const date = dateInput.value;
    if (!date) return alert("Please select a date first");

    const notes = notesInput.value;
    const images = [...preview.querySelectorAll("img")].map(img => img.src);

    const entry = { notes, images };
    localStorage.setItem("entry-" + date, JSON.stringify(entry));

    alert("Entry saved");
}

function loadEntry() {
    const date = dateInput.value;
    const saved = localStorage.getItem("entry-" + date);

    if (!saved) {
        notesInput.value = "";
        preview.innerHTML = "";
        return;
    }

    const entry = JSON.parse(saved);
    notesInput.value = entry.notes;

    preview.innerHTML = "";
    entry.images.forEach(src => {
        const img = document.createElement("img");
        img.src = src;
        preview.appendChild(img);
    });
}

function deleteEntry() {
    const date = dateInput.value;
    if (!date) return alert("Select a date first");

    if (localStorage.getItem("entry-" + date)) {
        localStorage.removeItem("entry-" + date);
        notesInput.value = "";
        preview.innerHTML = "";
        alert("Entry deleted");
    } else {
        alert("No entry exists for this date");
    }
}

async function generatePDF() {
    const date = dateInput.value;
    if (!date) return alert("Please select a date first");

    const saved = localStorage.getItem("entry-" + date);
    if (!saved) return alert("No entry found for this date");

    const entry = JSON.parse(saved);

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    // Title
    pdf.setFontSize(18);
    pdf.text(`Learning Diary — ${date}`, 10, 20);

    // Notes
    pdf.setFontSize(12);
    pdf.text("Notes:", 10, 35);

    const splitNotes = pdf.splitTextToSize(entry.notes, 180);
    pdf.text(splitNotes, 10, 45);

    // Calculate space used by notes
    let y = 45 + splitNotes.length * 7;

    // Page height limit
    const pageHeight = 280; // keep bottom margin

    // Remaining space for images
    const remainingHeight = pageHeight - y;

    const images = entry.images;
    if (images.length > 0) {
        // Load all images to get their natural sizes
        const loadedImages = await Promise.all(images.map(src => loadImage(src)));

        // Calculate total height if images were maxWidth = 150
        const maxWidth = 150;
        const scaledHeights = loadedImages.map(img => {
            const scale = maxWidth / img.width;
            return img.height * scale;
        });

        const totalHeight = scaledHeights.reduce((a, b) => a + b + 10, 0);

        // If total height exceeds remaining space, scale all images down
        let scaleFactor = 1;
        if (totalHeight > remainingHeight) {
            scaleFactor = remainingHeight / totalHeight;
        }

        // Add images with final scaling
        for (let i = 0; i < images.length; i++) {
            const img = loadedImages[i];

            const baseScale = maxWidth / img.width;
            const finalScale = baseScale * scaleFactor;

            const finalWidth = img.width * finalScale;
            const finalHeight = img.height * finalScale;

            pdf.addImage(images[i], "JPEG", 10, y, finalWidth, finalHeight);
            y += finalHeight + 5;
        }
    }

    pdf.save(`Diary-${date}.pdf`);
}

function loadImage(src) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = src;
    });
}