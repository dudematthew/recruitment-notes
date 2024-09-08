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
        this.#render(this.#previousData, this.#data);
        this.#setupEventListeners();
    }

    // TODO: Load data from Local Storage
    #initializeData() {
        return {
            /** @type {'add' | 'edit' | null} */
            currentOperation: null,

            /** @type {Array<Note>} */
            notes: [],
        };
    }

    /** 
     * @returns {{
     *   addButton: HTMLElement,
     *   addNoteForm: HTMLElement,
     *   searchInput: HTMLElement,
     *   notesContainer: HTMLElement,
     *   infoNotesEmpty: HTMLElement
     * }}
     */
    #initializeElements() {
        return {
            addButton: this.#el.querySelector('[data-action="toggle-add-note"]'),
            addNoteForm: this.#el.querySelector('[data-role="add-note"]'),
            searchInput: this.#el.querySelector('[data-role="search-input"]'),
            notesContainer: this.#el.querySelector('[data-role="notes-container"]'),
            infoNotesEmpty: this.#el.querySelector('[data-role="info-notes-empty"]'),
        };
    }

    // Make the app watch for any changes to the data object
    #makeReactive(data) {
        return new Proxy(data, {
            set: (target, prop, value) => {
                target[prop] = value;
                this.#handleDataChange(prop);
                return true;
            }
        });
    }

    #handleDataChange(prop) {
        const currentData = this.#data;
        this.#render(this.#previousData, currentData);
        // Update previousData to the current state after rendering
        this.#previousData = { ...currentData };
    }

    #setupEventListeners() {
        // this.#el.querySelector('.button--primary').addEventListener('click', () => {
        //     this.#toggleAddNoteVisibility();
        // });

        // this.#el.querySelector('.add-note .button--primary').addEventListener('click', () => {
        //     this.#addNewNote();
        // });

        // this.#el.querySelector('.search .input--search').addEventListener('input', (e) => {
        //     this.#filterNotes(e.target.value);
        // });
    }

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
    #render(previousData, currentData) {
        console.info('Rendering the app: ', currentData);
        this.#switchInfoIfNotesEmpty(currentData.notes.length == 0);
    }

    #switchInfoIfNotesEmpty(isEmpty) {
        this.#elements.addButton.classList.toggle('is-hidden', isEmpty);
        this.#elements.infoNotesEmpty.classList.toggle('is-hidden', !isEmpty);
    }
}
