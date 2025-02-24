//Focus on search icon
document.querySelector(".fundoo-dash-search i").addEventListener("click", function() {
    document.getElementById("searchInput").focus();
});


// Modal 
document.addEventListener("DOMContentLoaded", function () {
    // Select all note elements
    const notes = document.querySelectorAll(".fundoo-dash-note");
    const modalTextarea = document.getElementById("modalNoteContent");
    const noteModal = new bootstrap.Modal(document.getElementById("noteModal"));

    let currentNote = null; // To track the clicked note

    notes.forEach(note => {
        note.addEventListener("click", function () {
            currentNote = this; // Store the clicked note
            modalTextarea.value = this.textContent; // Load note content into modal textarea
            noteModal.show(); // Show the modal
        });
    });

    // Save changes when user clicks outside the textarea (focus out)
    modalTextarea.addEventListener("blur", function () {
        if (currentNote) {
            currentNote.textContent = modalTextarea.value; // Update note content
        }
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const noteInput = document.getElementById("noteInput"); // Textarea input
    const notesGrid = document.querySelector(".fundoo-dash-notes-grid"); // Notes container
    const modalNoteContent = document.getElementById("modalNoteContent"); // Modal textarea
    const jwtToken = localStorage.getItem("jwtToken"); // Get JWT token from local storage
    let currentView = "notes"; // Tracks current tab (notes, archive, trash)

    if (!jwtToken) {
        alert("You must be logged in to create and view notes.");
        return;
    }

    // Fetch Notes on Page Load
    fetchNotes();

    // Navbar Click Handlers
    document.getElementById("notesTab").addEventListener("click", function () {
        currentView = "notes";
        fetchNotes();
    });

    document.getElementById("archiveTab").addEventListener("click", function () {
        currentView = "archive";
        fetchNotes();
    });

    document.getElementById("trashTab").addEventListener("click", function () {
        currentView = "trash";
        fetchNotes();
    });

    // Save note on blur (focus out)
    noteInput.addEventListener("blur", function () {
        const content = noteInput.value.trim();
        if (content) {
            saveNote(content);
        }
    });

    function fetchNotes() {
        fetch("http://localhost:3000/api/v1/notes/getNote", {
            method: "GET",
            headers: { "Authorization": `Bearer ${jwtToken}` }
        })
        .then(response => response.json())
        .then(notes => {
            if (Array.isArray(notes)) {
                notesGrid.innerHTML = ""; // Clear UI
                notes.forEach(note => {
                    if (note.is_deleted) {
                        if (currentView === "trash") {
                            addNoteToUI(note.id, note.content, note.colour, "trash");
                            added = true;
                        }
                    } else if (note.is_archived) {
                        if (currentView === "archive") {
                            addNoteToUI(note.id, note.content, note.colour, "archive");
                            added = true;
                        }
                    } else {
                        if (currentView === "notes") {
                            addNoteToUI(note.id, note.content, note.colour, "notes");
                            added = true;
                        }
                    }
                });
            } else {
                console.error("Error fetching notes:", notes);
            }
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
                console.log("Note Saved:", data.note);
                addNoteToUI(data.note.id, data.note.content, data.note.colour); 
                noteInput.value = ""; // Clear input field
            } else {
                console.error("Error:", data.errors);
            }
        })
        .catch(error => console.error("Request Failed:", error));
    }

    // function addNoteToUI(id, content, colour = "white", isArchived = false) {
    //     const noteDiv = document.createElement("div");
    //     noteDiv.classList.add("fundoo-dash-note");
    //     noteDiv.dataset.id = id;
    //     noteDiv.style.backgroundColor = colour;
    //     noteDiv.innerHTML = `
    //         <p>${content}</p>
    //         <div class="note-icons">
    //             <i class="fas fa-box-archive archive-icon" title="Archive"></i>
    //             <i class="fas fa-trash delete-icon" title="Delete"></i>
    //         </div>
    //     `;

    //     noteDiv.addEventListener("click", function (event) {
    //         if (event.target.classList.contains("delete-icon") || event.target.classList.contains("archive-icon")) return;
    //         modalNoteContent.value = content;
    //         const noteModal = new bootstrap.Modal(document.getElementById("noteModal"));
    //         noteModal.show();
    //     });

    //     noteDiv.querySelector(".archive-icon").addEventListener("click", function () {
    //         toggleArchive(id);
    //     });

    //     noteDiv.querySelector(".delete-icon").addEventListener("click", function () {
    //         toggleTrash(id);
    //     });

    //     notesGrid.prepend(noteDiv);
    // }

    function addNoteToUI(id, content, colour = "white", isArchived = false, isDeleted = false) {
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
    
        // Attach event listeners based on the current view
        if (currentView === "notes") {
            noteDiv.querySelector(".archive-icon").addEventListener("click", function () {
                toggleArchive(id);
            });
    
            noteDiv.querySelector(".delete-icon").addEventListener("click", function () {
                toggleTrash(id);
            });
    
        } else if (currentView === "archive") {
            noteDiv.querySelector(".unarchive-icon").addEventListener("click", function () {
                toggleArchive(id);
            });
    
            noteDiv.querySelector(".delete-icon").addEventListener("click", function () {
                toggleTrash(id);
            });
    
        } else if (currentView === "trash") {
            noteDiv.querySelector(".restore-icon").addEventListener("click", function () {
                restoreNote(id, isArchived);
            });
    
            noteDiv.querySelector(".delete-permanent-icon").addEventListener("click", function () {
                deleteNote(id);
            });
        }
    
        notesGrid.prepend(noteDiv);
    }
    

    function toggleArchive(id) {
        fetch(`http://localhost:3000/api/v1/notes/archiveToggle/${id}`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${jwtToken}` }
        })
        .then(response => response.json())
        .then(() => {
            fetchNotes();
        })
        .catch(error => console.error("Error:", error));
    }

    function toggleTrash(id) {
        fetch(`http://localhost:3000/api/v1/notes/trashToggle/${id}`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${jwtToken}` }
        })
        .then(response => response.json())
        .then(() => {
            fetchNotes();
        })
        .catch(error => console.error("Error:", error));
    }

    function restoreNote(id, wasArchived) {
        fetch(`http://localhost:3000/api/v1/notes/trashToggle/${id}`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${jwtToken}` }
        })
        .then(response => response.json())
        .then(() => {
            fetchNotes();
        })
        .catch(error => console.error("Error:", error));
    }
    
    function deleteNote(id) {
        fetch(`http://localhost:3000/api/v1/notes/deleteNote/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${jwtToken}` }
        })
        .then(response => response.json())
        .then(() => {
            fetchNotes();
        })
        .catch(error => console.error("Error:", error));
    }
    
});


