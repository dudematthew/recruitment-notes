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

            // Roles
            addButtonRole: this.#el.querySelector('[data-role="add-note"]'),
            addNoteFormRole: this.#el.querySelector('[data-role="add-note-form"]'),
            newNoteFormTitle: this.#el.querySelector('[data-role="new-note-title"]'),
            newNoteFormContent: this.#el.querySelector('[data-role="new-note-content"]'),
            searchInputRole: this.#el.querySelector('[data-role="search-input"]'),
            notesContainerRole: this.#el.querySelector('[data-role="notes-container"]'),
            infoNotesEmptyRole: this.#el.querySelector('[data-role="info-notes-empty"]'),
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
            element.addEventListener(action, callback(element));
        });
    }

    #setupEventListeners() {
        // Add note action
        this.#addActionEventListener(this.#elements.addNoteAction, 'click', (e) => {
            e.addEventListener('click', (e) => {
                this.#data.ongoingAddNoteOperation = true;
            });
        })

        // Cancel adding note action
        this.#addActionEventListener(this.#elements.cancelAddNoteAction, 'click', (e) => {
            e.addEventListener('click', (e) => {
                this.#data.ongoingAddNoteOperation = false;
            });
        })

        // Submit new note
        this.#addActionEventListener(this.#elements.submitNewNoteAction, 'click', (e) => {
            e.addEventListener('click', (e) => {
                this.#data.ongoingAddNoteOperation = false;
                this.#submitNote();
            });
        })

        // this.#el.querySelector('.search .input--search').addEventListener('input', (e) => {
        //     this.#filterNotes(e.target.value);
        // });
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
            this.#handleDeleteNote(note.id); // Pass the unique ID
        });

        note.addEventListener('editNote', (event) => {
            // this.#handleEditNote(event.detail.title);
        });
    }

    #handleDeleteNote(noteId) {
        this.#data.notes = this.#data.notes.filter(note => note.id !== noteId);
        this.#render(); // Update the view after deletion
    }

    /**
     * Check if two values are different from each other
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

    // Looks for changes and rerenders app appriopriately
    #render() {
        const currentData = this.#data;
        const previousData = this.#previousData;

        console.info('Rendering the app: ', currentData);

        this.#renderAddNewForm(currentData.notes.length == 0, currentData.ongoingAddNoteOperation);

        this.#renderNotes(currentData.notes);
        console.log('NOTES CHANGED? ', this.#hasChanged(previousData.notes, currentData.notes));
    }

    #renderAddNewForm(isEmpty, ongoingAddNoteOperation) {
        const showEmptyInfo = isEmpty && !ongoingAddNoteOperation;
        const showAddForm = ongoingAddNoteOperation;
        const showAddButton = !ongoingAddNoteOperation && !isEmpty;

        this.#toggleVisibility(this.#elements.infoNotesEmptyRole, showEmptyInfo);
        this.#toggleVisibility(this.#elements.addButtonRole, showAddButton);
        this.#toggleVisibility(this.#elements.addNoteFormRole, showAddForm);
    }

    #renderNotes() {
        // Clear the notes container first to avoid duplicate rendering
        this.#elements.notesContainerRole.innerHTML = '';

        // Loop through the already existing note nodes in the data
        this.#data.notes.forEach(noteNode => {
            // Re-attach the existing note node to the container
            this.#elements.notesContainerRole.appendChild(noteNode);

            console.info('Appending ', noteNode, ' to ', this.#elements.notesContainerRole);
        });
    }

}
