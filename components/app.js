import NoteComponent from './note-component.js';

/**
 * @typedef {Object} Note
 * @property {string} title - The title of the note.
 * @property {string} content - The content of the note.
 * @property {string} date - The date of the note as an ISO string.
 */

export default class App {
    #el; // Root element
    #data; // Reactive data
    #previousData; // For comparison
    #elements; // Important HTML elements

    constructor(options) {
        this.#el = document.querySelector(options.el);
        this.#data = this.#initializeData(); // Initialize data
        this.#previousData = this.#initializeData(); // Initialize previous data state
        this.#elements = this.#initializeElements(); // Initialize DOM elements references
        this.#data = this.#makeReactive(this.#data); // Make data reactive
        this.#render();
        this.#setupEventListeners();
    }

    #initializeData() {
        return {
            /** @type {boolean} */
            ongoingAddNoteOperation: false,

            /** @type {boolean} */
            ongoingEditNoteOperation: false,

            /** @type {null | string} */
            currentlyEditedNote: null,

            /** @type {null | string} */
            currentlyRemovedNote: null,

            /** @type {Array<Note>} */
            notes: [],
        };
    }

    /** 
     * @returns {{
     *   addNoteAction: Array<HTMLElement>
     *   addButtonRole: HTMLElement,
     *   addNoteFormRole: HTMLElement,
     *   searchInputRole: HTMLElement,
     *   notesContainerRole: HTMLElement,
     *   infoNotesEmptyRole: HTMLElement
     * }}
     */
    #initializeElements() {
        return {
            // Actions
            addNoteAction: this.#el.querySelectorAll('[data-action="add-new-note"]'),
            cancelAddNoteAction: this.#el.querySelectorAll('[data-action="cancel-new-note"]'),
            submitNewNoteAction: this.#el.querySelectorAll('[data-action="submit-new-note"]'),
            hideModalsAction: this.#el.querySelectorAll('[data-action="hide-modals"]'),
            editNoteConfirmAction: this.#el.querySelectorAll('[data-action="edit-note-confirm"]'),
            confirmDeleteAction: this.#el.querySelectorAll('[data-action="delete-note-confirm"]'),
            searchNotesAction: this.#el.querySelectorAll('[data-action="search-notes"]'),

            // Roles
            addButtonRole: this.#el.querySelector('[data-role="add-note"]'),
            addNoteFormRole: this.#el.querySelector('[data-role="add-note-form"]'),
            newNoteFormTitle: this.#el.querySelector('[data-role="new-note-title"]'),
            newNoteFormContent: this.#el.querySelector('[data-role="new-note-content"]'),
            notesContainerRole: this.#el.querySelector('[data-role="notes-container"]'),
            infoNotesEmptyRole: this.#el.querySelector('[data-role="info-notes-empty"]'),
            editNoteModalRole: this.#el.querySelector('[data-role="edit-note-modal"]'),
            deleteNoteModalRole: this.#el.querySelector('[data-role="delete-note-modal"]'),
            modalsContainerRole: this.#el.querySelector('[data-role="modals-container"]'),
            editNoteFormTitle: this.#el.querySelector('[data-role="edit-note-title"]'),
            editNoteFormContent: this.#el.querySelector('[data-role="edit-note-content"]'),
            searchInputRole: this.#el.querySelector('[data-role="search-input"]'),
        };
    }

    /**
     * Make the app watch for any changes to the data object
     * Haven't had time to add full detection of array modification
     * TODO: Add detection of methods like .push()
     * @param {*} data 
     * @returns 
     */
    #makeReactive(data) {
        return new Proxy(data, {
            set: (target, prop, value) => {
                target[prop] = value;
                this.#handleDataChange(prop);
                return true;
            }
        });
    }

    // Debounce function to prevent search lag
    #debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }


    /**
     * Applies is-hidden class or removes it
     * @param {HTMLElement} element 
     * @param {boolean} isVisible 
     */
    #toggleVisibility(element, isVisible = true) {
        element.classList.toggle('is-hidden', !isVisible);
    }

    #handleDataChange(prop) {
        this.#render();
        // Update previousData to the current state after rendering
        this.#previousData = { ...this.#data };
    }

    #addActionEventListener(elements, action, callback) {
        elements.forEach(element => {
            element.addEventListener(action, callback);
        });
    }


    #setupEventListeners() {
        // Add note action
        this.#addActionEventListener(this.#elements.addNoteAction, 'click', () => {
            this.#data.ongoingAddNoteOperation = true;
        })

        // Cancel adding note action
        this.#addActionEventListener(this.#elements.cancelAddNoteAction, 'click', () => {
            this.#data.ongoingAddNoteOperation = false;
        })

        // Submit new note
        this.#addActionEventListener(this.#elements.submitNewNoteAction, 'click', () => {
            this.#data.ongoingAddNoteOperation = false;
            this.#submitNote();
        })

        // Hide all modals
        this.#addActionEventListener(this.#elements.hideModalsAction, 'click', () => {
            this.#data.currentlyEditedNote = null;
            this.#data.currentlyRemovedNote = null;
            this.#render();
        })

        // Confirm editing note
        this.#addActionEventListener(this.#elements.editNoteConfirmAction, 'click', () => {
            this.#submitEditNote();
        });

        // Confirm deleting note
        this.#addActionEventListener(this.#elements.confirmDeleteAction, 'click', () => {
            this.#confirmDeleteNote();
        });

        this.#addActionEventListener(this.#elements.searchNotesAction, 'keyup', this.#debounce((e) => {
            const searchTerm = this.#elements.searchInputRole.value;  // Get the search term from the input
            this.#filterNotes(searchTerm);      // Filter notes based on the search term
        }, 50)); // 50 ms debounce time

    }

    #showModal(modalType) {
        console.log('Showing modal ', modalType);
        const modalsContainer = this.#elements.modalsContainerRole;
        modalsContainer.classList.toggle('is-hidden', false);

        // Hide all modals
        const modals = modalsContainer.querySelectorAll('.modal');
        modals.forEach(modal => modal.classList.add('is-hidden'));

        const targetModal = this.#elements[modalType] ?? this.#elements.editNoteModalRole;
        if (targetModal) {
            targetModal.classList.toggle('is-hidden', false); // Show the target modal

            // If the edit modal is being shown, pre-fill the form with the note details
            if (modalType === 'editNoteModalRole' && this.#data.currentlyEditedNote) {
                const noteId = this.#data.currentlyEditedNote;
                const note = this.#data.notes.find(n => n.id === noteId);

                if (note) {
                    this.#elements.editNoteFormTitle.value = note.title;
                    this.#elements.editNoteFormContent.value = note.content;
                    console.log(note.title, note.content);
                } else
                    console.error('Cannot find proper note by id');
            }
        }
    }


    #hideModal() {
        const modalsContainer = this.#elements.modalsContainerRole;
        modalsContainer.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('is-hidden'); // Hide all modals
        });
        modalsContainer.classList.toggle('is-hidden', true);
    }

    #submitNote() {
        const title = this.#elements.newNoteFormTitle.value;
        const content = this.#elements.newNoteFormContent.value;
        const date = new Date();

        // TODO: Add proper title detection and user feedback
        if (title == '' || content == '') {
            window.alert('Make sure title and content is not empty.');
            return;
        }

        this.#createNewNote(title, content, date);
    }

    #submitEditNote() {
        const title = this.#elements.editNoteFormTitle.value;
        const content = this.#elements.editNoteFormContent.value;
        const noteId = this.#data.currentlyEditedNote;

        // TODO: Add proper title detection and user feedback
        if (title === '' || content === '') {
            window.alert('Make sure title and content are not empty.');
            return;
        }

        // Find and update the note
        const note = this.#data.notes.find(n => n.id === noteId);
        if (note) {
            note.title = title;
            note.content = content;
            console.log('Edited note: ', note);
            this.#handleDataChange('notes');
        } else
            console.error('Cannot find proper note by id.');

        // Close the modal
        this.#hideModal();
    }

    #confirmDeleteNote() {
        const noteId = this.#data.currentlyRemovedNote;
        if (noteId) {
            this.#handleDeleteNote(noteId);
            this.#data.currentlyRemovedNote = null;
        }
        this.#hideModal();
    }

    // Function to filter notes based on search input
    #filterNotes(searchTerm) {
        const filteredNotes = this.#data.notes.filter(note => {
            const titleMatch = note.title.toLowerCase().includes(searchTerm.toLowerCase());
            const contentMatch = note.content.toLowerCase().includes(searchTerm.toLowerCase());
            return titleMatch || contentMatch;
        });

        // Render only the filtered notes
        this.#renderNotes(filteredNotes);
    }


    #createNewNote(title, content, date) {
        let note = new NoteComponent();

        note.title = title;
        note.content = content;
        note.date = date;

        // Use the date as a unique identifier
        note.id = date.toISOString(); // Set an ID for the note

        this.#data.notes.push(note);
        this.#render(); // Manual render

        note.addEventListener('deleteNote', (event) => {
            this.#data.currentlyRemovedNote = note.id;
        });

        note.addEventListener('editNote', (event) => {
            this.#data.currentlyEditedNote = note.id;
        });
    }

    #handleDeleteNote(noteId) {
        this.#data.notes = this.#data.notes.filter(note => note.id !== noteId);
        this.#render(); // Update the view after deletion
    }

    /**
     * Check if two values are different from each other
     * FIXME: Currently doesn't detect object differences properly, not used
     * @param {*} previousData First value
     * @param {*} currentData Second value
     * @returns {boolean} True if values differ
     */
    #hasChanged(previousData, currentData) {
        function deepEqual(a, b) {
            if (a === b) return true;

            if (typeof a !== typeof b) return false;

            if (Array.isArray(a)) {
                if (a.length !== b.length) return false;
                return a.every((item, index) => deepEqual(item, b[index]));
            }

            if (typeof a === 'object' && a !== null && b !== null) {
                const aKeys = Object.keys(a);
                const bKeys = Object.keys(b);

                if (aKeys.length !== bKeys.length) return false;

                return aKeys.every(key => deepEqual(a[key], b[key]));
            }

            return false;
        }

        return !deepEqual(previousData, currentData);
    }

    // Renders app
    #render() {
        const currentData = this.#data;
        const previousData = this.#previousData;

        console.info('Rendering the app: ', currentData);

        this.#renderAddNewForm(currentData.notes.length == 0, currentData.ongoingAddNoteOperation);

        this.#renderNotes(currentData.notes);
        console.log('Notes changed: ', this.#hasChanged(previousData.notes, currentData.notes));

        this.#renderModals();
    }

    #renderAddNewForm(isEmpty, ongoingAddNoteOperation) {
        const showEmptyInfo = isEmpty && !ongoingAddNoteOperation;
        const showAddForm = ongoingAddNoteOperation;
        const showAddButton = !ongoingAddNoteOperation && !isEmpty;

        this.#toggleVisibility(this.#elements.infoNotesEmptyRole, showEmptyInfo);
        this.#toggleVisibility(this.#elements.addButtonRole, showAddButton);
        this.#toggleVisibility(this.#elements.addNoteFormRole, showAddForm);
    }

    #renderNotes(notes) {
        // Clear the notes container first to avoid duplicate rendering
        this.#elements.notesContainerRole.innerHTML = '';

        // Loop through the already existing note nodes in the data
        notes.forEach(noteNode => {
            // Re-attach the existing note node to the container
            this.#elements.notesContainerRole.appendChild(noteNode);

            console.info('Appending ', noteNode, ' to ', this.#elements.notesContainerRole);
        });
    }

    #renderModals() {
        if (this.#data.currentlyEditedNote)
            this.#showModal('editNoteModalRole');
        else if (this.#data.currentlyRemovedNote)
            this.#showModal('deleteNoteModalRole');
        else
            this.#hideModal();
    }
}
