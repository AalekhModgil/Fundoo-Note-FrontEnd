// Focus on search icon when clicked
document.querySelector(".fundoo-dash-search i").addEventListener("click", function() {
    document.getElementById("searchInput").focus();
});

document.addEventListener("DOMContentLoaded", function () {
    const noteInput = document.getElementById("noteInput");
    const notesGrid = document.querySelector(".fundoo-dash-notes-grid");
    const modalNoteContent = document.getElementById("modalNoteContent");
    const noteModal = new bootstrap.Modal(document.getElementById("noteModal"));
    const jwtToken = localStorage.getItem("jwtToken");
    const userName = localStorage.getItem("userName");
    const userEmail = localStorage.getItem("userEmail");
    let currentView = "notes";

    if (!jwtToken) {
        alert("You must be logged in to create and view notes.");
        return;
    }

    if (userName) document.getElementById("profileName").textContent = `Hi, ${userName}`;
    if (userEmail) {
        document.getElementById("profileEmail").textContent = userEmail;
        const emailInitial = userEmail.charAt(0).toUpperCase();
        document.getElementById("profileButton").textContent = emailInitial;
        document.getElementById("profileAvatar").textContent = emailInitial;
    }

    // Toggle dropdown on button click
    profileButton.addEventListener("click", function (event) {
        event.stopPropagation();
        profileDropdown.style.display = profileDropdown.style.display === "block" ? "none" : "block";
    });

    // Hide dropdown when clicking outside
    document.addEventListener("click", function (event) {
        if (!profileDropdown.contains(event.target) && event.target !== profileButton) {
            profileDropdown.style.display = "none";
        }
    });

    // Fetch Notes on Page Load
    fetchNotes();

    // Logout
    document.getElementById("logoutButton").addEventListener("click", function () {
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userName");
        window.location.href = "../pages/fundooLogin.html";
    });

    // Sidebar Navigation Event Listeners
    document.getElementById("notesTab").addEventListener("click", () => switchView("notes"));
    document.getElementById("archiveTab").addEventListener("click", () => switchView("archive"));
    document.getElementById("trashTab").addEventListener("click", () => switchView("trash"));

    function switchView(view) {
        currentView = view;
        fetchNotes();

        const createNoteSection = document.querySelector(".fundoo-dash-create-note");
        if (currentView === "notes") {
            createNoteSection.style.display = "block";
        } else {
            createNoteSection.style.display = "none";
        }

        document.querySelectorAll(".fundoo-dash-sidebar li").forEach(tab => {
            tab.classList.remove("active");
        });

        document.getElementById(`${view}Tab`).classList.add("active");

        document.body.classList.remove("notes-active", "archive-active", "trash-active");
        document.body.classList.add(`${view}-active`);

        document.querySelector(".fundoo-dash-create-note").style.display = view === "notes" ? "block" : "none";

        fetchNotes();
    }

    // Save note on blur
    noteInput.addEventListener("blur", function () {
        const content = noteInput.value.trim();
        if (content) saveNote(content);
    });

    function fetchNotes() {
        fetch("http://localhost:3000/api/v1/notes/getNote", {
            method: "GET",
            headers: { "Authorization": `Bearer ${jwtToken}` }
        })
        .then(response => response.json())
        .then(notes => {
            if (!Array.isArray(notes)) {
                console.error("Error fetching notes:", notes);
                return;
            }

            notesGrid.innerHTML = "";

            notes.forEach(note => {
                let shouldAdd = false;

                switch (currentView) {
                    case "notes":
                        shouldAdd = !note.is_deleted && !note.is_archived;
                        break;
                    case "archive":
                        shouldAdd = note.is_archived && !note.is_deleted;
                        break;
                    case "trash":
                        shouldAdd = note.is_deleted;
                        break;
                }

                if (shouldAdd) addNoteToUI(note.id, note.content, note.colour || "white");
            });
        })
        .catch(error => console.error("Request Failed:", error));
    }

    function saveNote(content) {
        fetch("http://localhost:3000/api/v1/notes/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${jwtToken}`
            },
            body: JSON.stringify({ title: "New Note", content })
        })
        .then(response => response.json())
        .then(data => {
            if (data.note) {
                addNoteToUI(data.note.id, data.note.content, data.note.colour || "white");
                noteInput.value = "";
            } else {
                console.error("Error:", data.errors);
            }
        })
        .catch(error => console.error("Request Failed:", error));
    }

    function addNoteToUI(id, content, colour = "white") {
        const noteDiv = document.createElement("div");
        noteDiv.classList.add("fundoo-dash-note");
        noteDiv.dataset.id = id;
        noteDiv.style.backgroundColor = colour;

        let iconsHTML = "";
        if (currentView === "notes") {
            iconsHTML = `
                <i class="fas fa-box-archive archive-icon" title="Archive"></i>
                <i class="fas fa-trash delete-icon" title="Move to Trash"></i>
                <i class="fas fa-palette colour-icon" title="Change Colour"></i>
            `;
        } else if (currentView === "archive") {
            iconsHTML = `
                <i class="fas fa-folder-open unarchive-icon" title="Unarchive"></i>
                <i class="fas fa-trash delete-icon" title="Move to Trash"></i>
                <i class="fas fa-palette colour-icon" title="Change Colour"></i>
            `;
        } else if (currentView === "trash") {
            iconsHTML = `
                <i class="fas fa-undo restore-icon" title="Restore"></i>
                <i class="fas fa-trash-alt delete-permanent-icon" title="Delete Permanently"></i>
                <i class="fas fa-palette colour-icon" title="Change Colour"></i>
            `;
        }

        noteDiv.innerHTML = `
            <p>${content}</p>
            <div class="note-icons">${iconsHTML}</div>
        `;

        noteDiv.addEventListener("click", function (event) {
            if (event.target.classList.contains("archive-icon") || 
                event.target.classList.contains("delete-icon") || 
                event.target.classList.contains("unarchive-icon") || 
                event.target.classList.contains("restore-icon") || 
                event.target.classList.contains("delete-permanent-icon") || 
                event.target.classList.contains("colour-icon")) return;

            modalNoteContent.value = content;

            const modalIcons = document.querySelector(".modal-icons");
            modalIcons.innerHTML = "";

            if (currentView === "notes") {
                modalIcons.innerHTML = `
                    <i class="fas fa-box-archive archive-icon" title="Archive"></i>
                    <i class="fas fa-trash delete-icon" title="Move to Trash"></i>
                    <i class="fas fa-palette colour-icon" title="Change Colour"></i>
                `;
                modalIcons.querySelector(".archive-icon").addEventListener("click", () => toggleArchive(id).then(() => noteModal.hide()));
                modalIcons.querySelector(".delete-icon").addEventListener("click", () => toggleTrash(id).then(() => noteModal.hide()));
                modalIcons.querySelector(".colour-icon").addEventListener("click", () => openColourPicker(id, noteDiv));
            } else if (currentView === "archive") {
                modalIcons.innerHTML = `
                    <i class="fas fa-folder-open unarchive-icon" title="Unarchive"></i>
                    <i class="fas fa-trash delete-icon" title="Move to Trash"></i>
                    <i class="fas fa-palette colour-icon" title="Change Colour"></i>
                `;
                modalIcons.querySelector(".unarchive-icon").addEventListener("click", () => toggleArchive(id).then(() => noteModal.hide()));
                modalIcons.querySelector(".delete-icon").addEventListener("click", () => toggleTrash(id).then(() => noteModal.hide()));
                modalIcons.querySelector(".colour-icon").addEventListener("click", () => openColourPicker(id, noteDiv));
            } else if (currentView === "trash") {
                modalIcons.innerHTML = `
                    <i class="fas fa-undo restore-icon" title="Restore"></i>
                    <i class="fas fa-trash-alt delete-permanent-icon" title="Delete Permanently"></i>
                    <i class="fas fa-palette colour-icon" title="Change Colour"></i>
                `;
                modalIcons.querySelector(".restore-icon").addEventListener("click", () => restoreNote(id).then(() => noteModal.hide()));
                modalIcons.querySelector(".delete-permanent-icon").addEventListener("click", () => deleteNote(id).then(() => noteModal.hide()));
                modalIcons.querySelector(".colour-icon").addEventListener("click", () => openColourPicker(id, noteDiv));
            }

            noteModal.show();
        });

        if (currentView === "notes") {
            noteDiv.querySelector(".archive-icon").addEventListener("click", () => toggleArchive(id));
            noteDiv.querySelector(".delete-icon").addEventListener("click", () => toggleTrash(id));
            noteDiv.querySelector(".colour-icon").addEventListener("click", () => openColourPicker(id, noteDiv));
        } else if (currentView === "archive") {
            noteDiv.querySelector(".unarchive-icon").addEventListener("click", () => toggleArchive(id));
            noteDiv.querySelector(".delete-icon").addEventListener("click", () => toggleTrash(id));
            noteDiv.querySelector(".colour-icon").addEventListener("click", () => openColourPicker(id, noteDiv));
        } else if (currentView === "trash") {
            noteDiv.querySelector(".restore-icon").addEventListener("click", () => restoreNote(id));
            noteDiv.querySelector(".delete-permanent-icon").addEventListener("click", () => deleteNote(id));
            noteDiv.querySelector(".colour-icon").addEventListener("click", () => openColourPicker(id, noteDiv));
        }

        notesGrid.prepend(noteDiv);
    }

    function toggleArchive(id) {
        return fetch(`http://localhost:3000/api/v1/notes/archiveToggle/${id}`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${jwtToken}` }
        })
        .then(() => fetchNotes())
        .catch(error => console.error("Error:", error));
    }

    function toggleTrash(id) {
        return fetch(`http://localhost:3000/api/v1/notes/trashToggle/${id}`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${jwtToken}` }
        })
        .then(() => fetchNotes())
        .catch(error => console.error("Error:", error));
    }

    function restoreNote(id) {
        return fetch(`http://localhost:3000/api/v1/notes/trashToggle/${id}`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${jwtToken}` }
        })
        .then(() => fetchNotes())
        .catch(error => console.error("Error:", error));
    }

    function deleteNote(id) {
        return fetch(`http://localhost:3000/api/v1/notes/deleteNote/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${jwtToken}` }
        })
        .then(() => fetchNotes())
        .catch(error => console.error("Error:", error));
    }

    // New function to handle colour change
    function openColourPicker(noteId, noteElement) {
        // Create a color picker popup
        const colorPicker = document.createElement("div");
        colorPicker.classList.add("color-picker-popup");
        colorPicker.style.position = "absolute";
        colorPicker.style.zIndex = "1000";
        colorPicker.style.background = "#fff";
        colorPicker.style.borderRadius = "8px";
        colorPicker.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
        colorPicker.style.padding = "10px";
        colorPicker.style.display = "grid";
        colorPicker.style.gridTemplateColumns = "repeat(5, 30px)";
        colorPicker.style.gap = "5px";
    
        // Define a palette of colors (similar to Google Keep)
        const colors = [
            "#f28b82", "#fbbc04", "#fff475", "#ccff90", "#a7ffeb",
            "#cbf0f8", "#aecbfa", "#d7aefb", "#fdcfe8", "#e6c9a8",
            "#e8eaed"
        ];
    
        // Create color circles
        colors.forEach(color => {
            const colorCircle = document.createElement("div");
            colorCircle.style.width = "30px";
            colorCircle.style.height = "30px";
            colorCircle.style.borderRadius = "50%";
            colorCircle.style.backgroundColor = color;
            colorCircle.style.cursor = "pointer";
            colorCircle.style.border = "2px solid #fff";
            colorCircle.addEventListener("click", () => {
                updateNoteColour(noteId, color, noteElement);
                document.body.removeChild(colorPicker); // Remove picker after selection
            });
            colorCircle.addEventListener("mouseover", () => {
                colorCircle.style.borderColor = "#ddd";
            });
            colorCircle.addEventListener("mouseout", () => {
                colorCircle.style.borderColor = "#fff";
            });
            colorPicker.appendChild(colorCircle);
        });
    
        // Add close button (optional, like the 'x' in Google Keep)
        const closeButton = document.createElement("div");
        closeButton.textContent = "×";
        closeButton.style.position = "absolute";
        closeButton.style.top = "5px";
        closeButton.style.right = "5px";
        closeButton.style.fontSize = "18px";
        closeButton.style.cursor = "pointer";
        closeButton.addEventListener("click", () => {
            document.body.removeChild(colorPicker);
        });
        colorPicker.appendChild(closeButton);
    
        // Position the picker near the note
        const rect = noteElement.getBoundingClientRect();
        colorPicker.style.top = `${rect.bottom + window.scrollY + 5}px`;
        colorPicker.style.left = `${rect.left + window.scrollX}px`;
    
        // Append to body
        document.body.appendChild(colorPicker);
    
        // Remove picker if clicked outside
        document.addEventListener("click", function handleOutsideClick(event) {
            if (!colorPicker.contains(event.target) && event.target !== noteElement.querySelector(".colour-icon")) {
                document.body.removeChild(colorPicker);
                document.removeEventListener("click", handleOutsideClick);
            }
        });
    }

    function updateNoteColour(noteId, colour, noteElement) {
        fetch(`http://localhost:3000/api/v1/notes/updateColour/${noteId}/${encodeURIComponent(colour)}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${jwtToken}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                noteElement.style.backgroundColor = colour;
                console.log(data.message);
            } else {
                console.error("Error:", data.errors);
            }
        })
        .catch(error => console.error("Request Failed:", error));
    }
});