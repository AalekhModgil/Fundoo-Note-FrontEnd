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
    let currentView = "notes";

    if (!jwtToken) {
        alert("You must be logged in to create and view notes.");
        return;
    }

    // Fetch Notes on Page Load
    fetchNotes();

    // Sidebar Navigation Event Listeners
    document.getElementById("notesTab").addEventListener("click", () => switchView("notes"));
    document.getElementById("archiveTab").addEventListener("click", () => switchView("archive"));
    document.getElementById("trashTab").addEventListener("click", () => switchView("trash"));

    function switchView(view) {
        currentView = view;
        fetchNotes();

        // Show create note input only when in "Notes" tab
        const createNoteSection = document.querySelector(".fundoo-dash-create-note");
        if (currentView === "notes") {
            createNoteSection.style.display = "block"; // Show
        } else {
            createNoteSection.style.display = "none"; // Hide
        }
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

            notesGrid.innerHTML = ""; // Clear UI before adding new notes

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

                if (shouldAdd) addNoteToUI(note.id, note.content, note.colour);
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
                addNoteToUI(data.note.id, data.note.content, data.note.colour);
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
            `;
        } else if (currentView === "archive") {
            iconsHTML = `
                <i class="fas fa-folder-open unarchive-icon" title="Unarchive"></i>
                <i class="fas fa-trash delete-icon" title="Move to Trash"></i>
            `;
        } else if (currentView === "trash") {
            iconsHTML = `
                <i class="fas fa-undo restore-icon" title="Restore"></i>
                <i class="fas fa-trash-alt delete-permanent-icon" title="Delete Permanently"></i>
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
                event.target.classList.contains("delete-permanent-icon")) return;

            modalNoteContent.value = content;
            noteModal.show();
        });

        if (currentView === "notes") {
            noteDiv.querySelector(".archive-icon").addEventListener("click", () => toggleArchive(id));
            noteDiv.querySelector(".delete-icon").addEventListener("click", () => toggleTrash(id));
        } else if (currentView === "archive") {
            noteDiv.querySelector(".unarchive-icon").addEventListener("click", () => toggleArchive(id));
            noteDiv.querySelector(".delete-icon").addEventListener("click", () => toggleTrash(id));
        } else if (currentView === "trash") {
            noteDiv.querySelector(".restore-icon").addEventListener("click", () => restoreNote(id));
            noteDiv.querySelector(".delete-permanent-icon").addEventListener("click", () => deleteNote(id));
        }

        notesGrid.prepend(noteDiv);
    }

    function toggleArchive(id) {
        fetch(`http://localhost:3000/api/v1/notes/archiveToggle/${id}`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${jwtToken}` }
        })
        .then(() => fetchNotes())
        .catch(error => console.error("Error:", error));
    }

    function toggleTrash(id) {
        fetch(`http://localhost:3000/api/v1/notes/trashToggle/${id}`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${jwtToken}` }
        })
        .then(() => fetchNotes())
        .catch(error => console.error("Error:", error));
    }

    function restoreNote(id) {
        fetch(`http://localhost:3000/api/v1/notes/trashToggle/${id}`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${jwtToken}` }
        })
        .then(() => fetchNotes())
        .catch(error => console.error("Error:", error));
    }

    function deleteNote(id) {
        fetch(`http://localhost:3000/api/v1/notes/deleteNote/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${jwtToken}` }
        })
        .then(() => fetchNotes())
        .catch(error => console.error("Error:", error));
    }
});
